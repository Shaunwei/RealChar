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

GREETING_TXT_MAP = {
    "en-US": "Hi, my friend, what brings you here today?",
    "es-ES": "Hola, mi amigo, ¿qué te trae por aquí hoy?",
    "fr-FR": "Salut mon ami, qu'est-ce qui t'amène ici aujourd'hui?",
    "de-DE": "Hallo mein Freund, was bringt dich heute hierher?",
    "it-IT": "Ciao amico mio, cosa ti porta qui oggi?",
    "pt-PT": "Olá meu amigo, o que te traz aqui hoje?",
    "hi-IN": "नमस्ते मेरे दोस्त, आज आपको यहां क्या लाया है?",
    "pl-PL": "Cześć mój przyjacielu, co cię tu dziś przynosi?",
}


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
                             language: str = Query(default='en-US'),
                             token: str = Query(None),
                             character_id: str = Query(None),
                             platform: str = Query(None),
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
            handle_receive(websocket, client_id, user_id, db, llm, catalog_manager,
                           character_id, platform,
                           speech_to_text, text_to_speech, language))

        await asyncio.gather(main_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"User #{user_id} left the chat")


async def handle_receive(websocket: WebSocket, client_id: int, user_id: str, db: Session,
                         llm: LLM, catalog_manager: CatalogManager,
                         character_id: str, platform: str,
                         speech_to_text: SpeechToText,
                         text_to_speech: TextToSpeech,
                         language: str):
    try:
        conversation_history = ConversationHistory()
        session_id = str(uuid.uuid4().hex)

        # 0. Receive client platform info (web, mobile, terminal)
        if not platform:
            data = await websocket.receive()
            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')
            platform = data['text']

        logger.info(f"User #{user_id}:{platform} connected to server with "
                    f"session_id {session_id}")

        # 1. User selected a character
        character = None
        if character_id:
            character = catalog_manager.get_character(
                character_id.replace('_', ' ').title())
        character_list = [character.name for character in catalog_manager.characters.values(
        ) if character.source != 'community']
        while not character:
            character_message = "\n".join([
                f"{i+1} - {character}"
                for i, character in enumerate(character_list)
            ])
            await manager.send_message(
                message=f"Select your character by entering the corresponding number:\n"
                f"{character_message}\n",
                websocket=websocket)
            data = await websocket.receive()

            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')

            if not character and 'text' in data:
                selection = int(data['text'])
                if selection > len(character_list) or selection < 1:
                    await manager.send_message(
                        message=f"Invalid selection. Select your character ["
                        f"{', '.join(catalog_manager.characters.keys())}]\n",
                        websocket=websocket)
                    continue
                character = catalog_manager.get_character(
                    character_list[selection - 1])
                character_id = character.name.replace(' ', '_').lower()

        conversation_history.system_prompt = character.llm_system_prompt
        user_input_template = character.llm_user_prompt
        logger.info(
            f"User #{user_id} selected character: {character.name}")

        tts_event = asyncio.Event()
        tts_task = None
        previous_transcript = None
        token_buffer = []

        # Greet the user
        greeting_text = GREETING_TXT_MAP[language]
        await manager.send_message(message=greeting_text, websocket=websocket)
        tts_task = asyncio.create_task(
            text_to_speech.stream(
                text=greeting_text,
                websocket=websocket,
                tts_event=tts_event,
                voice_id=character.voice_id,
                first_sentence=True,
                language=language
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

        use_search = False
        while True:
            data = await websocket.receive()
            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')
            # handle text message
            if 'text' in data:
                msg_data = data['text']
                # Handle client side commands
                if msg_data.startswith('[!'):
                    command_end = msg_data.find(']')
                    command = msg_data[2:command_end]
                    command_content = msg_data[command_end + 1:]
                    if command == 'USE_SEARCH':
                        use_search = (command_content == 'true')
                    continue
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
                                character.voice_id)))
                    continue
                # 1. Send message to LLM
                response = await llm.achat(
                    history=build_history(conversation_history),
                    user_input=msg_data,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackTextHandler(on_new_token,
                                                      token_buffer),
                    audioCallback=AsyncCallbackAudioHandler(
                        text_to_speech, websocket, tts_event, character.voice_id),
                    character=character,
                    useSearch=use_search)

                # 2. Send response to client
                await manager.send_message(message='[end]\n',
                                           websocket=websocket)

                # 3. Update conversation history
                conversation_history.user.append(msg_data)
                conversation_history.ai.append(response)
                token_buffer.clear()
                # 4. Persist interaction in the database
                tools = "search" if use_search else ""
                Interaction(client_id=client_id,
                            user_id=user_id,
                            session_id=session_id,
                            client_message_unicode=msg_data,
                            server_message_unicode=response,
                            platform=platform,
                            action_type='text',
                            character_id=character_id,
                            tools=tools,
                            language=language).save(db)

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
                    tools = "search" if use_search else ""
                    Interaction(client_id=client_id,
                                user_id=user_id,
                                session_id=session_id,
                                client_message_unicode=transcript,
                                server_message_unicode=response,
                                platform=platform,
                                action_type='audio',
                                character_id=character_id,
                                tools=tools,
                                language=language).save(db)

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
                                  character.voice_id),
                              character=character,
                              useSearch=use_search))

    except WebSocketDisconnect:
        logger.info(f"User #{user_id} closed the connection")
        await manager.disconnect(websocket)
        return
