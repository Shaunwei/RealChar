import asyncio
import os
import uuid
import time
from dataclasses import dataclass

from fastapi import APIRouter, Depends, HTTPException, Path, Query, WebSocket, WebSocketDisconnect
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError
from sqlalchemy.orm import Session

from realtime_ai_character.audio.speech_to_text import get_speech_to_text, SpeechToText
from realtime_ai_character.audio.text_to_speech import get_text_to_speech, TextToSpeech
from realtime_ai_character.character_catalog.catalog_manager import (
    CatalogManager,
    get_catalog_manager,
)
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.llm import get_llm, LLM
from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, AsyncCallbackTextHandler
from realtime_ai_character.logger import get_logger
from realtime_ai_character.models.interaction import Interaction
from realtime_ai_character.utils import (
    build_history,
    ConversationHistory,
    get_connection_manager,
    get_timer,
    task_done_callback,
    Transcript,
)


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
    "ja-JP": "こんにちは、私の友達、今日はどうしたの？",
    "ko-KR": "안녕, 내 친구, 오늘 여기 왜 왔어?",
}


async def get_current_user(token: str):
    """Heler function for auth with Firebase."""
    try:
        decoded_token = auth.verify_id_token(token)
    except FirebaseError as e:
        logger.info(f"Receveid invalid token: {token} with error {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    return decoded_token["uid"]


@dataclass
class SessionAuthResult:
    is_existing_session: bool
    is_authenticated_user: bool


async def check_session_auth(session_id: str, user_id: str, db: Session) -> SessionAuthResult:
    """
    Helper function to check if the session is authenticated.
    """
    if os.getenv("USE_AUTH") != "true":
        return SessionAuthResult(
            is_existing_session=False,
            is_authenticated_user=True,
        )
    try:
        original_chat = await asyncio.to_thread(
            db.query(Interaction).filter(Interaction.session_id == session_id).first
        )
    except Exception as e:
        logger.info(f"Failed to lookup session {session_id} with error {e}")
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
    is_authenticated_user = original_chat.user_id == user_id
    return SessionAuthResult(
        is_existing_session=True,
        is_authenticated_user=is_authenticated_user,  # type: ignore
    )


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str = Path(...),
    llm_model: str = Query("gpt-3.5-turbo-16k"),
    language: str = Query("en-US"),
    token: str = Query(None),
    character_id: str = Query(None),
    platform: str = Query(None),
    journal_mode: bool = Query(False),
    db: Session = Depends(get_db),
    catalog_manager=Depends(get_catalog_manager),
    speech_to_text=Depends(get_speech_to_text),
    default_text_to_speech=Depends(get_text_to_speech),
):
    # Default user_id to session_id. If auth is enabled and token is provided, use
    # the user_id from the token.
    user_id = str(session_id)
    if os.getenv("USE_AUTH") == "true":
        # Do not allow anonymous users to use advanced model.
        if token:
            try:
                user_id = await get_current_user(token)
                logger.info(f"User #{user_id} is authenticated")
            except HTTPException:
                await websocket.close(code=1008, reason="Unauthorized")
                return
        elif llm_model != "rebyte":
            await websocket.close(code=1008, reason="Unauthorized")
            return
    session_auth_result = await check_session_auth(session_id=session_id, user_id=user_id, db=db)
    if not session_auth_result.is_authenticated_user:
        logger.info(f"User #{user_id} is not authorized to access session {session_id}")
        await websocket.close(code=1008, reason="Unauthorized")
        return
    logger.info(f"User #{user_id} is authorized to access session {session_id}")

    llm = get_llm(model=llm_model)
    await manager.connect(websocket)
    try:
        main_task = asyncio.create_task(
            handle_receive(
                websocket,
                session_id,
                user_id,
                db,
                llm,
                catalog_manager,
                character_id,
                platform,
                journal_mode,
                speech_to_text,
                default_text_to_speech,
                language,
                session_auth_result.is_existing_session,
            )
        )
        await asyncio.gather(main_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"User #{user_id} left the chat")


async def handle_receive(
    websocket: WebSocket,
    session_id: str,
    user_id: str,
    db: Session,
    llm: LLM,
    catalog_manager: CatalogManager,
    character_id: str,
    platform: str,
    journal_mode: bool,
    speech_to_text: SpeechToText,
    default_text_to_speech: TextToSpeech,
    language: str,
    load_from_existing_session: bool = False,
):
    try:
        conversation_history = ConversationHistory()
        if load_from_existing_session:
            logger.info(f"User #{user_id} is loading from existing session {session_id}")
            await asyncio.to_thread(conversation_history.load_from_db, session_id=session_id, db=db)

        # 0. Receive client platform info (web, mobile, terminal)
        if not platform:
            data = await websocket.receive()
            if data["type"] != "websocket.receive":
                raise WebSocketDisconnect(reason="disconnected")
            platform = data["text"]

        logger.info(
            f"User #{user_id}:{platform} connected to server with " f"session_id {session_id}"
        )

        # 1. User selected a character
        character = None
        if character_id:
            character = catalog_manager.get_character(character_id)
        character_list = [
            (character.name, character.character_id)
            for character in catalog_manager.characters.values()
            if character.source != "community"
        ]
        character_name_list, character_id_list = zip(*character_list)
        while not character:
            character_message = "\n".join(
                [f"{i+1} - {character}" for i, character in enumerate(character_name_list)]
            )
            await manager.send_message(
                message=f"Select your character by entering the corresponding number:\n"
                f"{character_message}\n",
                websocket=websocket,
            )
            data = await websocket.receive()

            if data["type"] != "websocket.receive":
                raise WebSocketDisconnect(reason="disconnected")

            if not character and "text" in data:
                selection = int(data["text"])
                if selection > len(character_list) or selection < 1:
                    await manager.send_message(
                        message=f"Invalid selection. Select your character ["
                        f"{', '.join(catalog_manager.characters.keys())}]\n",
                        websocket=websocket,
                    )
                    continue
                character = catalog_manager.get_character(character_id_list[selection - 1])
                character_id = character_id_list[selection - 1]

        if character.tts:
            text_to_speech = get_text_to_speech(character.tts)
        else:
            text_to_speech = default_text_to_speech

        conversation_history.system_prompt = character.llm_system_prompt
        logger.info(f"User #{user_id} selected character: {character.name}")

        tts_event = asyncio.Event()
        tts_task = None
        previous_transcript = None
        token_buffer = []

        # Greet the user
        greeting_text = GREETING_TXT_MAP[language if language else "en-US"]
        await manager.send_message(message=greeting_text, websocket=websocket)
        tts_task = asyncio.create_task(
            text_to_speech.stream(
                text=greeting_text,
                websocket=websocket,
                tts_event=tts_event,
                voice_id=character.voice_id,
                first_sentence=True,
                language=language,
                priority=0,
            )
        )
        tts_task.add_done_callback(task_done_callback)
        # Send end of the greeting so the client knows when to start listening
        await manager.send_message(message="[end]\n", websocket=websocket)

        async def on_new_token(token):
            return await manager.send_message(message=token, websocket=websocket)

        async def stop_audio():
            if tts_task and not tts_task.done():
                tts_event.set()
                tts_task.cancel()
                if previous_transcript:
                    conversation_history.user.append(previous_transcript)
                    conversation_history.ai.append(" ".join(token_buffer))
                    token_buffer.clear()
                try:
                    await tts_task
                except asyncio.CancelledError:
                    pass
                tts_event.clear()

        speech_recognition_interim = False
        current_speech = ""

        journal_mode = False
        journal_history: list[Transcript] = []
        audio_cache: list[Transcript] = []
        speaker_audio_samples = {}

        while True:
            data = await websocket.receive()
            if data["type"] != "websocket.receive":
                raise WebSocketDisconnect(reason="disconnected")

            # show latency info
            timer.report()

            # handle text message
            if "text" in data:
                timer.start("LLM First Token")
                msg_data = data["text"]
                # Handle client side commands
                if msg_data.startswith("[!"):
                    command_end = msg_data.find("]")
                    command = msg_data[2:command_end]
                    command_content = msg_data[command_end + 1 :]
                    if command == "JOURNAL_MODE":
                        journal_mode = command_content == "true"
                    elif command == "ADD_SPEAKER":
                        speaker_audio_samples[command_content] = None
                    elif command == "DELETE_SPEAKER":
                        if command_content in speaker_audio_samples:
                            del speaker_audio_samples[command_content]
                            logger.info(f"Deleted speaker: {command_content}")
                    continue

                # 1. Whether client will send speech interim audio clip in the next message.
                if msg_data.startswith("[&Speech]"):
                    speech_recognition_interim = True
                    # stop the previous audio stream, if new transcript is received
                    await stop_audio()
                    continue

                # 2. If client finished speech, use the sentence as input.
                if msg_data.startswith("[SpeechFinished]"):
                    msg_data = current_speech
                    logger.info(f"Full transcript: {current_speech}")
                    # Stop recognizing next audio as interim.
                    speech_recognition_interim = False
                    # Filter noises
                    if not current_speech:
                        continue

                    await manager.send_message(
                        message=f"[+]You said: {current_speech}", websocket=websocket
                    )
                    current_speech = ""

                # 3. Send message to LLM
                message_id = str(uuid.uuid4().hex)[:16]

                async def text_mode_tts_task_done_call_back(response):
                    # Send response to client, indicates the response is done
                    await manager.send_message(message=f"[end={message_id}]\n", websocket=websocket)
                    # Update conversation history
                    conversation_history.user.append(msg_data)
                    conversation_history.ai.append(response)
                    token_buffer.clear()
                    # Persist interaction in the database
                    tools = []
                    interaction = Interaction(
                        user_id=user_id,
                        session_id=session_id,
                        client_message_unicode=msg_data,
                        server_message_unicode=response,
                        platform=platform,
                        action_type="text",
                        character_id=character_id,
                        tools=",".join(tools),
                        language=language,
                        message_id=message_id,
                        llm_config=llm.get_config(),
                    )
                    await asyncio.to_thread(interaction.save, db)

                tts_task = asyncio.create_task(
                    llm.achat(
                        history=build_history(conversation_history),
                        user_input=msg_data,
                        user_id=user_id,
                        character=character,
                        callback=AsyncCallbackTextHandler(
                            on_new_token, token_buffer, text_mode_tts_task_done_call_back
                        ),
                        audioCallback=AsyncCallbackAudioHandler(
                            text_to_speech, websocket, tts_event, character.voice_id, language
                        )
                        if not journal_mode
                        else None,
                        metadata={"message_id": message_id, "user_id": user_id},
                    )
                )
                tts_task.add_done_callback(task_done_callback)

                # 5. Persist interaction in the database

            # handle binary message(audio)
            elif "bytes" in data:
                binary_data = data["bytes"]
                # Handle journal mode
                if journal_mode:
                    # check whether adding new speaker
                    did_add_speaker = False
                    for speaker_id, sample in speaker_audio_samples.items():
                        if not sample:
                            speaker_audio_samples[speaker_id] = binary_data
                            logger.info(f"Added speaker: {speaker_id}")
                            did_add_speaker = True
                            break
                    if did_add_speaker:
                        continue

                    async def journal_transcribe(transcripts: list[Transcript], prompt: str = ""):
                        result: list[Transcript] = await asyncio.to_thread(
                            speech_to_text.transcribe_diarize,  # type: ignore
                            transcripts,
                            platform=platform,
                            prompt=prompt,
                            language=language,
                            speaker_audio_samples=speaker_audio_samples,
                        )
                        for transcript in result:
                            for slice in transcript.slices:
                                timestamp = transcript.timestamp + slice.start
                                duration = slice.end - slice.start
                                await manager.send_message(
                                    message=f"[+transcript]?id={slice.id}"
                                    f"&speakerId={slice.speaker_id}"
                                    f"&text={slice.text}"
                                    f"&timestamp={timestamp}"
                                    f"&duration={duration}",
                                    websocket=websocket,
                                )
                                logger.info(
                                    f"Message sent to client: transcript_id = {slice.id}, "
                                    f"speaker_id = {slice.speaker_id}, "
                                    f"text = {slice.text}"
                                )
                        return result

                    # transcribe
                    transcripts = await journal_transcribe(
                        [
                            Transcript(
                                id="", audio_bytes=binary_data, slices=[], timestamp=0, duration=0
                            )
                        ]
                    )
                    if transcripts:
                        audio_cache += transcripts
                    cached_duration = sum([transcript.duration for transcript in audio_cache])
                    cached_elapse = time.time() - audio_cache[0].timestamp if audio_cache else 0
                    if cached_duration > 30 or cached_elapse > 60:
                        audio_cache = await journal_transcribe(audio_cache)
                        journal_history += audio_cache
                        audio_cache = []
                    continue

                # 0. Handle interim speech.
                if speech_recognition_interim:
                    interim_transcript: str = (
                        await asyncio.to_thread(
                            speech_to_text.transcribe,
                            binary_data,
                            platform=platform,
                            prompt=current_speech,
                            language=language,
                            # suppress_tokens=[0, 11, 13, 30],
                        )
                    ).strip()
                    speech_recognition_interim = False
                    # Filter noises.
                    if not interim_transcript:
                        continue
                    await manager.send_message(
                        message=f"[+&]{interim_transcript}", websocket=websocket
                    )
                    logger.info(f"Speech interim: {interim_transcript}")
                    current_speech = current_speech + " " + interim_transcript
                    continue

                # 1. Transcribe audio
                transcript: str = (
                    await asyncio.to_thread(
                        speech_to_text.transcribe,
                        binary_data,
                        platform=platform,
                        prompt=character.name,
                        language=language,
                    )
                ).strip()

                # ignore audio that picks up background noise
                if not transcript or len(transcript) < 2:
                    continue

                # start counting time for LLM to generate the first token
                timer.start("LLM First Token")

                # 2. Send transcript to client
                await manager.send_message(
                    message=f"[+]You said: {transcript}", websocket=websocket
                )

                # 3. stop the previous audio stream, if new transcript is received
                await stop_audio()

                previous_transcript = transcript

                message_id = str(uuid.uuid4().hex)[:16]

                async def audio_mode_tts_task_done_call_back(response):
                    # Send response to client, [=] indicates the response is done
                    await manager.send_message(message="[=]", websocket=websocket)
                    # Update conversation history
                    conversation_history.user.append(transcript)
                    conversation_history.ai.append(response)
                    token_buffer.clear()
                    # Persist interaction in the database
                    tools = []
                    interaction = Interaction(
                        user_id=user_id,
                        session_id=session_id,
                        client_message_unicode=transcript,
                        server_message_unicode=response,
                        platform=platform,
                        action_type="audio",
                        character_id=character_id,
                        tools=",".join(tools),
                        language=language,
                        message_id=message_id,
                        llm_config=llm.get_config(),
                    )
                    await asyncio.to_thread(interaction.save, db)

                # 5. Send message to LLM
                tts_task = asyncio.create_task(
                    llm.achat(
                        history=build_history(conversation_history),
                        user_input=transcript,
                        user_id=user_id,
                        character=character,
                        callback=AsyncCallbackTextHandler(
                            on_new_token, token_buffer, audio_mode_tts_task_done_call_back
                        ),
                        audioCallback=AsyncCallbackAudioHandler(
                            text_to_speech, websocket, tts_event, character.voice_id, language
                        )
                        if not journal_mode
                        else None,
                        metadata={"message_id": message_id, "user_id": user_id},
                    )
                )
                tts_task.add_done_callback(task_done_callback)

    except WebSocketDisconnect:
        logger.info(f"User #{user_id} closed the connection")
        timer.reset()
        await manager.disconnect(websocket)
        return
