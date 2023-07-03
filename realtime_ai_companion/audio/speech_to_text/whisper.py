import tempfile
import numpy as np
import os
import io
import wave
import whisper
from realtime_ai_companion.logger import get_logger
from realtime_ai_companion.utils import Singleton
import openai
import speech_recognition as sr

logger = get_logger(__name__)

RATE = 44100  # 44100
SECONDS = 2  # 2 seconds
DEBUG = False


class Whisper(Singleton):
    def __init__(self):
        logger.info("Loading Local Whisper model: [base]...")
        self.model = whisper.load_model('base')
        self.recognizer = sr.Recognizer()
        if DEBUG:
            self.wf = wave.open('output.wav', 'wb')
            self.wf.setnchannels(1)  # Assuming mono audio
            self.wf.setsampwidth(2)  # Assuming 16-bit audio
            self.wf.setframerate(RATE)  # Assuming 44100Hz sample rate

    def transcribe(self, audio_bytes, prompt=''):
        audio = sr.AudioData(audio_bytes, RATE, 2)
        logger.info("Transcribing audio...")
        text = self.recognizer.recognize_whisper(
            audio,
            model="base",
            language='en',
            show_dict=True,
            initial_prompt='WebScoket,ChatGPT,Raiden Shogun,Ei'
        )['text']
        return text

    def transcribe_api(self, audio_bytes, prompt=''):
        if DEBUG:
            self.wf.writeframes(audio_bytes)
        audio = sr.AudioData(audio_bytes, RATE, 2)
        logger.info("Transcribing audio...")
        text = self.recognizer.recognize_whisper_api(
            audio,
            api_key=os.getenv("OPENAI_API_KEY"),
        )
        return text


def get_speech_to_text():
    return Whisper.get_instance()
