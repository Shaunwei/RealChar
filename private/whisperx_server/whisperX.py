import os
import io
import time
import torch
import torchaudio
import numpy as np
from copy import deepcopy
from typing import TypedDict, List
from dotenv import load_dotenv


import whisperx
import opencc
from whisperx.types import SingleWordSegment


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

load_dotenv()
MODEL = os.getenv("MODEL", "base")
DIARIZATION = os.getenv("DIARIZATION", "false").lower() == "true"
HF_ACCESS_TOKEN = os.getenv("HF_ACCESS_TOKEN", "")


def log(message: str):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}")


def timed(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        log(f"{func.__qualname__} took {(time.perf_counter() - start) * 1000:.0f} ms")
        return result

    return wrapper


class DiarizedSingleSegment(TypedDict):
    start: float
    end: float
    text: str
    speaker: str


class WhisperXResponse(TypedDict):
    segments: List[DiarizedSingleSegment]
    language: str
    word_segments: List[SingleWordSegment]


class WhisperX:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if self.device.startswith("cuda") else "default"
        log(f"Loading [WhisperX Server] model: [{MODEL}]({self.device}) ...")
        self.model = whisperx.load_model(MODEL, self.device, compute_type=compute_type)
        self.chinese_t2s = opencc.OpenCC("t2s.json")
        if DIARIZATION:
            self.align_model = {
                language_code: whisperx.load_align_model(
                    language_code=language_code, device=self.device
                )
                for language_code in ALIGN_MODEL_LANGUAGE_CODE
            }
            self.diarize_model = whisperx.DiarizationPipeline(
                device=self.device,
                use_auth_token=HF_ACCESS_TOKEN,
            )

    @timed
    def transcribe(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="auto",
        suppress_tokens=[-1],
        diarization=False,
        speaker_audio_samples={},
    ):
        log(
            f"Received {len(audio_bytes)} bytes of audio data. Language: {language}. "
            f"Platform: {platform}. Diarization: {diarization}. "
            f"Speaker audio samples: {[(id, len(ab)) for id, ab in speaker_audio_samples.items()]}."
        )

        audio = self.get_audio(audio_bytes, platform, verbose=True)
        result = self._transcribe(audio, prompt, language, suppress_tokens)
        segments = [DiarizedSingleSegment(**seg, speaker="") for seg in result["segments"]]
        response = WhisperXResponse(
            segments=segments, language=result["language"], word_segments=[]
        )
        text = " ".join([seg["text"].strip() for seg in segments])
        log(f"Transcript: {text}")

        if DIARIZATION and diarization:
            self.align(response, audio)
            if speaker_audio_samples:
                speaker_audios = {
                    id: self.get_audio(ab, platform) for id, ab in speaker_audio_samples.items()
                }
                self.diarize(response, audio, speaker_audios)
                message = [
                    (
                        seg["speaker"],
                        seg["text"],
                        "{:.2f}".format(seg["start"]),
                        "{:.2f}".format(seg["end"]),
                    )
                    for seg in response["segments"]
                ]
                log(f"Diarized transcript: {message}")

        return response

    def get_audio(self, audio_bytes: bytes, platform: str, verbose: bool = False):
        if platform == "twilio":
            reader = torchaudio.io.StreamReader(
                io.BytesIO(audio_bytes), format="mulaw", option={"sample_rate": "8000"}
            )
        else:
            reader = torchaudio.io.StreamReader(io.BytesIO(audio_bytes))
        reader.add_basic_audio_stream(1000, sample_rate=16000)
        wav = torch.concat([chunk[0] for chunk in reader.stream()])  # type: ignore
        audio: np.ndarray = wav.mean(dim=1).flatten().numpy().astype(np.float32)
        if verbose:
            log(f"Wav Shape: {wav.shape}")
            log(f"Audio length: {len(audio) / 16000:.2f} s")
            log(f"Received {reader.get_src_stream_info(0)}")
        return audio

    @timed
    def _transcribe(self, audio, prompt="", language="auto", suppress_tokens=[-1]):
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, None)
        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)

        # convert traditional chinese to simplified chinese
        if result["language"] == "zh":
            for seg in result["segments"]:
                seg["text"] = self.chinese_t2s.convert(seg["text"])

        return result

    @timed
    def align(self, response: WhisperXResponse, audio: np.ndarray):
        segments = deepcopy(response["segments"])
        language = response["language"]
        if language in ALIGN_MODEL_LANGUAGE_CODE:
            model_a, metadata = self.align_model[language]
            aligned_result = whisperx.align(
                segments,
                model_a,
                metadata,
                audio,
                self.device,
            )
            response["word_segments"] = aligned_result["word_segments"]
        else:
            response["word_segments"] = [
                SingleWordSegment(
                    start=seg.get("start"),
                    end=seg.get("end"),
                    word=seg.get("text"),
                    score=0,
                )
                for seg in segments
            ]

    @timed
    def diarize(
        self, response: WhisperXResponse, audio: np.ndarray, speaker_audios: dict[str, np.ndarray]
    ):
        gap = 2  # seconds between audio slices
        audio_end = len(audio) / 16000 + gap / 2
        speaker_mid = {}
        ext_audio = audio.copy()
        for id, speaker_audio in speaker_audios.items():
            ext_audio = np.concatenate(
                [ext_audio, np.zeros(16000 * gap, np.float32), speaker_audio]
            )
            speaker_mid[id] = (len(ext_audio) - len(speaker_audio) / 2) / 16000

        # diarize
        num_speakers = len(speaker_audios)
        diarize_segments = self.diarize_model(ext_audio, min_speakers=0, max_speakers=num_speakers)

        # figure out speaker id map
        speaker_id = {}
        counter = {}
        for _, row in diarize_segments.iterrows():
            speaker = row["speaker"]
            if speaker not in counter:
                counter[speaker] = set()
            for id, mid in speaker_mid.items():
                if row["start"] < mid < row["end"]:
                    counter[speaker].add(id)
        for speaker, ids in counter.items():
            if len(ids) == 1:
                speaker_id[speaker] = ids.pop()
            else:
                speaker_id[speaker] = ""

        # align results with mapped speaker id
        segments = [
            DiarizedSingleSegment(
                start=row["start"],
                end=row["end"],
                text="",
                speaker=speaker_id[row["speaker"]],
            )
            for _, row in diarize_segments.iterrows()
            if row["end"] < audio_end
        ]
        word_segments = response["word_segments"]
        idx = 0
        for seg in segments:
            words = []
            while idx < len(word_segments):
                if word_segments[idx].get("start") is not None:
                    start = word_segments[idx]["start"]
                elif idx > 0 and word_segments[idx - 1].get("end"):
                    start = word_segments[idx - 1]["end"] + 0.01
                else:
                    start = 0
                if start > seg["end"]:
                    break
                words.append(word_segments[idx]["word"])
                idx += 1
            spacer = "" if response["language"] == "zh" else " "
            seg["text"] = spacer.join(words)

        # filter out empty segments
        response["segments"] = [seg for seg in segments if seg["text"]]
