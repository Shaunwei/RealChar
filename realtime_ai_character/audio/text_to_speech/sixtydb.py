import asyncio
import base64
import json
import math
import os

import httpx

from realtime_ai_character.audio.text_to_speech.base import TextToSpeech
from realtime_ai_character.utils import Singleton, timed


class SixtyDB(Singleton, TextToSpeech):
    """60db workspace voices, buffered as one MP3 asset per browser message."""

    def __init__(self, api_key=None, voice_id=None, model=None, speed=1.0, timeout=60.0):
        key = api_key or os.getenv("SIXTYDB_API_KEY")
        self.voice_id = voice_id or os.getenv("SIXTYDB_VOICE_ID", "")
        self.model = model or os.getenv("SIXTYDB_MODEL")
        if not isinstance(key, str) or not key.strip():
            raise ValueError("SIXTYDB_API_KEY is required for 60db text to speech")
        self.api_key = key
        if (
            isinstance(speed, bool)
            or not isinstance(speed, (int, float))
            or not math.isfinite(speed)
            or not 0.5 <= speed <= 2.0
        ):
            raise ValueError("60db speed must be finite and between 0.5 and 2.0")
        if (
            isinstance(timeout, bool)
            or not isinstance(timeout, (int, float))
            or not math.isfinite(timeout)
            or timeout <= 0
        ):
            raise ValueError("60db timeout must be finite and positive")
        self.speed = speed
        self.timeout = timeout

    @staticmethod
    def _check_metadata(record):
        if not isinstance(record, dict):
            raise ValueError("60db returned an invalid response object")
        if record.get("success") is False or record.get("type") == "error" or record.get("error"):
            raise ValueError("60db reported a synthesis failure")
        for field in ("encoding", "audio_encoding", "output_format"):
            if record.get(field) is not None and str(record[field]).lower() != "mp3":
                raise ValueError("60db must return MP3 audio for browser playback")
        if "audio_config" in record:
            SixtyDB._check_metadata(record["audio_config"])

    @staticmethod
    def _check_mp3(audio):
        # Recognize MP3 framing, rather than passing WAV/PCM/JSON to the browser.
        # Full decoding belongs to the existing browser audio decoder.
        offset = 0
        if audio.startswith(b"ID3"):
            if len(audio) < 10 or any(byte & 128 for byte in audio[6:10]):
                raise ValueError("60db returned an invalid MP3 ID3 header")
            size = 0
            for byte in audio[6:10]:
                size = (size << 7) | byte
            offset = 10 + size
        frame = audio[offset : offset + 4]
        if (
            len(frame) < 4
            or frame[0] != 255
            or frame[1] & 224 != 224
            or (frame[1] >> 3) & 3 == 1
            or frame[1] & 6 == 0
            or frame[2] >> 4 in {0, 15}
            or (frame[2] >> 2) & 3 == 3
        ):
            raise ValueError("60db returned empty or incompatible MP3 audio")
        return audio

    async def _generate(self, text, voice_id, language, tts_event=None):
        if not isinstance(text, str) or not text.strip() or len(text) > 5000:
            raise ValueError("60db text must contain 1 to 5000 characters")
        voice_id = voice_id or self.voice_id
        if not isinstance(voice_id, str) or not voice_id.strip():
            raise ValueError("Select a 60db workspace voice_id or set SIXTYDB_VOICE_ID")
        payload = {
            "text": text,
            "voice_id": voice_id,
            "speed": self.speed,
            "output_format": "mp3",
        }
        if self.model:
            payload["model_id"] = self.model
        if language:
            payload["target_language"] = language.split("-")[0].lower()
        if tts_event is not None and tts_event.is_set():
            return b""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                "https://api.60db.ai/tts-synthesize",
                headers={
                    "Authorization": "Bearer " + self.api_key,
                    "Accept": "audio/mpeg, application/json",
                    "Content-Type": "application/json",
                },
                json=payload,
            ) as response:
                # Do not forward or log provider error bodies (or credentials).
                response.raise_for_status()
                content_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
                if content_type not in {
                    "audio/mpeg",
                    "audio/mp3",
                    "application/octet-stream",
                    "application/json",
                }:
                    raise ValueError("60db returned an unsupported MP3 response type")
                self._check_metadata(
                    {
                        field: response.headers[header]
                        for field, header in (
                            ("encoding", "x-audio-encoding"),
                            ("output_format", "x-output-format"),
                        )
                        if header in response.headers
                    }
                )
                body = bytearray()
                async for chunk in response.aiter_bytes():
                    if tts_event is not None and tts_event.is_set():
                        return b""
                    body.extend(chunk)
                if tts_event is not None and tts_event.is_set():
                    return b""
                audio = bytes(body)
                if content_type == "application/json":
                    record = json.loads(audio)
                    self._check_metadata(record)
                    backend = record.get("backendResponse", record)
                    self._check_metadata(backend)
                    audio = base64.b64decode(backend["audio_base64"], validate=True)
                return self._check_mp3(bytes(audio))

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
        **kwargs
    ) -> None:
        if platform == "twilio":
            raise ValueError("60db supports browser MP3 playback; Twilio requires raw mu-law audio")
        audio = await self._generate(text, voice_id, language, tts_event)
        if audio and not tts_event.is_set():
            await websocket.send_bytes(audio)

    async def generate_audio(self, text, voice_id="", language="en-US") -> bytes:
        return await self._generate(text, voice_id, language)
