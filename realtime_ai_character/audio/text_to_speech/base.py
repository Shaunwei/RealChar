from abc import ABC, abstractmethod
from asyncio import Event

from fastapi import WebSocket

from realtime_ai_character.utils import timed


class TextToSpeech(ABC):
    @abstractmethod
    @timed
    async def stream(
        self,
        text: str,
        websocket: WebSocket,
        tts_event: Event,
        voice_id: str,
        first_sentence: bool,
        language: str,
        *args,
        **kwargs
    ):
        pass

    async def generate_audio(self, *args, **kwargs):
        pass
