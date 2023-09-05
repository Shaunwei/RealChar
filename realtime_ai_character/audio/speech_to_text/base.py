from abc import ABC, abstractmethod


class SpeechToText(ABC):
    @abstractmethod
    def transcribe(self, audio_bytes, platform='web', prompt='', language='en-US', suppress_tokens=[-1]) -> str:
        # platform: 'web' | 'mobile' | 'terminal'
        pass
