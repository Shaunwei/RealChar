import asyncio
import os
import uuid

from dataclasses import dataclass
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
from realtime_ai_character.memory.memory_manager import (MemoryManager, get_memory_manager)
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.llm import get_llm, LLM
from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, AsyncCallbackTextHandler
from realtime_ai_character.logger import get_logger
from realtime_ai_character.models.interaction import Interaction
from realtime_ai_character.models.quivr_info import QuivrInfo
from realtime_ai_character.utils import (ConversationHistory, build_history,
                                         get_connection_manager, get_timer)

logger = get_logger(__name__)

router = APIRouter()

manager = get_connection_manager()

timer = get_timer()

GREETING_TXT_MAP = {
    "en-US": "Hi, my friend, what brings you here today?",
    "es-ES": "Hola, mi amigo, ¿qué te trae por aquí hoy?",
    "fr-FR": "Salut mon ami, qu'est-ce qui t'amène ici aujourd'hui?",
    "de-DE": "Hallo mein Freund, was bringt dich heute hierher?",
    "it-IT": "Ciao amico mio, cosa ti porta qui oggi?",
    "pt-PT": "Olá meu amigo, o que te traz aqui hoje?",
    "hi-IN": "नमस्ते मेरे दोस्त, आज आपको यहां क्या लाया है?",
    "pl-PL": "Cześć mój przyjacielu, co cię tu dziś przynosi?",
    "zh-CN": "嗨，我的朋友，今天你为什么来这里？",
    'ja-JP': "こんにちは、私の友達、今日はどうしたの？",
    'ko-KR': "안녕, 내 친구, 오늘 여기 왜 왔어?"
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

@dataclass
class SessionAuthResult:
    is_existing_session: bool
    is_authenticated_user: bool


async def check_session_auth(session_id: str, user_id: str, db: Session) -> SessionAuthResult:
    """
    Helper function to check if the session is authenticated.
    """
    if not os.getenv('USE_AUTH', ''):
        return SessionAuthResult(
            is_existing_session=False,
            is_authenticated_user=True,
        )
    try:
        original_chat = await asyncio.to_thread(
            db.query(Interaction).filter(Interaction.session_id == session_id).first)
    except Exception as e:
        logger.info(f'Failed to lookup session {session_id} with error {e}')
        return SessionAuthResult(
            is_existing_session=False,
            is_authenticated_user=False,
        )
    if not original_chat:
        # Continue with a new session.
        return SessionAuthResult(
            is_existing_session=False,
            is_authenticated_user=True,
        )
    if original_chat.user_id == user_id:
        return SessionAuthResult(
            is_existing_session=True,
            is_authenticated_user=True,
        )
    return SessionAuthResult(
            is_existing_session=True,
            is_authenticated_user=False,
    )

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket,
                             session_id: str = Path(...),
                             api_key: str = Query(None),
                             llm_model: str = Query(default=os.getenv(
                                 'LLM_MODEL_USE', 'gpt-3.5-turbo-16k')),
                             language: str = Query(default='en-US'),
                             token: str = Query(None),
                             character_id: str = Query(None),
                             platform: str = Query(None),
                             use_search: bool = Query(default=False),
                             use_quivr: bool = Query(default=False),
                             use_multion: bool = Query(default=False),
                             db: Session = Depends(get_db),
                             catalog_manager=Depends(get_catalog_manager),
                             memory_manager=Depends(get_memory_manager),
                             speech_to_text=Depends(get_speech_to_text),
                             default_text_to_speech=Depends(get_text_to_speech)):
    # Default user_id to session_id. If auth is enabled and token is provided, use
    # the user_id from the token.
    user_id = str(session_id)
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
    session_auth_result = await check_session_auth(session_id=session_id, user_id=user_id, db=db)
    if not session_auth_result.is_authenticated_user:
        logger.info(f'User #{user_id} is not authorized to access session {session_id}')
        await websocket.close(code=1008, reason="Unauthorized")
        return

    llm = get_llm(model=llm_model)
    await manager.connect(websocket)
    try:
        main_task = asyncio.create_task(
            handle_receive(websocket, session_id, user_id, db, llm, catalog_manager,
                           memory_manager, character_id, platform, use_search, use_quivr,
                           use_multion, speech_to_text, default_text_to_speech, language,
                           session_auth_result.is_existing_session))

        await asyncio.gather(main_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"User #{user_id} left the chat")


async def handle_receive(websocket: WebSocket, session_id: str, user_id: str, db: Session,
                         llm: LLM, catalog_manager: CatalogManager, memory_manager: MemoryManager,
                         character_id: str, platform: str, use_search: bool, use_quivr: bool,
                         use_multion: bool, speech_to_text: SpeechToText,
                         default_text_to_speech: TextToSpeech,
                         language: str, load_from_existing_session: bool = False):
    try:
        conversation_history = ConversationHistory()
        if load_from_existing_session:
            logger.info(f"User #{user_id} is loading from existing session {session_id}")
            await asyncio.to_thread(conversation_history.load_from_db, session_id=session_id, db=db)

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
            character = catalog_manager.get_character(character_id)
        character_list = [(character.name, character.character_id)
                          for character in catalog_manager.characters.values()
                          if character.source != 'community']
        character_name_list, character_id_list = zip(*character_list)
        while not character:
            character_message = "\n".join([
                f"{i+1} - {character}"
                for i, character in enumerate(character_name_list)
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
                    character_id_list[selection - 1])
                character_id = character_id_list[selection - 1]

        if character.tts:
            text_to_speech = get_text_to_speech(character.tts)
        else:
            text_to_speech = default_text_to_speech

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

        speech_recognition_interim = False
        current_speech = ''

        while True:
            data = await websocket.receive()
            if data['type'] != 'websocket.receive':
                raise WebSocketDisconnect('disconnected')
            # handle text message
            if 'text' in data:
                timer.start("LLM First Token")
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
                # 1. Whether client will send speech interim audio clip in the next message.
                if msg_data.startswith('[&Speech]'):
                    speech_recognition_interim = True
                    continue

                # 2. If client finished speech, use the sentence as input.
                if msg_data.startswith('[SpeechFinished]'):
                    msg_data = current_speech
                    logger.info(f"Full transcript: {current_speech}")
                    # Stop recognizing next audio as interim.
                    speech_recognition_interim = False
                    # Filter noises
                    if not current_speech:
                        continue

                    await manager.send_message(
                        message=f'[+]You said: {current_speech}', websocket=websocket)
                    current_speech = ''

                # 2. Send "thinking" status over websocket
                if use_search or use_quivr:
                    await manager.send_message(message='[thinking]\n',
                                               websocket=websocket)

                # 3. Send message to LLM
                if use_quivr:
                    quivr_info = await asyncio.to_thread(
                        db.query(QuivrInfo).filter(QuivrInfo.user_id == user_id).first)
                else:
                    quivr_info = None
                message_id = str(uuid.uuid4().hex)[:16]
                response = await llm.achat(
                    history=build_history(conversation_history),
                    user_input=msg_data,
                    user_input_template=user_input_template,
                    callback=AsyncCallbackTextHandler(on_new_token,
                                                      token_buffer),
                    audioCallback=AsyncCallbackAudioHandler(
                        text_to_speech, websocket, tts_event, character.voice_id),
                    character=character,
                    useSearch=use_search,
                    useQuivr=use_quivr,
                    quivrApiKey=quivr_info.quivr_api_key if quivr_info else None,
                    quivrBrainId=quivr_info.quivr_brain_id if quivr_info else None,
                    useMultiOn=use_multion,
                    metadata={"message_id": message_id})

                # 3. Send response to client
                await manager.send_message(message=f'[end={message_id}]\n',
                                           websocket=websocket)

                # 4. Update conversation history
                conversation_history.user.append(msg_data)
                conversation_history.ai.append(response)
                token_buffer.clear()
                # 5. Persist interaction in the database
                tools = []
                if use_search:
                    tools.append('search')
                if use_quivr:
                    tools.append('quivr')
                if use_multion:
                    tools.append('multion')
                interaction = Interaction(user_id=user_id,
                            session_id=session_id,
                            client_message_unicode=msg_data,
                            server_message_unicode=response,
                            platform=platform,
                            action_type='text',
                            character_id=character_id,
                            tools=','.join(tools),
                            language=language,
                            message_id=message_id,
                            llm_config=llm.get_config())
                await asyncio.to_thread(interaction.save, db)

            # handle binary message(audio)
            elif 'bytes' in data:
                binary_data = data['bytes']
                # 0. Handle interim speech.
                if speech_recognition_interim:
                    interim_transcript: str = (
                        await asyncio.to_thread(
                            speech_to_text.transcribe,
                            binary_data,
                            platform=platform,
                            prompt=current_speech,
                            suppress_tokens=[0, 11, 13, 30],
                        )
                    ).strip()
                    speech_recognition_interim = False
                    # Filter noises.
                    if not interim_transcript:
                        continue
                    logger.info(f"Speech interim: {interim_transcript}")
                    current_speech = current_speech + ' ' + interim_transcript
                    continue

                # 1. Transcribe audio
                transcript: str = (await asyncio.to_thread(speech_to_text.transcribe,
                    binary_data, platform=platform,
                    prompt=character.name)).strip()

                # ignore audio that picks up background noise
                if (not transcript or len(transcript) < 2):
                    continue

                # start counting time for LLM to generate the first token
                timer.start("LLM First Token")

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
                    tools = []
                    if use_search:
                        tools.append('search')
                    if use_quivr:
                        tools.append('quivr')
                    if use_multion:
                        tools.append('multion')
                    interaction = Interaction(user_id=user_id,
                                session_id=session_id,
                                client_message_unicode=transcript,
                                server_message_unicode=response,
                                platform=platform,
                                action_type='audio',
                                character_id=character_id,
                                tools=','.join(tools),
                                language=language,
                                llm_config=llm.get_config())
                    await asyncio.to_thread(interaction.save, db)

                # 4. Send "thinking" status over websocket
                if use_search or use_quivr:
                    await manager.send_message(message='[thinking]\n',
                                               websocket=websocket)

                # 5. Send message to LLM
                if use_quivr:
                    quivr_info = await asyncio.to_thread(
                        db.query(QuivrInfo).filter(QuivrInfo.user_id == user_id).first)
                else:
                    quivr_info = None
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
                              useSearch=use_search,
                              useQuivr=use_quivr,
                              useMultiOn=use_multion,
                              quivrApiKey=quivr_info.quivr_api_key if quivr_info else None,
                              quivrBrainId=quivr_info.quivr_brain_id if quivr_info else None))
                
            # log latency info
            timer.report()

    except WebSocketDisconnect:
        logger.info(f"User #{user_id} closed the connection")
        timer.reset()
        await manager.disconnect(websocket)
        await memory_manager.process_session(session_id)
        return
