import asyncio
import audioop
import base64
import collections
import json
import os
import random
import uuid
from enum import Enum
from functools import reduce
from typing import Callable, Coroutine

import numpy as np
from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    Request,
    Response,
    status as http_status,
    WebSocket,
    WebSocketDisconnect,
)
from twilio.rest import Client
from twilio.twiml.voice_response import Connect, VoiceResponse

from realtime_ai_character.audio.speech_to_text import get_speech_to_text
from realtime_ai_character.audio.text_to_speech import get_text_to_speech
from realtime_ai_character.character_catalog.catalog_manager import get_catalog_manager
from realtime_ai_character.llm import get_llm, LLM
from realtime_ai_character.llm.base import (
    AsyncCallbackAudioHandler,
    AsyncCallbackTextHandler,
)
from realtime_ai_character.logger import get_logger
from realtime_ai_character.twilio.twilio_outgoing_call import MakeTwilioOutgoingCallRequest
from realtime_ai_character.twilio.utils import is_valid_e164
from realtime_ai_character.utils import (
    build_history,
    ConversationHistory,
    get_connection_manager,
    task_done_callback,
)


logger = get_logger(__name__)

twilio_router = APIRouter(
    prefix="/twilio",
)

character_list = [
    "annie",
    "bruce_wayne",
    "arnold_schwarzenegger",
    "helen_inhabitants_zone",
    "ion_stoica",
    "kean_zuckerberg",
    "the_u_reeves",
    "markcat",
    "the_dolphin",
    "elon_musk",
    "loki",
    "raiden_shogun_and_ei",
    "realchar",
    "rebyte",
    "sam_altman",
    "santa_claus",
    "steve_jobs",
]

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
FRAME_INTERVAL_MS = 20  # 20 ms
LEN_PER_FRAME = MEDIA_SAMPLE_RATE * FRAME_INTERVAL_MS / 1000  # each sample is 8 bit


@twilio_router.post("/call")
async def call_websocket(request: Request, req: MakeTwilioOutgoingCallRequest):
    client = Client(os.getenv("TWILIO_ACCOUNT_SID", ""), os.getenv("TWILIO_ACCESS_TOKEN", ""))

    to = req.target_number
    from_ = req.source_number
    character_id = req.character_id
    vad_threshold = req.vad_threshold
    if from_ is None:
        from_ = os.getenv("DEFAULT_CALLOUT_NUMBER", "")

    if not is_valid_e164(to):
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="target_number must be of e.164 format",
        )

    if not is_valid_e164(from_):
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="target_number must be of e.164 format",
        )

    _ = client.calls.create(
        to=to,
        from_=from_,
        url=f"https://{request.url.hostname}/twilio/voice"
        + ("?character_id={}".format(character_id) if character_id else "")
        + ("&vad_threshold={}".format(vad_threshold) if vad_threshold else ""),
        method="GET",
    )


@twilio_router.get("/voice")
async def get_websocket(request: Request):
    # Start our TwiML response
    resp = VoiceResponse()

    character_id = request.query_params.get("character_id")
    vad_threshold = request.query_params.get("vad_threshold")
    connect = Connect()
    stream = connect.stream(
        name=character_id if character_id else "RealChar Endpoint",
        url=f"wss://{request.url.hostname}/twilio/ws",
    )
    stream.parameter(name="character_id", value=character_id)  # type: ignore
    stream.parameter(name="vad_threshold", value=vad_threshold)  # type: ignore
    logger.info(connect)
    resp.append(connect)
    return Response(content=str(resp), media_type="application/xml")


class TwilioConversationEngine:
    class VAD_STATE(Enum):
        INITIAL = 1
        SILENCE = 2
        TALKING = 3

    SILENCE_THRESHOLD = 0.2

    def __init__(self, websocket, speech_to_text):
        import torch

        self._speech_to_text = speech_to_text
        self._websocket = websocket
        self._transcript_buffer = []  # streamed transcripts
        self._audio_buffer = bytes()
        self._vad_buffer = collections.deque()
        self._vad_buffer_size = 20
        self._talking_threshold = 0.8
        model, _ = torch.hub.load(
            repo_or_dir="snakers4/silero-vad", model="silero_vad", force_reload=False, onnx=False
        )
        self._vad_model = model
        self._state = self.VAD_STATE.INITIAL
        self._most_recent_silence_frame = 0
        self._min_silence_ms = 1000  # silence time for user speech to be considered completed
        self._transcribe_tasks = []

    def setTalkingThreshold(self, talking_threshold: float):
        self._talking_threshold = talking_threshold

    def setStreamID(self, sid: str):
        self._sid = sid

    def register_callback(self, callback: Callable[[str, str], Coroutine]):
        self._callback = callback

    def _transcribe_callback(self, task: asyncio.Task):
        script = task.result()
        self._transcript_buffer.append(script)
        logger.info(f"Transcripting: {self._transcript_buffer}")

    async def add_bytes(self, chunk: bytes):
        import torch

        self._vad_buffer.append(chunk)
        if len(self._vad_buffer) > self._vad_buffer_size:
            self._vad_buffer.popleft()

        speech_prob = None
        vad_data = bytes()
        if len(self._vad_buffer) % (self._vad_buffer_size / 2) == 0:
            vad_data = reduce(lambda x, y: x + y, list(self._vad_buffer))
            decoded = audioop.ulaw2lin(vad_data, 2)
            vad_16 = np.frombuffer(decoded, dtype=np.int16)
            vad_32 = self._int2float(vad_16)
            speech_prob = self._vad_model(torch.from_numpy(vad_32), MEDIA_SAMPLE_RATE).item()

        if self._state == self.VAD_STATE.INITIAL:
            # transition to TALKING
            if speech_prob is not None and speech_prob > self._talking_threshold:
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
                # record the transition time from TALKING to SILENCE so that
                # we can calculate silence time
                self._most_recent_silence_frame = len(self._audio_buffer) / LEN_PER_FRAME

                coro = asyncio.to_thread(
                    self._speech_to_text.transcribe, self._audio_buffer, platform="twilio"
                )
                transcribe_task = asyncio.create_task(coro)
                transcribe_task.add_done_callback(self._transcribe_callback)
                transcribe_task.add_done_callback(task_done_callback)
                self._transcribe_tasks.append(transcribe_task)
                # clear the audio buffer
                self._audio_buffer = bytes()
            return

        if self._state == self.VAD_STATE.SILENCE:
            self._audio_buffer += chunk

            if speech_prob is not None and speech_prob > self._talking_threshold:
                logger.info("transitions from SILENCE to TALKING")
                self._state = self.VAD_STATE.TALKING
                await stop_twilio_voice(self._websocket, self._sid)
                return

            diff = FRAME_INTERVAL_MS * (
                len(self._audio_buffer) / LEN_PER_FRAME - self._most_recent_silence_frame
            )

            if (
                speech_prob is not None
                and speech_prob < self.SILENCE_THRESHOLD
                and diff > self._min_silence_ms
            ):
                logger.info("User done talking, transition to INITIAL")
                self.reset()

                # wait for transcribe tasks to complete
                await asyncio.gather(*self._transcribe_tasks)
                self._transcribe_tasks.clear()

                sentence = " ".join(self._transcript_buffer)
                logger.info(f"send following to LLM:\n {sentence}")
                self._transcript_buffer.clear()
                await self._callback(sentence, self._sid)

    def reset(self):
        self._audio_buffer = bytes()
        self._state = self.VAD_STATE.INITIAL
        self._most_recent_silence = -1

    def _int2float(self, sound):
        abs_max = np.abs(sound).max()
        sound = sound.astype("float32")
        if abs_max > 0:
            sound *= 1 / 32768  # 2^15
        sound = sound.squeeze()  # depends on the use case
        return sound


@twilio_router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    llm_model: str = Query(default="gpt-3.5-turbo-16k"),
    language: str = Query(default="en-US"),
):
    llm = get_llm(model=llm_model)
    await manager.connect(websocket)
    try:
        main_task = asyncio.create_task(
            handle_receive(
                websocket,
                llm,
                language,
            )
        )
        await asyncio.gather(main_task)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)


async def handle_receive(
    websocket: WebSocket,
    llm: LLM,
    language: str,
):
    catalog_manager = get_catalog_manager()
    speech_to_text = get_speech_to_text()
    buffer = TwilioConversationEngine(websocket, speech_to_text)
    conversation_history = ConversationHistory()
    random_character = random.choice(character_list)
    character = catalog_manager.get_character(random_character)
    if not character:
        raise WebSocketDisconnect(reason="character not found")
    conversation_history.system_prompt = character.llm_system_prompt
    tts_event = asyncio.Event()
    token_buffer = []
    text_to_speech = get_text_to_speech("ELEVEN_LABS")
    sid = None

    async def on_new_token(token):
        pass

    async def tts_task_done_call_back(response):
        conversation_history.ai.append(response)
        token_buffer.clear()

    async def llm_callback(transcript: str, sid: str):
        if not transcript.strip() or not character:
            return
        conversation_history.user.append(transcript)
        # temporary hack to get a random user id
        user_id = str(uuid.uuid4().hex)[:16]
        await llm.achat(
            history=build_history(conversation_history),
            user_input=transcript,
            user_id=user_id,
            character=character,
            callback=AsyncCallbackTextHandler(on_new_token, token_buffer, tts_task_done_call_back),
            audioCallback=AsyncCallbackAudioHandler(
                text_to_speech,
                websocket,
                tts_event,
                character.voice_id,
                language,
                sid=sid,
                platform="twilio",
            ),
        )

    buffer.register_callback(llm_callback)
    while True:
        try:
            # expect twilio to send connect event
            data = await websocket.receive()

            if data["type"] != "websocket.receive":
                raise WebSocketDisconnect(reason="disconnected")

            msg = data["text"]
            try:
                obj = json.loads(msg)
            except ValueError:
                logger.error("Twilio message can not be parsed to json")
                raise WebSocketDisconnect(reason="disconnected")

            # {"event": "connected", "protocol": "Call", "version": "1.0.0"
            if obj["event"] == "connected":
                logger.info("Receive twilio connect event")
                continue

            if obj["event"] == "start":
                logger.info(f"websocket receives twilio payload: {obj}")
                logger.info("Receive twilio start event")
                sid = obj["start"]["streamSid"]
                buffer.setStreamID(sid)
                # Get character.
                logger.info(obj)
                if "character_id" in obj["start"]["customParameters"]:
                    character_id = obj["start"]["customParameters"]["character_id"]
                    if character_id != "":
                        character = catalog_manager.get_character(character_id)
                        if not character:
                            raise WebSocketDisconnect(reason="character not found")
                        conversation_history.system_prompt = character.llm_system_prompt
                vad_threshold = obj["start"]["customParameters"]["vad_threshold"]
                buffer.setTalkingThreshold(float(vad_threshold))
                # greet the user when the stream starts
                logger.info(f"Using character: {character.name}")
                logger.info(f"Using talking threshold: {vad_threshold}")
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
                    priority=0,
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
            break


async def stop_twilio_voice(websocket, sid):
    data = {
        "event": "clear",
        "streamSid": sid,
    }
    await websocket.send_json(data)
