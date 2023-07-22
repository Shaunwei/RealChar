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
    'default_voice': '21m00Tcm4TlvDq8ikWAM',
    'default_female_voice': 'EXAVITQu4vr4xnSDxMaL',
    'default_male_voice': 'ErXwobaYiN019PkySvjV',
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
        self.voice_ids = {
            "Raiden Shogun And Ei": os.environ.get('RAIDEN_VOICE') or config.default_female_voice,
            "Loki": os.environ.get('LOKI_VOICE') or config.default_male_voice,
            "Reflection Pi": os.environ.get('PI_VOICE') or config.default_female_voice,
            "Elon Musk": os.environ.get('ELON_VOICE') or config.default_male_voice,
            "Bruce Wayne": os.environ.get('BRUCE_VOICE') or config.default_male_voice,
            "Steve Jobs": os.environ.get('JOBS_VOICE') or config.default_male_voice,
            "Sam Altman": os.environ.get('SAM_VOICE') or config.default_male_voice,
        }

    def get_voice_id(self, name):
        return self.voice_ids.get(name, config.default_voice)

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
