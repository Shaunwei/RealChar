import asyncio
import os

from fastapi import APIRouter, Depends, Path, WebSocket, WebSocketDisconnect, Query
from requests import Session

from realtime_ai_character.audio.speech_to_text import (SpeechToText,
                                                        get_speech_to_text)
from realtime_ai_character.audio.text_to_speech import (TextToSpeech,
                                                        get_text_to_speech)
from realtime_ai_character.character_catalog.catalog_manager import (
    CatalogManager, get_catalog_manager)
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.llm import (AsyncCallbackAudioHandler,
                                       AsyncCallbackTextHandler, get_llm, LLM)
from realtime_ai_character.logger import get_logger
from realtime_ai_character.models.interaction import Interaction
from realtime_ai_character.utils import (ConversationHistory, build_history,
                                         get_connection_manager)


logger = get_logger(__name__)

router = APIRouter()

manager = get_connection_manager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
        websocket: WebSocket,
        client_id: int = Path(...),
        api_key: str = Query(None),
        db: Session = Depends(get_db),
        llm: LLM = Depends(get_llm),
        catalog_manager=Depends(get_catalog_manager),
        speech_to_text=Depends(get_speech_to_text),
        text_to_speech=Depends(get_text_to_speech)):
    # basic authentication
    if os.getenv('USE_AUTH', '') and api_key != os.getenv('AUTH_API_KEY'):
        await websocket.close(code=1008, reason="Unauthorized")
        return
    await manager.connect(websocket)
    try:
        main_task = asyncio.create_task(
            handle_receive(websocket, client_id, db, llm, catalog_manager, speech_to_text, text_to_speech))

        await asyncio.gather(main_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"Client #{client_id} left the chat")


async def handle_receive(
        websocket: WebSocket,
        client_id: int,
        db: Session,
        llm: LLM,
        catalog_manager: CatalogManager,
        speech_to_text: SpeechToText,
        text_to_speech: TextToSpeech):
    try:
        conversation_history = ConversationHistory()

        # 0. Receive client platform info (web, mobile, terminal)
        data = await websocket.receive()
        if data['type'] != 'websocket.receive':
            raise WebSocketDisconnect('disconnected')
        platform = data['text']
        logger.info(f"Client #{client_id}:{platform} connected to server")

        # 1. User selected a character
        character = None
        character_list = list(catalog_manager.characters.keys())
        user_input_template = 'Context:{context}\n User:{query}'
        while not character:
            character_message = "\n".join(
                [f"{i+1} - {character}" for i, character in enumerate(character_list)])
            await manager.send_message(
                message=f"Select your character by entering the corresponding number:\n{character_message}\n",
                websocket=websocket)
            data = await websocket.receive()

            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')

            if not character and 'text' in data:
                selection = int(data['text'])
                if selection > len(character_list) or selection < 1:
                    await manager.send_message(
                        message=f"Invalid selection. Select your character [{', '.join(catalog_manager.characters.keys())}]\n",
                        websocket=websocket)
                    continue
                character = catalog_manager.get_character(
                    character_list[selection - 1])
                conversation_history.system_prompt = character.llm_system_prompt
                user_input_template = character.llm_user_prompt
                logger.info(
                    f"Client #{client_id} selected character: {character.name}")

        tts_event = asyncio.Event()
        tts_task = None
        previous_transcript = None
        token_buffer = []

        async def on_new_token(token):
            return await manager.send_message(message=token, websocket=websocket)

        async def stop_audio():
            if tts_task and not tts_task.done():
                tts_event.set()
                tts_task.cancel()
                if previous_transcript:
                    conversation_history.user.append(previous_transcript)
                    conversation_history.ai.append(' '.join(token_buffer))
                    token_buffer.clear()
                try:
                    await tts_task
                except asyncio.CancelledError:
                    pass
                tts_event.clear()

        while True:
            data = await websocket.receive()
            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')

            # handle text message
            if 'text' in data:
                msg_data = data['text']
                # 0. itermidiate transcript starts with [&]
                if msg_data.startswith('[&]'):
                    logger.info(f'intermediate transcript: {msg_data}')
                    if not os.getenv('EXPERIMENT_CONVERSATION_UTTERANCE', ''):
                        continue
                    asyncio.create_task(stop_audio())
                    asyncio.create_task(llm.achat_utterances(
                        history=build_history(conversation_history),
                        user_input=msg_data,
                        callback=AsyncCallbackTextHandler(on_new_token, []),
                        audioCallback=AsyncCallbackAudioHandler(text_to_speech, websocket, tts_event, character.name)))
                    continue
                # 1. Send message to LLM
                response = await llm.achat(
                    history=build_history(conversation_history),
                    user_input=msg_data,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackTextHandler(
                        on_new_token, token_buffer),
                    audioCallback=AsyncCallbackAudioHandler(
                        text_to_speech, websocket, tts_event, character.name),
                    character=character)

                # 2. Send response to client
                await manager.send_message(message='[end]\n', websocket=websocket)

                # 3. Update conversation history
                conversation_history.user.append(msg_data)
                conversation_history.ai.append(response)
                token_buffer.clear()
                # 4. Persist interaction in the database
                Interaction(
                    client_id=client_id, client_message=msg_data, server_message=response).save(db)

            # handle binary message(audio)
            elif 'bytes' in data:
                binary_data = data['bytes']
                # 1. Transcribe audio
                transcript: str = speech_to_text.transcribe(
                    binary_data, platform=platform, prompt=character.name).strip()

                # ignore audio that picks up background noise
                if (not transcript or len(transcript) < 2):
                    continue

                # 2. Send transcript to client
                await manager.send_message(message=f'[+]You said: {transcript}', websocket=websocket)

                # 3. stop the previous audio stream, if new transcript is received
                await stop_audio()

                previous_transcript = transcript

                async def tts_task_done_call_back(response):
                    # Send response to client, [=] indicates the response is done
                    await manager.send_message(message='[=]', websocket=websocket)
                    # Update conversation history
                    conversation_history.user.append(transcript)
                    conversation_history.ai.append(response)
                    token_buffer.clear()
                    # Persist interaction in the database
                    Interaction(
                        client_id=client_id, client_message=transcript, server_message=response).save(db)

                # 4. Send message to LLM
                tts_task = asyncio.create_task(llm.achat(
                    history=build_history(conversation_history),
                    user_input=transcript,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackTextHandler(
                        on_new_token, token_buffer, tts_task_done_call_back),
                    audioCallback=AsyncCallbackAudioHandler(
                        text_to_speech, websocket, tts_event, character.name),
                    character=character)
                )

    except WebSocketDisconnect:
        logger.info(f"Client #{client_id} closed the connection")
        await manager.disconnect(websocket)
        return
