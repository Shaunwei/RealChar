import os
import io
import time
import torch
import torchaudio
import numpy as np

import whisperx


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

MODEL = os.getenv("MODEL", "base")
LANGUAGE = os.getenv("LANGUAGE", "en")
HF_ACCESS_TOKEN = os.getenv("HF_ACCESS_TOKEN", "")


def log(message: str):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}")


class WhisperX:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if self.device.startswith("cuda") else "default"
        log(f"Loading [WhisperX Server] model: [{MODEL}]({self.device}) ...")
        self.model = whisperx.load_model(MODEL, self.device, compute_type=compute_type)
        self.model_a, self.metadata = whisperx.load_align_model(
            language_code=LANGUAGE, device=self.device
        )
        self.diarize_model = whisperx.DiarizationPipeline(
            device=self.device, use_auth_token=HF_ACCESS_TOKEN
        )

    def transcribe(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="en-US",
        suppress_tokens=[-1],
        diarization=False,
    ):
        log(f"Received {len(audio_bytes)} bytes of audio data. Language: {language}")

        if platform == "twilio":
            reader = torchaudio.io.StreamReader(
                io.BytesIO(audio_bytes), format="mulaw", option={"sample_rate": "8000"}
            )
        else:
            reader = torchaudio.io.StreamReader(io.BytesIO(audio_bytes))
        reader.add_basic_audio_stream(1000, sample_rate=16000)
        audio = torch.concat([chunk[0] for chunk in reader.stream()])  # type: ignore
        audio = audio.mean(dim=1).flatten().numpy().astype(np.float32)
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, LANGUAGE)

        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)

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
