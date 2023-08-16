import asyncio
import os
import types
import httpx
import base64
from google.oauth2 import service_account
import google.auth.transport.requests

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton
from realtime_ai_character.audio.text_to_speech.base import TextToSpeech

logger = get_logger(__name__)
DEBUG = False

config = types.SimpleNamespace(**{
    'url': 'https://texttospeech.googleapis.com/v1/text:synthesize',
    'headers': {
        'Content-Type': 'application/json',
    },
    'data': {
        'voice': {
            'languageCode': 'en-US',
            'name': 'en-US-Studio-M',
            'ssmlGender': 'MALE'
        },
        'audioConfig': {
            'audioEncoding': 'MP3'
        }
    },
    'service_account_file': os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'default/path.json'),
})


class GoogleCloudTTS(Singleton, TextToSpeech):
    def __init__(self):
        super().__init__()
        logger.info("Initializing [Google Cloud Text To Speech] voices...")

        # Load the service account key
        credentials = service_account.Credentials.from_service_account_file(
            config.service_account_file,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        # Request an access token
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)

        # Now credentials.valid is True and credentials.token contains the access token
        self.access_token = credentials.token

        # Set the Authorization header with the access token
        config.headers['Authorization'] = f'Bearer {self.access_token}'

    async def stream(self, text, websocket, tts_event: asyncio.Event, voice_id="",
                     first_sentence=False, language='en-US') -> None:
        if DEBUG:
            return
        headers = config.headers
        # For customized voices

        # if language != 'en-US':
        #     config.data["voice"]["languageCode"] = language
        #     config.data["voice"]["name"] = voice_id
        data = {
            "input": {
                "text": text
            },
            **config.data,
        }
        if voice_id:
            logger.info("Override voice_id")
            data["voice"]["name"] = voice_id
            if voice_id == "en-US-Studio-O":
                data["voice"]["ssmlGender"] = 'FEMALE'
        url = config.url
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            # Google Cloud TTS API does not support streaming, we send the whole content at once
            if response.status_code != 200:
                logger.error(f"Google Cloud TTS returns response {response.status_code}")
            else:
                audio_content = response.content
                # Decode the base64-encoded audio content
                audio_content = base64.b64decode(audio_content)
                await websocket.send_bytes(audio_content)


    async def generate_audio(self, text, voice_id = "", language='en-US') -> bytes:
        headers = config.headers
        # For customized voices

        # if language != 'en-US':
        #     config.data["voice"]["languageCode"] = language
        data = {
            "input": {
                "text": text
            },
            **config.data,
        }
        url = config.url
        if voice_id:
            logger.info("Override voice_id")
            data["voice"]["name"] = voice_id
            if voice_id == "en-US-Studio-O":
                data["voice"]["ssmlGender"] = 'FEMALE'
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code != 200:
                logger.error(f"Google Cloud TTS returns response {response.status_code}")
            else:
                audio_content = response.content
                # Decode the base64-encoded audio content
                audio_content = base64.b64decode(audio_content)
                return audio_content
