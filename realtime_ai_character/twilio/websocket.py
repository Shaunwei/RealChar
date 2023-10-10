import asyncio
import audioop
import os
import json
import base64
import collections
import random

from enum import Enum
from functools import reduce
from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Request,
    Response,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status as http_status,
)
import numpy as np
from twilio.twiml.voice_response import VoiceResponse, Connect
from twilio.rest import Client
import torch
from typing import Callable

from realtime_ai_character.audio.speech_to_text import SpeechToText, get_speech_to_text
from realtime_ai_character.audio.text_to_speech import TextToSpeech, get_text_to_speech
from realtime_ai_character.character_catalog.catalog_manager import (
    get_catalog_manager,
    Character,
)
from realtime_ai_character.llm import get_llm, LLM
from realtime_ai_character.llm.base import (
    AsyncCallbackAudioHandler,
    AsyncCallbackTextHandler,
)
from realtime_ai_character.logger import get_logger
from realtime_ai_character.twilio.twilio_outgoing_call import MakeTwilioOutgoingCallRequest
from realtime_ai_character.twilio.utils import is_valid_e164
from realtime_ai_character.utils import (
    ConversationHistory,
    build_history,
    get_connection_manager,
)

logger = get_logger(__name__)

twilio_router = APIRouter(
    prefix="/twilio",
)

character_list = ["elon_musk", "steve_jobs", "sam_altman", "bruce_wayne",
                  "realchar", "helen_inhabitants_zone", "the_cat", "keanu_reeves"]

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
    "zh-CN": "嗨，我的朋友，今天你为什么来这里？",
    "ja-JP": "こんにちは、私の友達、今日はどうしたの？",
    "ko-KR": "안녕, 내 친구, 오늘 여기 왜 왔어?",
}

MEDIA_SAMPLE_RATE = 8000  # 8000hz sample rate
FRAME_INTERVAL_MS = 20    # 20 ms
LEN_PER_FRAME = MEDIA_SAMPLE_RATE * \
    FRAME_INTERVAL_MS / 1000  # each sample is 8 bit


@twilio_router.post("/call")
async def call_websocket(request: Request, req: MakeTwilioOutgoingCallRequest):
    client = Client(os.getenv("TWILIO_ACCOUNT_SID", ""),
                    os.getenv("TWILIO_ACCESS_TOKEN", ""))

    to = req.target_number
    from_ = req.source_number

    if not is_valid_e164(to):
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST,
                            detail="target_number must be of e.164 format")

    if not is_valid_e164(from_):
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST,
                            detail="target_number must be of e.164 format")

    _ = client.calls.create(
        to=to,
        from_=from_,
        url=f"https://{request.url.hostname}/twilio/voice",
        method="GET"
    )


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
    class VAD_STATE(Enum):
        INITIAL = 1
        SILENCE = 2
        TALKING = 3

    TALKING_THRESHOLD = 0.8
    SILENCE_THRESHOLD = 0.2

    def __init__(self, websocket):
        self._audio_buffer = bytes()
        self._vad_buffer = collections.deque()
        self._vad_buffer_size = 20
        model, _ = torch.hub.load(repo_or_dir='snakers4/silero-vad',
                                  model='silero_vad',
                                  force_reload=False,
                                  onnx=False)
        self._vad_model = model
        self._state = self.VAD_STATE.INITIAL
        self._most_recent_silence_frame = 0
        self._min_silence_ms = 1000
        self._websocket = websocket

    def setStreamID(self, sid: str):
        self._sid = sid

    def register_callback(self, callback: Callable[[bytes], None]):
        self._callback = callback

    async def add_bytes(self, chunk: bytes):
        self._vad_buffer.append(chunk)
        if len(self._vad_buffer) > self._vad_buffer_size:
            self._vad_buffer.popleft()

        speech_prob = None
        if len(self._vad_buffer) % (self._vad_buffer_size/2) == 0:
            vad_data = reduce(lambda x, y: x + y, list(self._vad_buffer))
            decoded = audioop.ulaw2lin(vad_data, 2)
            vad_16 = np.frombuffer(decoded, dtype=np.int16)
            vad_32 = self._int2float(vad_16)
            speech_prob = self._vad_model(
                torch.from_numpy(vad_32), MEDIA_SAMPLE_RATE).item()

        if self._state == self.VAD_STATE.INITIAL:
            # transition to TALKING
            if speech_prob is not None and speech_prob > self.TALKING_THRESHOLD:
                logger.info("transitions from INITIAL to TALKING")
                self._state = self.VAD_STATE.TALKING
                self._audio_buffer += vad_data
                await stop_twilio_voice(self._websocket, self._sid)
            return

        if self._state == self.VAD_STATE.TALKING:
            self._audio_buffer += chunk

            # transition to SILENCE
            if speech_prob is not None and speech_prob < self.SILENCE_THRESHOLD:
                logger.info("transitions from TALKING to SILENCE")
                self._state = self.VAD_STATE.SILENCE
                # each frame len
                self._most_recent_silence_frame = len(
                    self._audio_buffer) / LEN_PER_FRAME
            return

        if self._state == self.VAD_STATE.SILENCE:
            self._audio_buffer += chunk

            if speech_prob is not None and speech_prob > self.TALKING_THRESHOLD:
                logger.info("transitions from SILENCE to TALKING")
                self._state = self.VAD_STATE.TALKING
                await stop_twilio_voice(self._websocket, self._sid)
                return

            diff = FRAME_INTERVAL_MS * (len(self._audio_buffer) / LEN_PER_FRAME -
                                        self._most_recent_silence_frame)
            if (speech_prob is not None and speech_prob < self.SILENCE_THRESHOLD
                    and diff > self._min_silence_ms):
                logger.info("User done talking, transition to INITIAL")
                answer = self._audio_buffer
                self.reset()
                await self._callback(answer, self._sid)

    def reset(self):
        self._audio_buffer = bytes()
        self._state = self.VAD_STATE.INITIAL
        self._most_recent_silence = -1

    def _int2float(self, sound):
        abs_max = np.abs(sound).max()
        sound = sound.astype('float32')
        if abs_max > 0:
            sound *= 1/32768  # 2^15
        sound = sound.squeeze()  # depends on the use case
        return sound


@twilio_router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    llm_model: str = Query(default=os.getenv(
        "LLM_MODEL_USE", "gpt-3.5-turbo-16k")),
    language: str = Query(default="en-US"),
    catalog_manager=Depends(get_catalog_manager),
    speech_to_text=Depends(get_speech_to_text),
    default_text_to_speech=Depends(get_text_to_speech),
):
    llm = get_llm(model=llm_model)
    await manager.connect(websocket)
    random_character = random.choice(character_list)
    character = catalog_manager.get_character(random_character)
    try:
        main_task = asyncio.create_task(
            handle_receive(
                websocket,
                llm,
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
    character: Character,
    language: str,
    speech_to_text: SpeechToText,
    default_text_to_speech: TextToSpeech,
):
    buffer = AudioBytesBuffer(websocket)
    conversation_history = ConversationHistory()
    conversation_history.system_prompt = character.llm_system_prompt
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
                character.voice_id,
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
                # greet the user when the stream starts
                logger.info(f"Using character: {character.name}")
                # Greet the user
                greeting_text = GREETING_TXT_MAP[language]
                await text_to_speech.stream(
                    text=greeting_text,
                    websocket=websocket,
                    tts_event=tts_event,
                    voice_id=character.voice_id,
                    first_sentence=True,
                    language=language,
                    sid=sid,
                    platform="twilio",
                )
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


async def stop_twilio_voice(websocket, sid):
    data = {
        "event": "clear",
        "streamSid": sid,
    }
    await websocket.send_json(data)
