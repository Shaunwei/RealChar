import asyncio
import os
import json
import base64
import collections

from functools import reduce
from fastapi import (
    APIRouter,
    Depends,
    Request,
    Response,
    WebSocket,
    WebSocketDisconnect,
    Query,
)
from twilio.twiml.voice_response import VoiceResponse, Connect

from typing import Callable

from realtime_ai_character.twilio.ulaw_util import is_mulaw_silence_bytes
from realtime_ai_character.audio.speech_to_text import SpeechToText, get_speech_to_text
from realtime_ai_character.audio.text_to_speech import TextToSpeech, get_text_to_speech
from realtime_ai_character.character_catalog.catalog_manager import (
    CatalogManager,
    get_catalog_manager,
    Character,
)
from realtime_ai_character.llm import get_llm, LLM
from realtime_ai_character.llm.base import (
    AsyncCallbackAudioHandler,
    AsyncCallbackTextHandler,
)
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import (
    ConversationHistory,
    build_history,
    get_connection_manager,
)

logger = get_logger(__name__)

twilio_router = APIRouter(
    prefix="/twilio",
)

manager = get_connection_manager()


@twilio_router.get("/voice")
async def get_websocket(request: Request):
    # Start our TwiML response
    resp = VoiceResponse()

    request.url.hostname
    connect = Connect()
    connect.stream(
        name="RealChar Endpoint", url=f"wss://{request.url.hostname}/twilio/ws"
    )
    resp.append(connect)

    return Response(content=str(resp), media_type="application/xml")


class AudioBytesBuffer:
    def __init__(self):
        self._buffer = collections.deque()
        self._frame_count = 0
        self._silence_count = 0

    def setStreamID(self, sid: str):
        self._sid = sid

    def register_callback(self, callback: Callable[[bytes], None]):
        self._callback = callback

    async def add_bytes(self, chunk: bytes):
        if is_mulaw_silence_bytes(chunk):
            self._silence_count += 1
        else:
            self._silence_count = 0  # reset
            self._buffer.append(chunk)
            self._frame_count += 1

        if len(self._buffer) > 25 and self._silence_count >= 50:
            logger.info("going to invoke callback")
            answer = reduce(lambda x, y: x + y, self._buffer)
            self.reset()
            # call the callback func
            await self._callback(answer, self._sid)

    def reset(self):
        self._buffer.clear()
        self._frame_count = 0


@twilio_router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    llm_model: str = Query(default=os.getenv("LLM_MODEL_USE", "gpt-3.5-turbo-16k")),
    language: str = Query(default="en-US"),
    catalog_manager=Depends(get_catalog_manager),
    speech_to_text=Depends(get_speech_to_text),
    default_text_to_speech=Depends(get_text_to_speech),
):
    llm = get_llm(model=llm_model)
    await manager.connect(websocket)
    character = catalog_manager.get_character("elon_musk")
    try:
        main_task = asyncio.create_task(
            handle_receive(
                websocket,
                llm,
                catalog_manager,
                character,
                language,
                speech_to_text,
                default_text_to_speech,
            )
        )
        await asyncio.gather(main_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)


async def handle_receive(
    websocket: WebSocket,
    llm: LLM,
    catalog_manager: CatalogManager,
    character: Character,
    language: str,
    speech_to_text: SpeechToText,
    default_text_to_speech: TextToSpeech,
):
    buffer = AudioBytesBuffer()
    conversation_history = ConversationHistory()
    user_input_template = character.llm_user_prompt
    tts_event = asyncio.Event()
    token_buffer = []
    text_to_speech = default_text_to_speech
    sid = None

    async def on_new_token(token):
        pass

    async def tts_task_done_call_back(response):
        conversation_history.ai.append(response)
        token_buffer.clear()

    async def audio_buffer_callback(binary_data: bytes, sid: str):
        transcript: str = (
            await asyncio.to_thread(
                speech_to_text.transcribe, binary_data, platform="twilio"
            )
        ).strip()
        logger.info(f"Receive transcription: {transcript}")
        conversation_history.user.append(transcript)

        await llm.achat(
            history=build_history(conversation_history),
            user_input=transcript,
            user_input_template=user_input_template,
            callback=AsyncCallbackTextHandler(
                on_new_token, token_buffer, tts_task_done_call_back
            ),
            audioCallback=AsyncCallbackAudioHandler(
                text_to_speech,
                websocket,
                tts_event,
                "",
                language,
                sid,
                platform="twilio",
            ),
            character=character,
            useSearch=False,
            useQuivr=False,
            useMultiOn=False,
            quivrApiKey=None,
            quivrBrainId=None,
        )

    buffer.register_callback(audio_buffer_callback)

    while True:
        try:
            # expect twilio to send connect event
            data = await websocket.receive()

            if data["type"] != "websocket.receive":
                raise WebSocketDisconnect("disconnected")

            msg = data["text"]
            try:
                obj = json.loads(msg)
            except ValueError:
                logger.error("Twilio message can not be parsed to json")
                raise WebSocketDisconnect("disconnected")

            # {"event": "connected", "protocol": "Call", "version": "1.0.0"
            if obj["event"] == "connected":
                logger.info("Receive twilio connect event")
                continue

            if obj["event"] == "start":
                logger.info(f"websocket receives twilio payload: {obj}")
                logger.info("Receive twilio start event")
                sid = obj["start"]["streamSid"]
                buffer.setStreamID(sid)
                continue

            if obj["event"] == "media":
                media = obj["media"]
                chunk = base64.b64decode(media["payload"])
                await buffer.add_bytes(bytes(chunk))
                continue

            if obj["event"] == "mark":
                mark_name = obj["mark"]["name"]
                logger.info(f"Receive twilio mark event, mark: {mark_name}")
                continue

            if obj["event"] == "stop":
                logger.info("Receive twilio stop event")
                await websocket.close()
                break

        except WebSocketDisconnect:
            await manager.disconnect(websocket)
