from abc import ABC, abstractmethod


class TextToSpeech(ABC):
    @abstractmethod
    async def stream(self, *args, **kwargs):
        pass

    def get_audio(self, *args, **kwargs):
        pass
