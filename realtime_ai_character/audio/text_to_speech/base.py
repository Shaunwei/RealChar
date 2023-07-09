from abc import ABC, abstractmethod


class TextToSpeech(ABC):
    @abstractmethod
    async def stream(self, *args, **kwargs):
        pass
