import io
import os
import types
import torch
import torchaudio
import requests
import numpy as np
from torch.cuda import is_available as is_cuda_available

import whisperx

from realtime_ai_character.audio.speech_to_text.base import SpeechToText
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton, timed

logger = get_logger(__name__)

config = types.SimpleNamespace(
    **{
        "model": os.getenv("LOCAL_WHISPER_MODEL", "base"),
        "language": "en",
        "api_key": os.getenv("WHISPER_X_API_KEY"),
        "url": os.getenv("WHISPER_X_URL", "http://127.0.0.1:8000/transcribe"),
    }
)

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
    "zh-CN": "zh",
    "ja-JP": "jp",
    "ko-KR": "ko",
}


class WhisperX(Singleton, SpeechToText):
    def __init__(self, use: str = "local"):
        super().__init__()
        if use == "local":
            self.device = "cuda" if is_cuda_available() else "cpu"
            compute_type = "float16" if self.device == "cuda" else "default"
            logger.info(f"Loading [Local WhisperX] model: [{config.model}]({self.device}) ...")
            self.model = whisperx.load_model(
                config.model,
                self.device,
                device_index=0,
                compute_type=compute_type,
            )
            self.model_a, self.metadata = whisperx.load_align_model(
                language_code=config.language, device=self.device
            )
            self.diarize_model = whisperx.DiarizationPipeline(device=self.device)
        self.use = use

    @timed
    def transcribe(self, audio_bytes, platform, prompt="", language="en-US", suppress_tokens=[-1]):
        logger.info("Transcribing audio...")
        if self.use == "local":
            text, _ = self._transcribe(audio_bytes, prompt, language, suppress_tokens)
        else:
            text, _ = self._transcribe_api(audio_bytes, prompt, language, suppress_tokens)
        return text

    # still need to support the platform, prompt, and suppress_tokens
    def _transcribe(
        self,
        audio_bytes,
        prompt="",
        language="en-US",
        suppress_tokens=[-1],
        diarization=False,
    ):
        reader = torchaudio.io.StreamReader(io.BytesIO(audio_bytes))
        reader.add_basic_audio_stream(1000, sample_rate=16000)
        audio = torch.concat([chunk[0] for chunk in reader.stream()])  # type: ignore
        audio = audio.flatten().numpy().astype(np.float32)
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, config.language)

        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)

        if diarization:
            result = self._diarize(audio, result)

        text = " ".join([seg["text"].strip() for seg in result["segments"]])

        return text, result["segments"]

    def _transcribe_api(
        self,
        audio_bytes,
        prompt="",
        language="en-US",
        suppress_tokens=[-1],
        diarization=False,
    ):
        files = {"audio_file": ("audio_file", audio_bytes)}
        logger.info(f"Sent request to whisperX server: {len(audio_bytes)} bytes")
        data = {
            "api_key": config.api_key,
            "prompt": prompt,
            "language": language,
            "suppress_tokens": suppress_tokens,
            "diarization": diarization,
        }
        try:
            response = requests.post(config.url, data=data, files=files, timeout=10)
            data = response.json()
            return data["text"], data["segments"]
        except requests.exceptions.Timeout as e:
            raise Exception(f"WhisperX server timed out: {e}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Could not connect to whisperX server: {e}")
        except KeyError as e:
            raise Exception(f"Could not parse response from whisperX server: {e}")
        except Exception as e:
            raise Exception(f"Unknown error from whisperX server: {e}")

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
