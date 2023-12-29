import asyncio
import base64
import json
import os
import types

import google.auth.transport.requests
import httpx
from google.oauth2 import service_account

from realtime_ai_character.audio.text_to_speech.base import TextToSpeech
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton, timed


logger = get_logger(__name__)

config = types.SimpleNamespace(
    **{
        "url": "https://texttospeech.googleapis.com/v1/text:synthesize",
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
        },
        "data": {
            "voice": {
                "languageCode": "en-US",
                "name": "en-US-Studio-M",
            },
            "audioConfig": {"audioEncoding": "MP3"},
        },
        "service_account_file": os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "default/path.json"),
    }
)


class GoogleCloudTTS(Singleton, TextToSpeech):
    def __init__(self):
        super().__init__()
        logger.info("Initializing [Google Cloud Text To Speech] voices...")

        # Load the service account key
        self.credentials = service_account.Credentials.from_service_account_file(
            config.service_account_file,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )

        # Request an access token
        auth_req = google.auth.transport.requests.Request()
        self.credentials.refresh(auth_req)

    @timed
    async def stream(
        self,
        text,
        websocket,
        tts_event: asyncio.Event,
        voice_id="",
        first_sentence=False,
        language="en-US",
        sid="",
        platform="",
        *args,
        **kwargs,
    ) -> None:
        if self.credentials.expired:
            # Request an access token
            auth_req = google.auth.transport.requests.Request()
            self.credentials.refresh(auth_req)

        # Set the Authorization header with the access token
        headers = {
            "Authorization": f"Bearer {self.credentials.token}",
            **config.headers,
        }

        # For customized voices
        if language != "en-US":
            config.data["voice"]["languageCode"] = language if language else "en-US"
            config.data["voice"]["name"] = voice_id

        data = {
            "input": {"text": text},
            **config.data,
        }

        # twilio expects g711 mulaw audio encoding
        # https://www.twilio.com/docs/voice/twiml/stream#websocket-messages-to-twilio
        if platform == "twilio":
            data["audioConfig"]["audioEncoding"] = "MULAW"
            data["audioConfig"]["sampleRateHertz"] = 8000

        url = config.url
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            response.raise_for_status()

            # Google Cloud TTS API does not support streaming, we send the whole content at once
            content = json.loads(response.content)
            audio_b64 = content["audioContent"]  # base64 encoded string
            if platform != "twilio":
                audio_content = base64.b64decode(audio_b64)
                await websocket.send_bytes(audio_content)
                return

            # audio_b64 includes WAV header. After base64 decode, the legnth is 58 Bytes for
            # the header. After encoding the WAV header, the length is 224. So we trunck the
            # first 224 bytes of the response received from google text to speech as twilio
            # is not expecting audio bytes to include WAV header:
            # https://www.twilio.com/docs/voice/twiml/stream#message-media-to-twilio
            media_response = {
                "event": "media",
                "streamSid": sid,
                "media": {
                    "payload": audio_b64[224:],
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

    async def generate_audio(self, text, voice_id="", language="en-US") -> bytes:
        headers = config.headers
        # For customized voices

        # if language != 'en-US':
        #     config.data["voice"]["languageCode"] = language
        data = {
            "input": {"text": text},
            "audioConfig": {"speakingRate": 1.2},
            **config.data,
        }
        url = config.url
        if voice_id:
            logger.info("Override voice_id")
            data["voice"]["name"] = voice_id
            if voice_id == "en-US-Studio-O":
                data["voice"]["ssmlGender"] = "FEMALE"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Google Cloud TTS returns response {response.status_code}")
            else:
                audio_content = response.content
                # Decode the base64-encoded audio content
                audio_content = base64.b64decode(audio_content)
                return audio_content
