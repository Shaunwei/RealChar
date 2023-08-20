import asyncio
import edge_tts
from edge_tts import VoicesManager

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton
from realtime_ai_character.audio.text_to_speech.base import TextToSpeech

logger = get_logger(__name__)
DEBUG = False

class EdgeTTS(Singleton, TextToSpeech):
    def __init__(self):
        super().__init__()
        logger.info("Initializing [EdgeTTS] voices...")

    async def stream(self, text, websocket, tts_event: asyncio.Event, voice_id="",
                     first_sentence=False, language='en-US') -> None:
        if DEBUG:
            return
        voices = await VoicesManager.create()
        voice = voices.find(Gender="Male", Language="en")[0]
        communicate = edge_tts.Communicate(text, voice["Name"])
        messages = []
        async for message in communicate.stream():
            if message["type"] == "audio":
                # Choose to accmulate the audio data because
                # the stream packets are broken when playback.
                messages.extend(message["data"])
        await websocket.send_bytes(bytes(messages))


    async def generate_audio(self, text, voice_id = "", language='en-US') -> bytes:
        voices = await VoicesManager.create()
        voice = voices.find(Gender="Male", Language="en")[0]
        communicate = edge_tts.Communicate(text, voice["Name"])
        messages = []
        async for message in communicate.stream():
            if message["type"] == "audio":
                messages.extend(message["data"])
        return bytes(messages)

