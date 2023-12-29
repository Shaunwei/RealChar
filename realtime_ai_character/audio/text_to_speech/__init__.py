import os
from typing import Optional

from realtime_ai_character.audio.text_to_speech.base import TextToSpeech


def get_text_to_speech(tts: Optional[str] = None) -> TextToSpeech:
    if (
        not tts
        or (tts == "ELEVEN_LABS" and not os.getenv("ELEVEN_LABS_API_KEY"))
        or (tts == "GOOGLE_TTS" and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
        or (tts == "XTTS" and not os.getenv("XTTS_API_KEY"))
    ):
        tts = "EDGE_TTS"
    if tts == "ELEVEN_LABS":
        from realtime_ai_character.audio.text_to_speech.elevenlabs import ElevenLabs

        ElevenLabs.initialize()
        return ElevenLabs.get_instance()
    elif tts == "GOOGLE_TTS":
        from realtime_ai_character.audio.text_to_speech.google_cloud_tts import GoogleCloudTTS

        GoogleCloudTTS.initialize()
        return GoogleCloudTTS.get_instance()
    elif tts == "EDGE_TTS":
        from realtime_ai_character.audio.text_to_speech.edge_tts import EdgeTTS

        EdgeTTS.initialize()
        return EdgeTTS.get_instance()
    elif tts == "XTTS":
        from realtime_ai_character.audio.text_to_speech.xtts import XTTS

        XTTS.initialize()
        return XTTS.get_instance()
    else:
        raise NotImplementedError(f"Unknown text to speech engine: {tts}")
