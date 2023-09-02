import os

from realtime_ai_character.audio.text_to_speech.base import TextToSpeech


def get_text_to_speech(tts: str = None) -> TextToSpeech:
    if not tts:
        tts = os.getenv('TEXT_TO_SPEECH_USE', 'ELEVEN_LABS')
    if tts == 'ELEVEN_LABS':
        from realtime_ai_character.audio.text_to_speech.elevenlabs import ElevenLabs
        ElevenLabs.initialize()
        return ElevenLabs.get_instance()
    elif tts == 'GOOGLE_TTS':
        from realtime_ai_character.audio.text_to_speech.google_cloud_tts import GoogleCloudTTS
        GoogleCloudTTS.initialize()
        return GoogleCloudTTS.get_instance()
    elif tts == 'UNREAL_SPEECH':
        from realtime_ai_character.audio.text_to_speech.unreal_speech import UnrealSpeech
        UnrealSpeech.initialize()
        return UnrealSpeech.get_instance()
    elif tts == 'EDGE_TTS':
        from realtime_ai_character.audio.text_to_speech.edge_tts import EdgeTTS
        EdgeTTS.initialize()
        return EdgeTTS.get_instance()
    else:
        raise NotImplementedError(f'Unknown text to speech engine: {tts}')
