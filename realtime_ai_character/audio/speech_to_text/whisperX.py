import json
import io
import os
import time
import uuid
from copy import deepcopy

import numpy as np
import requests
from dotenv import load_dotenv

from realtime_ai_character.audio.speech_to_text.base import SpeechToText
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import (
    DiarizedSingleSegment,
    Singleton,
    SingleWordSegment,
    timed,
    Transcript,
    TranscriptSlice,
    WhisperXResponse,
)


logger = get_logger(__name__)

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

load_dotenv()

MODEL = os.getenv("LOCAL_WHISPER_MODEL", "base")
DIARIZATION = os.getenv("JOURNAL_MODE", "false").lower() == "true"
HF_ACCESS_TOKEN = os.getenv("HF_ACCESS_TOKEN", "")
OPENCC = os.getenv("OPENCC", "")

WHISPER_X_API_KEY = os.getenv("WHISPER_X_API_KEY", "")
WHISPER_X_API_URL = os.getenv("WHISPER_X_API_URL", "")
WHISPER_X_API_URL_JOURNAL = os.getenv("WHISPER_X_API_URL_JOURNAL", "")


class WhisperX(Singleton, SpeechToText):
    def __init__(self, use: str = "local"):
        super().__init__()
        if use == "local":
            import torch
            import whisperx

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            compute_type = "float16" if self.device.startswith("cuda") else "default"
            logger.info(f"Loading [Local WhisperX] model: [{MODEL}]({self.device}) ...")
            self.model = whisperx.load_model(MODEL, self.device, compute_type=compute_type)
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
            if OPENCC:
                import opencc

                assert OPENCC in ["t2s", "s2t"], 'OPENCC should be either "t2s" or "s2t"'
                self.chinese_t2s = opencc.OpenCC(f"{OPENCC}.json")

            self._transcribe = self._transcribe_local
        else:
            self._transcribe = self._transcribe_api

    @timed
    def transcribe(self, audio_bytes, platform="web", prompt="", language="", suppress_tokens=[-1]):
        logger.info("Transcribing audio...")
        result = self._transcribe(audio_bytes, platform, prompt, language, suppress_tokens)
        if isinstance(result, dict):
            segments = result.get("segments", [])
            text = " ".join([seg.get("text", "").strip() for seg in segments])
            return text
        else:
            return ""

    @timed
    def transcribe_diarize(
        self,
        transcripts: list[Transcript],
        platform="web",
        prompt="",
        language="",
        suppress_tokens=[-1],
        speaker_audio_samples={},
    ):
        import torch

        logger.info("Transcribing audio...")

        # initial attempt, transcribe with diarization
        if len(transcripts) == 1 and transcripts[0].id == "":
            transcript = transcripts[0]
            timestamp = time.time()
            response = self._transcribe(
                transcript.audio_bytes,
                platform,
                prompt,
                language,
                suppress_tokens,
                True,
                speaker_audio_samples,
            )
            if not response or not response["segments"]:  # empty transcript not allowed
                return []
            transcript.id = str(uuid.uuid4().hex)
            transcript.timestamp = timestamp
            audio = self.get_audio(transcript.audio_bytes, platform)
            transcript.duration = len(audio) / 16000
            for seg in response["segments"]:
                transcript.slices.append(
                    TranscriptSlice(
                        id=str(uuid.uuid4().hex),
                        audio_id=transcript.id,
                        speaker_id=seg.get("speaker", ""),
                        text=seg.get("text", "").strip(),
                        start=seg.get("start", 0),
                        end=seg.get("end", 0),
                    )
                )
            return transcripts

        # non-initial attempts, transcribe with alignment, no diarization
        if any([transcript.id == "" for transcript in transcripts]) or not transcripts:
            return []
        # prepare audio
        gap = 2  # seconds between audio slices
        start_times = [0.0]
        audio = self.get_audio(transcripts[0].audio_bytes, platform)
        for transcript in transcripts[1:]:
            start_times.append(len(audio) / 16000 + gap + 0.5)
            audio_slice = self.get_audio(transcript.audio_bytes, platform)
            audio = np.concatenate([audio, np.zeros(16000 * gap, np.float32), audio_slice])
        buffer = io.BytesIO()
        wav = torch.from_numpy(audio[None, :])
        torchaudio.save(buffer, wav, 16000, format="wav")  # type: ignore
        audio_bytes = buffer.getvalue()
        # transcribe
        response = self._transcribe(audio_bytes, platform, prompt, language, suppress_tokens, True)
        if not response:
            return []
        word_segments = response["word_segments"]
        idx = 0
        for transcript, start_time in zip(transcripts, start_times):
            for slice in transcript.slices:
                words = []
                while idx < len(word_segments):
                    if word_segments[idx].get("start") is not None:
                        start = word_segments[idx]["start"]
                    elif idx > 0 and word_segments[idx - 1].get("end"):
                        start = word_segments[idx - 1]["end"] + 0.01
                    else:
                        start = 0
                    if start > start_time + slice.end:
                        break
                    words.append(word_segments[idx]["word"])
                    idx += 1
                spacer = "" if response["language"] == "zh" else " "
                slice.text = spacer.join(words)
        return transcripts

    @timed
    def _transcribe_local(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="",
        suppress_tokens=[-1],
        diarization=False,
        speaker_audio_samples={},
    ):
        logger.info(
            f"Received {len(audio_bytes)} bytes of audio data. Language: {language}. "
            f"Platform: {platform}. Diarization: {diarization}. "
            f"Speaker audio samples: {[(id, len(ab)) for id, ab in speaker_audio_samples.items()]}."
        )

        audio = self.get_audio(audio_bytes, platform, verbose=True)

        # _transcribe
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language)
        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)

        # convert traditional chinese to simplified chinese
        if result["language"] == "zh" and OPENCC:
            for seg in result["segments"]:
                seg["text"] = self.chinese_t2s.convert(seg["text"])

        segments = [DiarizedSingleSegment(**seg, speaker="") for seg in result["segments"]]
        response = WhisperXResponse(
            segments=segments, language=result["language"], word_segments=[]
        )
        text = " ".join([seg["text"].strip() for seg in segments])
        logger.info(f"Transcript: {text}")

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
                logger.info(f"Diarized transcript: {message}")

        return response

    def get_audio(self, audio_bytes: bytes, platform: str, verbose: bool = False):
        import torch
        import torchaudio

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
            logger.info(f"Wav Shape: {wav.shape}")
            logger.info(f"Audio length: {len(audio) / 16000:.2f} s")
            logger.info(f"Received {reader.get_src_stream_info(0)}")
        return audio

    @timed
    def align(self, response: WhisperXResponse, audio: np.ndarray):
        import whisperx

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

    def _transcribe_api(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="",
        suppress_tokens=[-1],
        diarization=False,
        speaker_audio_samples={},
    ):
        files = {"audio_file": ("", audio_bytes)}
        for id, speaker_audio_sample in speaker_audio_samples.items():
            files[f"speaker_audio_sample_{id}"] = ("", speaker_audio_sample)
        metadata = {
            "api_key": WHISPER_X_API_KEY,
            "platform": platform,
            "initial_prompt": prompt,
            "language": language,
            "suppress_tokens": suppress_tokens,
            "diarization": diarization,
        }
        data = {"metadata": json.dumps(metadata)}
        url = WHISPER_X_API_URL_JOURNAL if diarization else WHISPER_X_API_URL
        try:
            logger.info(f"Sent request to whisperX server {url}: {len(audio_bytes)} bytes")
            response = requests.post(url, data=data, files=files)
            return WhisperXResponse(**response.json())
        except requests.exceptions.Timeout as e:
            logger.error(f"WhisperX server {url} timed out: {e}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not connect to whisperX server {url}: {e}")
        except KeyError as e:
            logger.error(f"Could not parse response from whisperX server {url}: {e}")
        except Exception as e:
            logger.error(f"Unknown error from whisperX server {url}: {e}")
