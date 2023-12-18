import asyncio
import os
import requests
import base64

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton, timed
from realtime_ai_character.audio.text_to_speech.base import TextToSpeech
from realtime_ai_character.audio.text_to_speech.utils import MP3ToUlaw

logger = get_logger(__name__)

DEBUG = False
API_KEY = os.getenv("XTTS_API_KEY", "")
API_URL = os.getenv("XTTS_API_URL", "")


class XTTS(Singleton, TextToSpeech):
    def __init__(self):
        super().__init__()
        logger.info("Initializing [XTTS Text To Speech] voices...")

    @timed
    async def stream(
        self,
        text,
        websocket,
        tts_event: asyncio.Event,
        voice_id="default",
        first_sentence=False,
        language="",
        sid="",
        platform="",
        *args,
        **kwargs,
    ) -> None:
        if DEBUG:
            return
        if voice_id == "":
            logger.info("XTTS voice_id is not set, using default voice")
            voice_id = "default"
        headers = {"api-key": API_KEY}
        data = {
            "prompt": text,
            "language": language,
            "voice_id": voice_id,
            "stream": first_sentence,
            "max_ref_length": 30,
            "gpt_cond_len": 6,
            "gpt_cond_chunk_len": 4,
            "speed": 1.2,
            "temperature": 0.01,
        }
        with requests.post(API_URL, json=data, headers=headers, stream=True) as response:
            response.raise_for_status()
            for chunk in response.iter_content(chunk_size=None):
                if not chunk:
                    continue
                if tts_event.is_set():
                    # stop streaming audio
                    break
                if platform != "twilio":
                    await websocket.send_bytes(chunk)
                else:
                    audio_bytes = MP3ToUlaw(chunk)
                    audio_b64 = base64.b64encode(audio_bytes).decode()
                    media_response = {
                        "event": "media",
                        "streamSid": sid,
                        "media": {
                            "payload": audio_b64,
                        },
                    }
                    # "done" marker is sent to twilio to track if the audio has been completed.
                    await websocket.send_json(media_response)
                    mark = {
                        "event": "mark",
                        "streamSid": sid,
                        "mark": {
                            "name": "done",
                        },
                    }
                    await websocket.send_json(mark)

    # async def generate_audio(self, text, voice_id="", language='en-US') -> bytes:
    #     if DEBUG:
    #         return
    #     if voice_id == "":
    #         logger.info(
    #             "voice_id is not found in .env file, using ElevenLabs default voice")
    #         voice_id = "21m00Tcm4TlvDq8ikWAM"
    #     headers = config.headers
    #     if language != 'en-US':
    #         config.data["model_id"] = ELEVEN_LABS_MULTILINGUAL_MODEL
    #     data = {
    #         "text": text,
    #         **config.data,
    #     }
    #     # Change to non-streaming endpoint
    #     url = config.url.format(voice_id=voice_id).replace('/stream', '')
    #     async with httpx.AsyncClient() as client:
    #         response = await client.post(url, json=data, headers=headers)
    #         if response.status_code != 200:
    #             logger.error(
    #                 f"ElevenLabs returns response {response.status_code}")
    #         # Get audio/mpeg from the response and return it
    #         return response.content
