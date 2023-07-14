import asyncio
import os
import types
import httpx

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton
from realtime_ai_character.audio.text_to_speech.base import TextToSpeech

logger = get_logger(__name__)
DEBUG = False

config = types.SimpleNamespace(**{
    'default_voice': 'EXAVITQu4vr4xnSDxMaL',
    'pi_voice': 'EXAVITQu4vr4xnSDxMaL',
    'raiden_voice': 'GQbV9jBB6X50z0S6R2d0',
    'loki_voice': 'ErXwobaYiN019PkySvjV',  # TODO: train a new voice for Loki
    'elon_voice': 'pkR5tvu0WMvDEf8i4UZT',
    'chunk_size': 1024,
    'url': 'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream',
    'headers': {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': os.environ['ELEVEN_LABS_API_KEY']
    },
    'data': {
        'model_id': 'eleven_monolingual_v1',
        'voice_settings': {
            'stability': 0.5,
            'similarity_boost': 0.75
        }
    }
})


class ElevenLabs(Singleton, TextToSpeech):
    def __init__(self):
        super().__init__()
        logger.info("Initializing [ElevenLabs Text To Speech] voices...")

    def get_voice_id(self, name):
        if name == "Raiden Shogun And Ei":
            return config.raiden_voice
        if name == "Loki":
            return config.loki_voice
        if name == "Reflection Pi":
            return config.pi_voice
        if name == "Elon Musk":
            return config.elon_voice
        return config.default_voice

    async def stream(self, text, websocket, tts_event: asyncio.Event, characater_name="", first_sentence=False) -> None:
        if DEBUG:
            return
        headers = config.headers
        data = {
            "text": text,
            **config.data,
        }
        voice_id = self.get_voice_id(characater_name)
        url = config.url.format(voice_id=voice_id)
        if first_sentence:
            url = url + '?optimize_streaming_latency=4'
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            async for chunk in response.aiter_bytes():
                await asyncio.sleep(0.1)
                if tts_event.is_set():
                    # stop streaming audio
                    break
                await websocket.send_bytes(chunk)
