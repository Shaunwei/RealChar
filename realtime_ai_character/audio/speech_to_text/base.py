from abc import ABC, abstractmethod


class SpeechToText(ABC):
    @abstractmethod
    def transcribe(self, audio_bytes, platform='web', prompt='') -> str:
        # platform: 'web' | 'mobile' | 'terminal'
        pass
