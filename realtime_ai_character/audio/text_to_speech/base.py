from abc import ABC, abstractmethod
from realtime_ai_character.utils import timed


class TextToSpeech(ABC):
    @abstractmethod
    @timed
    async def stream(self, *args, **kwargs):
        pass

    async def generate_audio(self,  *args, **kwargs):
        pass
