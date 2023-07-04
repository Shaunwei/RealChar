import httpx
import os
from dotenv import load_dotenv
from elevenlabs import generate
from elevenlabs import set_api_key
from realtime_ai_companion.utils import Singleton
from realtime_ai_companion.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


class MyElevenLabs(Singleton):
    def __init__(self):
        logger.info("Initializing ElevenLabs voices...")

        self.default_voice = "Bella"
        self.raiden_voice = "GQbV9jBB6X50z0S6R2d0"
        self.loki_voice = "ErXwobaYiN019PkySvjV" #TODO: replace this with trained Loki voice id. Currently it's Antoni voice
        self.custom_voice = None
        self.chunk_size = 1024

    def get_voice_id(self, name):
        if name == "Raiden Shogun And Ei":
            return self.raiden_voice
        if name == "Marvel Loki":
            return self.loki_voice
        return self.default_voice

    async def stream(self, text, companion, websocket) -> None:
        voice_id = self.get_voice_id(companion)

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": os.environ['ELEVEN_LABS_API']
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
                 await websocket.send_bytes(chunk)


def get_text_to_speech():
    return MyElevenLabs.get_instance()
