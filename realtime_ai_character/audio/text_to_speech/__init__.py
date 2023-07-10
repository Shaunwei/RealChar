import os

from dotenv import load_dotenv

from realtime_ai_character.audio.text_to_speech.base import TextToSpeech

load_dotenv()


def get_text_to_speech() -> TextToSpeech:
    use = os.getenv('TEXT_TO_SPEECH_USE', 'ELEVEN_LABS')
    if use == 'ELEVEN_LABS':
        from realtime_ai_character.audio.text_to_speech.elevenlabs import \
            ElevenLabs
        ElevenLabs.initialize()
        return ElevenLabs.get_instance()
    else:
        raise NotImplementedError(f'Unknown text to speech engine: {use}')
