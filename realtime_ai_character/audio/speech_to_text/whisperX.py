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
            import opencc
            from torch.cuda import is_available as is_cuda_available

            self.device = "cuda" if is_cuda_available() else "cpu"
            compute_type = "float16" if self.device == "cuda" else "default"
            logger.info(f"Loading [Local WhisperX] model: [{config.model}]({self.device}) ...")
            self.model = whisperx.load_model(
                config.model,
                self.device,
                device_index=0,
                compute_type=compute_type,
            )
            self.align = {
                language_code: whisperx.load_align_model(
                    language_code=language_code, device=self.device
                )
                for language_code in ALIGN_MODEL_LANGUAGE_CODE
            }
            self.diarize_model = whisperx.DiarizationPipeline(
                device=self.device,
                use_auth_token=os.getenv("HUGGING_FACE_ACCESS_TOKEN"),
            )
            self.chinese_t2s = opencc.OpenCC("t2s.json")
        self.use = use

    @timed
    def transcribe(
        self, audio_bytes, platform="web", prompt="", language="auto", suppress_tokens=[-1]
    ):
        logger.info("Transcribing audio...")
        if self.use == "local":
            result = self._transcribe(audio_bytes, platform, prompt, language, suppress_tokens)
        else:
            result = self._transcribe_api(audio_bytes, platform, prompt, language, suppress_tokens)
        if result is None:
            return ""
        text = " ".join([seg["text"].strip() for seg in result["segments"]])
        return text

    @timed
    def transcribe_diarize(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="auto",
        suppress_tokens=[-1],
        speaker_audio_samples={},
    ):
        logger.info("Transcribing audio...")
        if self.use == "local":
            result = self._transcribe(
                audio_bytes,
                platform,
                prompt,
                language,
                suppress_tokens,
                diarization=True,
                speaker_audio_samples=speaker_audio_samples,
            )
        else:
            result = self._transcribe_api(
                audio_bytes,
                platform,
                prompt,
                language,
                suppress_tokens,
                diarization=True,
                speaker_audio_samples=speaker_audio_samples,
            )
        transcript = []
        if result:
            for seg in result["segments"]:
                transcript.append((seg.get("speaker", ""), seg["text"].strip()))
        return transcript

    def _transcribe(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="auto",
        suppress_tokens=[-1],
        diarization=False,
        speaker_audio_samples={},
    ):
        import torch
        import torchaudio

        logger.info(
            f"Received {len(audio_bytes)} bytes of audio data. Language: {language}. "
            f"Platform: {platform}. Diarization: {diarization}. "
            f"Speaker audio samples: {[(id, len(ab)) for id, ab in speaker_audio_samples.items()]}."
        )

        def get_audio(audio_bytes: bytes, verbose: bool = False):
            if platform == "twilio":
                reader = torchaudio.io.StreamReader(
                    io.BytesIO(audio_bytes), format="mulaw", option={"sample_rate": "8000"}
                )
            else:
                reader = torchaudio.io.StreamReader(io.BytesIO(audio_bytes))
            reader.add_basic_audio_stream(1000, sample_rate=16000)
            wav = torch.concat([chunk[0] for chunk in reader.stream()])  # type: ignore
            audio = wav.mean(dim=1).flatten().numpy().astype(np.float32)
            if verbose:
                logger.info(f"Wav Shape: {wav.shape}")
                logger.info(f"Audio length: {len(audio) / 16000:.2f} s")
                logger.info(f"Received {reader.get_src_stream_info(0)}")
            return audio

        # prepare audio
        audio = get_audio(audio_bytes, verbose=True)

        # transcribe
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, None)
        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)
        if not result["segments"]:
            return result

        # convert traditional chinese to simplified chinese
        if result["language"] == "zh":
            for seg in result["segments"]:
                seg["text"] = self.chinese_t2s.convert(seg["text"])

        # console debug output
        text = " ".join([seg["text"].strip() for seg in result["segments"]])
        logger.info(f"Transcript: {text}")

        # diarization
        if diarization and speaker_audio_samples:
            speaker_audios = {id: get_audio(ab) for id, ab in speaker_audio_samples.items()}
            result = self._diarize(result, audio, speaker_audios)

        return result

    def _diarize(self, result, audio: np.ndarray, speaker_audios: dict[str, np.ndarray]):
        import whisperx

        gap = 2  # seconds between audio slices
        audio_end = len(audio) / 16000 + gap / 2
        speaker_mid = {}
        ext_audio = audio.copy()
        for id, speaker_audio in speaker_audios.items():
            ext_audio = np.concatenate(
                [ext_audio, np.zeros(16000 * gap, np.float32), speaker_audio]
            )
            speaker_mid[id] = (len(ext_audio) - len(speaker_audio) / 2) / 16000
        language = result["language"]
        # align audio with wav2vec2
        if language in ALIGN_MODEL_LANGUAGE_CODE:
            model_a, metadata = self.align[language]
            result = whisperx.align(
                result["segments"],
                model_a,
                metadata,
                audio,
                self.device,
            )
            word_segments = result["word_segments"]
        else:
            word_segments = [
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "word": seg["text"],
                }
                for seg in result["segments"]
            ]
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
        result = {
            "segments": [
                {
                    "start": row["start"],
                    "end": row["end"],
                    "speaker": speaker_id[row["speaker"]],
                }
                for _, row in diarize_segments.iterrows()
                if row["end"] < audio_end
            ],
            "language": language,
        }
        idx = 0
        for seg in result["segments"]:
            words = []
            while idx < len(word_segments):
                if "start" in word_segments[idx]:
                    start = word_segments[idx]["start"]
                elif idx > 0:
                    start = word_segments[idx - 1]["end"] + 0.01
                else:
                    start = 0
                if start > seg["end"]:
                    break
                words.append(word_segments[idx]["word"])
                idx += 1
            # spacer = "" if language == "zh" else " "
            spacer = " "
            seg["text"] = spacer.join(words)
        # filter out empty segments
        result["segments"] = [seg for seg in result["segments"] if seg["text"]]

        message = [
            (
                seg["speaker"],
                seg["text"],
                "{:.2f}".format(seg["start"]),
                "{:.2f}".format(seg["end"]),
            )
            for seg in result["segments"]
        ]
        logger.info(f"diarized transcript: {message}")

        return result

    def _transcribe_api(
        self,
        audio_bytes,
        platform="web",
        prompt="",
        language="auto",
        suppress_tokens=[-1],
        diarization=False,
        speaker_audio_samples={},
    ):
        files = {"audio_file": ("", audio_bytes)}
        for id, speaker_audio_sample in speaker_audio_samples.items():
            files[f"speaker_audio_sample_{id}"] = ("", speaker_audio_sample)
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
            logger.info(f"Sent request to whisperX server: {len(audio_bytes)} bytes")
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
