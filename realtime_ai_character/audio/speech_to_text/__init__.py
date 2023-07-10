import os

from dotenv import load_dotenv

from realtime_ai_character.audio.speech_to_text.base import SpeechToText

load_dotenv()


def get_speech_to_text() -> SpeechToText:
    use = os.getenv('SPEECH_TO_TEXT_USE', 'LOCAL_WHISPER')
    if use == 'GOOGLE':
        pass
    elif use == 'LOCAL_WHISPER':
        from realtime_ai_character.audio.speech_to_text.whisper import Whisper
        Whisper.initialize(use='local')
        return Whisper.get_instance()
    elif use == 'OPENAI_WHISPER':
        from realtime_ai_character.audio.speech_to_text.whisper import Whisper
        Whisper.initialize(use='api')
        return Whisper.get_instance()
    else:
        raise NotImplementedError(f'Unknown speech to text engine: {use}')
