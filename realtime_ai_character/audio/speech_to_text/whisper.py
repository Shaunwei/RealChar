import io
import os
import tempfile
import wave

import numpy as np
import openai
import speech_recognition as sr
import whisper

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
        audio = sr.AudioData(audio_bytes, RATE, 2)
        logger.info("Transcribing audio...")
        text = self.recognizer.recognize_whisper(
            audio,
            model="small",
            language='en',
            show_dict=True,
            # TODO: pass in prompt during conversation
            initial_prompt='ChatGPT,Raiden Shogun,Ei'
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
