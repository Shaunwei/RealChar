import asyncio
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, WebSocket, WebSocketDisconnect, Query
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError

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

GREETING_TXT = 'Hi, my friend, what brings you here today?'


async def get_current_user(token: str):
    """Heler function for auth with Firebase."""
    if not token:
        return ""
    try:
        decoded_token = auth.verify_id_token(token)
    except FirebaseError as e:
        logger.info(f'Receveid invalid token: {token} with error {e}')
        raise HTTPException(status_code=401,
                            detail="Invalid authentication credentials")

    return decoded_token['uid']


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket,
                             client_id: int = Path(...),
                             api_key: str = Query(None),
                             llm_model: str = Query(default=os.getenv(
                                'LLM_MODEL_USE', 'gpt-3.5-turbo-16k')),
                             token: str = Query(None),
                             db: Session = Depends(get_db),
                             catalog_manager=Depends(get_catalog_manager),
                             speech_to_text=Depends(get_speech_to_text),
                             text_to_speech=Depends(get_text_to_speech)):
    # Default user_id to client_id. If auth is enabled and token is provided, use
    # the user_id from the token.
    user_id = str(client_id)
    if os.getenv('USE_AUTH', ''):
        # Do not allow anonymous users to use non-GPT3.5 model.
        if not token and llm_model != 'gpt-3.5-turbo-16k':
            await websocket.close(code=1008, reason="Unauthorized")
            return
        try:
            user_id = await get_current_user(token)
        except HTTPException:
            await websocket.close(code=1008, reason="Unauthorized")
            return
    llm = get_llm(model=llm_model)
    await manager.connect(websocket)
    try:
        main_task = asyncio.create_task(
            handle_receive(websocket, client_id, db, llm, catalog_manager,
                           speech_to_text, text_to_speech))

        await asyncio.gather(main_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"User #{user_id} left the chat")


async def handle_receive(websocket: WebSocket, client_id: int, db: Session,
                         llm: LLM, catalog_manager: CatalogManager,
                         speech_to_text: SpeechToText,
                         text_to_speech: TextToSpeech):
    try:
        conversation_history = ConversationHistory()
        # TODO: clean up client_id once migration is done.
        user_id = str(client_id)
        session_id = str(uuid.uuid4().hex)

        # 0. Receive client platform info (web, mobile, terminal)
        data = await websocket.receive()
        if data['type'] != 'websocket.receive':
            raise WebSocketDisconnect('disconnected')
        platform = data['text']
        logger.info(f"User #{user_id}:{platform} connected to server with "
                    f"session_id {session_id}")

        # 1. User selected a character
        character = None
        character_list = list(catalog_manager.characters.keys())
        user_input_template = 'Context:{context}\n User:{query}'
        while not character:
            character_message = "\n".join([
                f"{i+1} - {character}"
                for i, character in enumerate(character_list)
            ])
            await manager.send_message(
                message=
                f"Select your character by entering the corresponding number:\n"
                f"{character_message}\n",
                websocket=websocket)
            data = await websocket.receive()

            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')

            if not character and 'text' in data:
                selection = int(data['text'])
                if selection > len(character_list) or selection < 1:
                    await manager.send_message(
                        message=
                        f"Invalid selection. Select your character ["
                        f"{', '.join(catalog_manager.characters.keys())}]\n",
                        websocket=websocket)
                    continue
                character = catalog_manager.get_character(
                    character_list[selection - 1])
                conversation_history.system_prompt = character.llm_system_prompt
                user_input_template = character.llm_user_prompt
                logger.info(
                    f"User #{user_id} selected character: {character.name}")

        tts_event = asyncio.Event()
        tts_task = None
        previous_transcript = None
        token_buffer = []

        # Greet the user
        await manager.send_message(message=GREETING_TXT, websocket=websocket)
        tts_task = asyncio.create_task(
            text_to_speech.stream(
                text=GREETING_TXT,
                websocket=websocket,
                tts_event=tts_event,
                characater_name=character.name,
                first_sentence=True,
            ))
        # Send end of the greeting so the client knows when to start listening
        await manager.send_message(message='[end]\n', websocket=websocket)

        async def on_new_token(token):
            return await manager.send_message(message=token,
                                              websocket=websocket)

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
                    asyncio.create_task(
                        llm.achat_utterances(
                            history=build_history(conversation_history),
                            user_input=msg_data,
                            callback=AsyncCallbackTextHandler(
                                on_new_token, []),
                            audioCallback=AsyncCallbackAudioHandler(
                                text_to_speech, websocket, tts_event,
                                character.name)))
                    continue
                # 1. Send message to LLM
                response = await llm.achat(
                    history=build_history(conversation_history),
                    user_input=msg_data,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackTextHandler(on_new_token,
                                                      token_buffer),
                    audioCallback=AsyncCallbackAudioHandler(
                        text_to_speech, websocket, tts_event, character.name),
                    character=character)

                # 2. Send response to client
                await manager.send_message(message='[end]\n',
                                           websocket=websocket)

                # 3. Update conversation history
                conversation_history.user.append(msg_data)
                conversation_history.ai.append(response)
                token_buffer.clear()
                # 4. Persist interaction in the database
                Interaction(client_id=client_id,
                            user_id=user_id,
                            session_id=session_id,
                            client_message_unicode=msg_data,
                            server_message_unicode=response,
                            platform=platform,
                            action_type='text').save(db)

            # handle binary message(audio)
            elif 'bytes' in data:
                binary_data = data['bytes']
                # 1. Transcribe audio
                transcript: str = speech_to_text.transcribe(
                    binary_data, platform=platform,
                    prompt=character.name).strip()

                # ignore audio that picks up background noise
                if (not transcript or len(transcript) < 2):
                    continue

                # 2. Send transcript to client
                await manager.send_message(
                    message=f'[+]You said: {transcript}', websocket=websocket)

                # 3. stop the previous audio stream, if new transcript is received
                await stop_audio()

                previous_transcript = transcript

                async def tts_task_done_call_back(response):
                    # Send response to client, [=] indicates the response is done
                    await manager.send_message(message='[=]',
                                               websocket=websocket)
                    # Update conversation history
                    conversation_history.user.append(transcript)
                    conversation_history.ai.append(response)
                    token_buffer.clear()
                    # Persist interaction in the database
                    Interaction(client_id=client_id,
                                user_id=user_id,
                                session_id=session_id,
                                client_message_unicode=transcript,
                                server_message_unicode=response,
                                platform=platform,
                                action_type='audio').save(db)

                # 4. Send message to LLM
                tts_task = asyncio.create_task(
                    llm.achat(history=build_history(conversation_history),
                              user_input=transcript,
                              user_input_template=user_input_template,
                              callback=AsyncCallbackTextHandler(
                                  on_new_token, token_buffer,
                                  tts_task_done_call_back),
                              audioCallback=AsyncCallbackAudioHandler(
                                  text_to_speech, websocket, tts_event,
                                  character.name),
                              character=character))

    except WebSocketDisconnect:
        logger.info(f"User #{user_id} closed the connection")
        await manager.disconnect(websocket)
        return
