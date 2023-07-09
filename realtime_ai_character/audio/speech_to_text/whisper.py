import io
import os
import tempfile
import wave

import numpy as np
import openai
import speech_recognition as sr
import whisper
from pydub import AudioSegment

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton

logger = get_logger(__name__)

RATE = 44100  # 44100
SECONDS = 2  # 2 seconds
DEBUG = False


class Whisper(Singleton):
    def __init__(self):
        logger.info("Loading Local Whisper model: [small]...")
        self.model = whisper.load_model('small')
        self.recognizer = sr.Recognizer()
        if DEBUG:
            self.wf = wave.open('output.wav', 'wb')
            self.wf.setnchannels(1)  # Assuming mono audio
            self.wf.setsampwidth(2)  # Assuming 16-bit audio
            self.wf.setframerate(RATE)  # Assuming 44100Hz sample rate

    def transcribe(self, audio_bytes, prompt=''):
        wav_io = self.convert_webm_to_wav(io.BytesIO(audio_bytes))
        # if DEBUG:
        #     self.wf.writeframes(audio_bytes)
        with sr.AudioFile(wav_io) as source:
            audio = self.recognizer.record(source)
        logger.info("Transcribing audio...")
        text = self.recognizer.recognize_whisper(
            audio,
            model="small",
            language='en',
            show_dict=True,
            initial_prompt=prompt
        )['text']
        return text

    def transcribe_api(self, audio_bytes, prompt=''):
        wav_io = self.convert_webm_to_wav(io.BytesIO(audio_bytes))
        # if DEBUG:
        #     self.wf.writeframes(audio_bytes)
        with sr.AudioFile(wav_io) as source:
            audio = self.recognizer.record(source)
        logger.info("Transcribing audio...")
        text = self.recognizer.recognize_whisper_api(
            audio,
            api_key=os.getenv("OPENAI_API_KEY"),
        )
        return text
    
    def _convert_webm_to_wav(webm_data):
        webm_audio = AudioSegment.from_file(webm_data, format="webm")
        wav_data = io.BytesIO()
        webm_audio.export(wav_data, format="wav")
        return wav_data


def get_speech_to_text():
    return Whisper.get_instance()
