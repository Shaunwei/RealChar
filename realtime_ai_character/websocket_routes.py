import asyncio
import time
import wave
from typing import List

from fastapi import APIRouter, Depends, Path, WebSocket, WebSocketDisconnect
from requests import Session
from starlette.websockets import WebSocketState

from realtime_ai_character.audio.speech_to_text.whisper import (
    Whisper, get_speech_to_text)
from realtime_ai_character.audio.text_to_speech.elevenlabs import (
    ElevenLabs, get_text_to_speech)
from realtime_ai_character.companion_catalog.catalog_manager import (
    CatalogManager, get_catalog_manager)
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.llm.openai_llm import (AsyncCallbackHandler,
                                                  AsyncCallbackAudioHandler,
                                                  OpenaiLlm, get_llm)
from realtime_ai_character.logger import get_logger
from realtime_ai_character.models.interaction import Interaction
from realtime_ai_character.utils import (ConversationHistory,
                                         get_connection_manager)

logger = get_logger(__name__)

router = APIRouter()

manager = get_connection_manager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
        websocket: WebSocket,
        client_id: int = Path(...),
        db: Session = Depends(get_db),
        llm: OpenaiLlm = Depends(get_llm),
        catalog_manager=Depends(get_catalog_manager),
        speech_to_text=Depends(get_speech_to_text),
        text_to_speech=Depends(get_text_to_speech)):
    await manager.connect(websocket)
    try:
        receive_task = asyncio.create_task(
            handle_receive(websocket, client_id, db, llm, catalog_manager, speech_to_text, text_to_speech))
        send_task = asyncio.create_task(send_generated_numbers(websocket))

        await asyncio.gather(receive_task, send_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"Client #{client_id} left the chat")


async def handle_receive(
        websocket: WebSocket,
        client_id: int,
        db: Session,
        llm: OpenaiLlm,
        catalog_manager: CatalogManager,
        speech_to_text: Whisper,
        text_to_speech: ElevenLabs):
    try:
        conversation_history = ConversationHistory(
            system_prompt='',
            user=[],
            ai=[]
        )
        user_input_template = 'Context:{context}\n User:{query}'

        async def on_new_token(token):
            return await manager.send_message(message=token, websocket=websocket)

        # 1. User selected a companion
        companion = None
        companion_list = list(catalog_manager.companions.keys())
        while not companion:
            companion_message = "\n".join(
                [f"{i+1} - {companion}" for i, companion in enumerate(companion_list)])
            await manager.send_message(message=f"Select your companion by entering the corresponding number:\n{companion_message}\n", websocket=websocket)
            data = await websocket.receive()

            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')

            if not companion and 'text' in data:
                selection = int(data['text'])
                if selection > len(companion_list) or selection < 1:
                    await manager.send_message(message=f"Invalid selection. Select your companion [{', '.join(catalog_manager.companions.keys())}]\n", websocket=websocket)
                    continue
                companion = catalog_manager.get_companion(
                    companion_list[selection - 1])
                conversation_history.system_prompt = companion.llm_system_prompt
                user_input_template = companion.llm_user_prompt
                logger.info(
                    f"Client #{client_id} selected companion: {companion.name}")

        tts_event = asyncio.Event()
        tts_task = None
        tts_task_done = None
        previous_transcript = None
        token_buffer = []
        while True:
            data = await websocket.receive()
            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')

            if 'text' in data:
                msg_data = data['text']
                # 2. Send message to LLM
                response = await llm.achat(
                    history=llm.build_history(conversation_history),
                    user_input=msg_data,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackHandler(on_new_token, token_buffer),
                    audioCallback=AsyncCallbackAudioHandler(
                        text_to_speech, websocket, tts_event, companion.name),
                    companion=companion)

                # 3. Send response to client
                await manager.send_message(message='[end]\n', websocket=websocket)

                # 4. Update conversation history
                conversation_history.user.append(msg_data)
                conversation_history.ai.append(response)

                # 5. Persist interaction in the database
                interaction = Interaction(
                    client_id=client_id, client_message=msg_data, server_message=response)
                db.add(interaction)
                db.commit()
            elif 'bytes' in data:
                # Here is where you handle binary messages (like audio data).
                binary_data = data['bytes']
                print(len(binary_data))
                start = time.time()
                print('transimission time: ', start)
                transcript = speech_to_text.transcribe(binary_data)
                end = time.time()
                print('transcription time: ', end)
                print('Total time: ', end - start)
                print(transcript)

                # ignore audio that picks up background noise
                if not transcript or len(transcript) < 2:
                    continue
                await manager.send_message(message=f'\n[+]You said: {transcript}', websocket=websocket)
                # stop the previous audio stream, if new transcript is received
                if tts_task and not tts_task.done():
                    tts_event.set()
                    tts_task.cancel()
                    if tts_task_done and not tts_task_done.done():
                        tts_task_done.cancel()
                    if previous_transcript:
                        response = ' '.join(token_buffer)
                        conversation_history.user.append(previous_transcript)
                        conversation_history.ai.append(' '.join(token_buffer))
                        token_buffer.clear()
                    try:
                        await tts_task
                        await tts_task_done
                    except asyncio.CancelledError:
                        pass

                    tts_event.clear()

                previous_transcript = transcript
                # 2. Send message to LLM
                tts_task = asyncio.create_task(llm.achat(
                    history=llm.build_history(conversation_history),
                    user_input=transcript,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackHandler(on_new_token),
                    audioCallback=AsyncCallbackAudioHandler(
                        text_to_speech, websocket, tts_event, companion.name),
                    companion=companion)
                )

                async def tts_task_done_call_back(task):
                    response = await task
                    # 3. Send response to client
                    await manager.send_message(message='[=]\n', websocket=websocket)
                    # 4. Update conversation history
                    conversation_history.user.append(transcript)
                    conversation_history.ai.append(response)
                    token_buffer.clear()
                    # 5. Persist interaction in the database
                    interaction = Interaction(
                        client_id=client_id, client_message=transcript, server_message=response)
                    db.add(interaction)
                    db.commit()

                # Schedule the callback with another task
                tts_task_done = asyncio.create_task(
                    tts_task_done_call_back(tts_task))

    except WebSocketDisconnect:
        logger.info(f"Client #{client_id} closed the connection")
        await manager.disconnect(websocket)
        return


async def send_generated_numbers(websocket: WebSocket):
    index = 1
    try:
        while True:
            # await manager.send_message(f"Generated Number: {index}", websocket)
            index += 1
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        logger.info("Connection closed while sending generated numbers.")
