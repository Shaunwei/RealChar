import os
import io
import time
import torch
import torchaudio
import numpy as np

import whisperx
import opencc


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

MODEL = os.getenv("MODEL", "base")
HF_ACCESS_TOKEN = os.getenv("HF_ACCESS_TOKEN", "")


def log(message: str):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}")


class WhisperX:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if self.device.startswith("cuda") else "default"
        log(f"Loading [WhisperX Server] model: [{MODEL}]({self.device}) ...")
        self.model = whisperx.load_model(MODEL, self.device, compute_type=compute_type)
        self.align = {
            language_code: whisperx.load_align_model(
                language_code=language_code, device=self.device
            )
            for language_code in ALIGN_MODEL_LANGUAGE_CODE
        }
        self.diarize_model = whisperx.DiarizationPipeline(
            device=self.device,
            use_auth_token=HF_ACCESS_TOKEN,
        )
        self.chinese_t2s = opencc.OpenCC("t2s.json")

    def transcribe(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="auto",
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
        wav = torch.concat([chunk[0] for chunk in reader.stream()])  # type: ignore
        audio = wav.mean(dim=1).flatten().numpy().astype(np.float32)
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, None)

        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)

        # convert traditional chinese to simplified chinese
        if result["language"] == "zh":
            for seg in result["segments"]:
                seg["text"] = self.chinese_t2s.convert(seg["text"])

        if diarization and result["language"] in ALIGN_MODEL_LANGUAGE_CODE:
            result = self._diarize(audio, result, result["language"])

        # console debug output
        text = " ".join([seg["text"].strip() for seg in result["segments"]])
        log(f"Transcript: {text}")
        log(f"Wav Shape: {wav.shape}")
        log(f"Audio length: {len(audio) / 16000:.2f} s")
        log(f"Received {reader.get_src_stream_info(0)}")

        return result

    def _diarize(self, audio, result, language):
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
