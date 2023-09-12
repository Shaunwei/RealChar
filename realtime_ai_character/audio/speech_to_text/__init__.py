import os

from realtime_ai_character.audio.speech_to_text.base import SpeechToText


def get_speech_to_text() -> SpeechToText:
    use = os.getenv('SPEECH_TO_TEXT_USE', 'LOCAL_WHISPER')
    if use == 'GOOGLE':
        from realtime_ai_character.audio.speech_to_text.google import Google
        return Google.get_instance()
    elif use == 'LOCAL_WHISPER':
        from realtime_ai_character.audio.speech_to_text.whisper import Whisper
        return Whisper.get_instance(use='local')
    elif use == 'OPENAI_WHISPER':
        from realtime_ai_character.audio.speech_to_text.whisper import Whisper
        return Whisper.get_instance(use='api')
    elif use == 'LOCAL_WHISPER_X':
        from realtime_ai_character.audio.speech_to_text.whisperx import WhisperX
        return WhisperX.get_instance()
    else:
        raise NotImplementedError(f'Unknown speech to text engine: {use}')
