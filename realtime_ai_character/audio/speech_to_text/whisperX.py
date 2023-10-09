import io
import os
import types
import json

import requests
import numpy as np

from realtime_ai_character.audio.speech_to_text.base import SpeechToText
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton, timed

logger = get_logger(__name__)

config = types.SimpleNamespace(
    **{
        "model": os.getenv("LOCAL_WHISPER_MODEL", "base"),
        "api_key": os.getenv("WHISPER_X_API_KEY"),
        "url": os.getenv("WHISPER_X_API_URL"),
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

ALIGN_MODEL_LANGUAGE_CODE = [
    "en",
    # "fr",
    # "de",
    # "es",
    # "it",
    # "ja",
    "zh",
    # "nl",
    # "uk",
    # "pt",
    # "ar",
    # "cs",
    # "ru",
    # "pl",
    # "hu",
    # "fi",
    # "fa",
    # "el",
    # "tr",
    # "da",
    # "he",
    # "vi",
    # "ko",
    # "ur",
    # "te",
    # "hi",
]

class WhisperX(Singleton, SpeechToText):
    def __init__(self, use: str = "local"):
        super().__init__()
        if use == "local":
            import whisperx
            from torch.cuda import is_available as is_cuda_available

            self.device = "cuda" if is_cuda_available() else "cpu"
            compute_type = "float16" if self.device == "cuda" else "default"
            logger.info(
                f"Loading [Local WhisperX] model: [{config.model}]({self.device}) ..."
            )
            self.model = whisperx.load_model(
                config.model,
                self.device,
                device_index=0,
                compute_type=compute_type,
            )
            self.align = [
                whisperx.load_align_model(language_code=language_code, device=self.device)
                for language_code in ALIGN_MODEL_LANGUAGE_CODE
            ]
            self.diarize_model = whisperx.DiarizationPipeline(
                model_name="pyannote/speaker-diarization",
                device=self.device,
                use_auth_token=os.getenv("HUGGING_FACE_ACCESS_TOKEN"),
            )
        self.use = use

    @timed
    def transcribe(
        self, audio_bytes, platform="web", prompt="", language="auto", suppress_tokens=[-1]
    ):
        logger.info("Transcribing audio...")
        if self.use == "local":
            result = self._transcribe(
                audio_bytes, platform, prompt, language, suppress_tokens
            )
        else:
            result = self._transcribe_api(
                audio_bytes, platform, prompt, language, suppress_tokens
            )
        if result is None:
            return ""
        text = " ".join([seg["text"].strip() for seg in result["segments"]])
        return text

    def _transcribe(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="auto",
        suppress_tokens=[-1],
        diarization=False,
    ):
        import torch
        import torchaudio

        if platform == "twilio":
            reader = torchaudio.io.StreamReader(
                io.BytesIO(audio_bytes), format="mulaw", option={"sample_rate": "8000"}
            )
        else:
            reader = torchaudio.io.StreamReader(io.BytesIO(audio_bytes))
        reader.add_basic_audio_stream(1000, sample_rate=16000)
        audio = torch.concat([chunk[0] for chunk in reader.stream()])  # type: ignore
        audio = audio.mean(dim=1).flatten().numpy().astype(np.float32)
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, None)
        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)

        if diarization and result["language"] in ALIGN_MODEL_LANGUAGE_CODE:
            result = self._diarize(audio, result, result["language"])

        return result

    def _diarize(self, audio, result, language):
        import whisperx

        model_a, metadata = self.align[language]
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            self.device,
        )
        diarize_segments = self.diarize_model(audio)
        result = whisperx.assign_word_speakers(diarize_segments, result)
        return result

    def _transcribe_api(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="auto",
        suppress_tokens=[-1],
        diarization=False,
    ):
        files = {"audio_file": ("audio_file", audio_bytes)}
        logger.info(f"Sent request to whisperX server: {len(audio_bytes)} bytes")
        metadata = {
            "api_key": config.api_key,
            "platform": platform,
            "initial_prompt": prompt,
            "language": language,
            "suppress_tokens": suppress_tokens,
            "diarization": diarization,
        }
        data = {"metadata": json.dumps(metadata)}
        try:
            response = requests.post(config.url, data=data, files=files, timeout=10)
            return response.json()
        except requests.exceptions.Timeout as e:
            logger.error(f"WhisperX server timed out: {e}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not connect to whisperX server: {e}")
        except KeyError as e:
            logger.error(f"Could not parse response from whisperX server: {e}")
        except Exception as e:
            logger.error(f"Unknown error from whisperX server: {e}")
