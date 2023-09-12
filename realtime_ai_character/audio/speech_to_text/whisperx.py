import io
import os
import types
import wave
import torch
import torchaudio

import whisperx
import numpy as np
from torch.cuda import is_available as is_cuda_available

from realtime_ai_character.audio.speech_to_text.base import SpeechToText
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton, timed

DEBUG = False

logger = get_logger(__name__)

config = types.SimpleNamespace(**{
    'model': os.getenv("LOCAL_WHISPER_MODEL", "base"),
    'language': 'en',
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


class WhisperX(Singleton, SpeechToText):
    def __init__(self):
        super().__init__()
        self.device = "cuda" if is_cuda_available() else "cpu"
        logger.info(f"Loading [Local WhisperX] model: [{config.model}]({self.device}) ...")
        self.model = whisperx.load_model(
            config.model,
            self.device,
            device_index=0,
        )
        self.model_a, self.metadata = whisperx.load_align_model(
            language_code=config.language, device=self.device
        )
        self.diarize_model = whisperx.DiarizationPipeline(device=self.device)
        if DEBUG:
            self.wf = wave.open("output.wav", "wb")
            self.wf.setnchannels(1)  # Assuming mono audio
            self.wf.setsampwidth(2)  # Assuming 16-bit audio
            self.wf.setframerate(44100)  # Assuming 44100Hz sample rate
        # warm up to reduce the first sentence latency
        self.model.transcribe(np.zeros(16000, np.float32), batch_size=1, language="en")

    @timed
    def transcribe(self, audio_bytes, platform, prompt="", language="en-US", suppress_tokens=[-1]):
        logger.info("Transcribing audio...")
        result = self._transcribe(audio_bytes, platform, prompt, language, suppress_tokens)
        text = " ".join([seg["text"].strip() for seg in result["segments"]])
        return text

    # still need to support the platform, prompt, and suppores_tokens
    def _transcribe(
        self,
        audio_bytes,
        platform,
        prompt="",
        language="en-US",
        suppress_tokens=[-1],
        diarization=False,
    ):
        reader = torchaudio.io.StreamReader(io.BytesIO(audio_bytes))
        reader.add_basic_audio_stream(1000, sample_rate=16000)
        audio = torch.concat([chunk[0] for chunk in reader.stream()])
        audio = audio.flatten().numpy().astype(np.float32)
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, config.language)

        result = self.model.transcribe(
            audio,
            batch_size=1,
            language=language,
            # vad_filter=True,
            # initial_prompt=prompt,
            # suppress_tokens=suppress_tokens,
        )

        if diarization:
            result = self._diarize(audio, result)
        return result

    def _diarize(self, audio, result):
        result = whisperx.align(
            result["segments"],
            self.model_a,
            self.metadata,
            audio,
            self.device,
        )
        diarize_segments = self.diarize_model(audio)
        result = whisperx.assign_word_speakers(diarize_segments, result)
        return result
