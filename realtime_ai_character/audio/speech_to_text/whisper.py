import io
import os
import types
import wave

import speech_recognition as sr
import whisper
from pydub import AudioSegment

from realtime_ai_character.audio.speech_to_text.base import SpeechToText
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton

logger = get_logger(__name__)

RATE = 44100  # 44100
SECONDS = 2  # 2 seconds
DEBUG = False

config = types.SimpleNamespace(**{
    'model': 'small',
    'language': 'en',
    'api_key': os.getenv("OPENAI_API_KEY"),
})


class Whisper(Singleton, SpeechToText):
    def __init__(self, use='local'):
        super().__init__()
        if use == 'local':
            logger.info(f"Loading [Local Whisper] model: [{config.model}]...")
            self.model = whisper.load_model(config.model)
        self.recognizer = sr.Recognizer()
        self.use = use
        if DEBUG:
            self.wf = wave.open('output.wav', 'wb')
            self.wf.setnchannels(1)  # Assuming mono audio
            self.wf.setsampwidth(2)  # Assuming 16-bit audio
            self.wf.setframerate(RATE)  # Assuming 44100Hz sample rate

    def transcribe(self, audio_bytes, platform, prompt=''):
        logger.info('platform: ' + platform)
        if platform == 'web':
            audio = self._convert_webm_to_wav(audio_bytes)
        else:
            audio = sr.AudioData(audio_bytes, RATE, 2)
        if self.use == 'local':
            return self._transcribe(audio, prompt)
        elif self.use == 'api':
            return self._transcribe_api(audio, prompt)

    def _transcribe(self, audio, platform, prompt=''):
        logger.info("Transcribing audio...")
        text = self.recognizer.recognize_whisper(
            audio,
            model=config.model,
            language=config.language,
            show_dict=True,
            initial_prompt=prompt
        )['text']
        return text

    def _transcribe_api(self, audio, platform, prompt=''):
        if DEBUG:
            self.wf.writeframes(audio)
        logger.info("Transcribing audio...")
        text = self.recognizer.recognize_whisper_api(
            audio,
            api_key=config.api_key,
        )
        return text

    def _convert_webm_to_wav(self, webm_data):
        webm_audio = AudioSegment.from_file(
            io.BytesIO(webm_data), format="webm")
        wav_data = io.BytesIO()
        webm_audio.export(wav_data, format="wav")
        with sr.AudioFile(wav_data) as source:
            audio = self.recognizer.record(source)
        return audio
