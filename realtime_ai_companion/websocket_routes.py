import time
import wave
import asyncio
from fastapi import Depends, Path, WebSocket, WebSocketDisconnect, APIRouter
from typing import List
from requests import Session
from starlette.websockets import WebSocketState
from realtime_ai_companion.audio.speech_to_text.whisper import Whisper, get_speech_to_text
from realtime_ai_companion.logger import get_logger
from realtime_ai_companion.database.connection import get_db
from realtime_ai_companion.models.interaction import Interaction
from realtime_ai_companion.llm.openai_llm import OpenaiLlm, AsyncCallbackHandler, get_llm
from realtime_ai_companion.utils import ConversationHistory, get_connection_manager
from realtime_ai_companion.companion_catalog.catalog_manager import CatalogManager, get_catalog_manager

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
        speech_to_text=Depends(get_speech_to_text)):
    await manager.connect(websocket)
    try:
        receive_task = asyncio.create_task(
            receive_and_echo_client_message(websocket, client_id, db, llm, catalog_manager, speech_to_text))
        send_task = asyncio.create_task(send_generated_numbers(websocket))

        done, pending = await asyncio.wait(
            [receive_task, send_task],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in done:
            # This will re-raise the exception if one was raised within the task.
            if exc := task.exception():
                print(
                    f"Task {task.get_name()} raised exception: {exc}")

        for task in pending:
            task.cancel()

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"Client #{client_id} left the chat")


async def receive_and_echo_client_message(
        websocket: WebSocket,
        client_id: int,
        db: Session,
        llm: OpenaiLlm,
        catalog_manager: CatalogManager,
        speech_to_text: Whisper):
    try:
        conversation_history = ConversationHistory(
            system_prompt='',
            user=[],
            ai=[]
        )
        user_input_template = 'Context:{context}\n User:{query}'

        async def on_new_token(token):
            return await manager.send_message(message=token, websocket=websocket)

        await manager.send_message(message=f"Select your companion [{', '.join(catalog_manager.companions.keys())}]\n", websocket=websocket)

        while True:
            data = await websocket.receive()
            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')

            if 'text' in data:
                msg_data = data['text']
                # 1. Check if the user selected a companion
                if msg_data in catalog_manager.companions.keys():
                    companion = catalog_manager.get_companion(msg_data)
                    conversation_history.system_prompt = companion.llm_system_prompt
                    user_input_template = companion.llm_user_prompt
                    logger.info(
                        f"Client #{client_id} selected companion: {msg_data}")
                    continue
                logger.info(f"Client #{client_id} said: {msg_data}")

                # 2. Send message to LLM
                response = await llm.achat(
                    history=llm.build_history(conversation_history),
                    user_input=msg_data,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackHandler(on_new_token),
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
                # wf.writeframes(binary_data)
                # await manager.send_message(message='Received audio data', websocket=websocket)
                transcript = speech_to_text.transcribe(binary_data)
                # record transcription time
                end = time.time()
                print('transcription time: ', end)
                print('Total time: ', end - start)
                print(transcript)
                await manager.send_message(message=transcript, websocket=websocket)
                continue

    except WebSocketDisconnect:
        logger.info(f"Client #{client_id} closed the connection")
        await manager.disconnect(websocket)
        # wf.close()
        # Remember to close the file when you're done.
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
