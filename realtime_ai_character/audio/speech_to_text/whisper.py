import io
import os
import types
import wave

import speech_recognition as sr
from faster_whisper import WhisperModel
from pydub import AudioSegment
from torch.cuda import is_available as is_cuda_available

from realtime_ai_character.audio.speech_to_text.base import SpeechToText
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton

DEBUG = False
logger = get_logger(__name__)
config = types.SimpleNamespace(**{
    'model': os.getenv("LOCAL_WHISPER_MODEL", "base"),
    'language': 'en',
    'api_key': os.getenv("OPENAI_API_KEY"),
})

# Whisper use a shorter version for language code. Provide a mapping to convert
# from the standard language code to the whisper language code.
WHISPER_LANGUAGE_CODE_MAPPING = {
    "en-US": "en",
    "es-ES": "es",
    "fr-FR": "fr",
    "de-DE": "de",
    "it-IT": "it",
    "pt-PT": "pt",
    "hi-IN": "hi",
    "pl-PL": "pl",
    'zh-CN': 'zh',
    'ja-JP': 'jp',
    'ko-KR': 'ko',
}


class Whisper(Singleton, SpeechToText):
    def __init__(self, use="local"):
        super().__init__()
        if use == "local":
            device = 'cuda' if is_cuda_available() else 'cpu'
            logger.info(f"Loading [Local Whisper] model: [{config.model}]({device}) ...")
            self.model = WhisperModel(
                model_size_or_path=config.model,
                device="auto",
                download_root=None,
            )
        self.recognizer = sr.Recognizer()
        self.use = use
        if DEBUG:
            self.wf = wave.open("output.wav", "wb")
            self.wf.setnchannels(1)  # Assuming mono audio
            self.wf.setsampwidth(2)  # Assuming 16-bit audio
            self.wf.setframerate(44100)  # Assuming 44100Hz sample rate

    def transcribe(self, audio_bytes, platform, prompt="", language="en-US"):
        logger.info("Transcribing audio...")
        if platform == "web":
            audio = self._convert_webm_to_wav(audio_bytes, self.use == "local")
        else:
            audio = self._convert_bytes_to_wav(audio_bytes, self.use == "local")
        if self.use == "local":
            return self._transcribe(audio, prompt)
        elif self.use == "api":
            return self._transcribe_api(audio, prompt)

    def _transcribe(self, audio, prompt="", language="en-US"):
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, config.language)
        segs, _ = self.model.transcribe(
            audio, language=language, vad_filter=True, initial_prompt=prompt
        )
        text = " ".join([seg.text for seg in segs])
        return text

    def _transcribe_api(self, audio, prompt=""):
        text = self.recognizer.recognize_whisper_api(
            audio,
            api_key=config.api_key,
        )
        return text

    def _convert_webm_to_wav(self, webm_data, local=True):
        webm_audio = AudioSegment.from_file(io.BytesIO(webm_data), format="webm")
        wav_data = io.BytesIO()
        webm_audio.export(wav_data, format="wav")
        if local:
            return wav_data
        with sr.AudioFile(wav_data) as source:
            audio = self.recognizer.record(source)
        return audio

    def _convert_bytes_to_wav(self, audio_bytes, local=True):
        if local:
            audio = io.BytesIO(sr.AudioData(audio_bytes, 44100, 2).get_wav_data())
            return audio
        return sr.AudioData(audio_bytes, 44100, 2)
