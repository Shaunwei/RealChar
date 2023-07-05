import asyncio
import os

import httpx
from dotenv import load_dotenv

from realtime_ai_companion.logger import get_logger
from realtime_ai_companion.utils import Singleton

load_dotenv()
logger = get_logger(__name__)
DEBUG = True


class ElevenLabs(Singleton):
    def __init__(self):
        logger.info("Initializing ElevenLabs voices...")

        self.default_voice = "EXAVITQu4vr4xnSDxMaL"
        self.raiden_voice = "GQbV9jBB6X50z0S6R2d0"
        # TODO: replace this with trained Loki voice id. Currently it's Antoni voice
        self.loki_voice = "ErXwobaYiN019PkySvjV"
        self.custom_voice = None
        self.chunk_size = 1024

    def get_voice_id(self, name):
        if name == "Raiden Shogun And Ei":
            return self.raiden_voice
        if name == "Marvel Loki":
            return self.loki_voice
        return self.default_voice

    async def stream(self, text, websocket, tts_event: asyncio.Event, companion_name="") -> None:
        if DEBUG:
            return
        if websocket:
            voice_id = self.get_voice_id(companion_name)
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": os.environ['ELEVEN_LABS_API_KEY']
            }

            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                async for chunk in response.aiter_bytes():
                    await asyncio.sleep(0.1)
                    if tts_event.is_set():
                        # stop streaming audio
                        break
                    await websocket.send_bytes(chunk)
        else:
            logger.error("No websocket.")


def get_text_to_speech():
    return ElevenLabs.get_instance()
