import io
import os
import types
import json

import requests
import ffmpeg
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
                transcript.append((seg.get("speaker", ""), seg["text"].strip(), seg["start"], seg["end"]))
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
        import whisperx

        logger.info(f"Received {len(audio_bytes)} bytes of audio data. Language: {language}")

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
        gap = 4  # seconds between audio slices
        audio = get_audio(audio_bytes, verbose=True)
        audio_end = len(audio) / 16000 + gap / 2
        speaker_mid = {}
        if diarization:
            for id, speaker_audio_sample in speaker_audio_samples.items():
                speaker_audio = get_audio(speaker_audio_sample)
                audio = np.concatenate([audio, np.zeros(16000 * gap), speaker_audio])
                speaker_mid[id] = (len(audio) - len(speaker_audio) / 2) / 16000
        
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, None)
        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)
        language = result["language"]

        # convert traditional chinese to simplified chinese
        if language == "zh":
            for seg in result["segments"]:
                seg["text"] = self.chinese_t2s.convert(seg["text"])

        # diarization
        speaker_id = {}
        if diarization and language in ALIGN_MODEL_LANGUAGE_CODE:
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
            # figure out speaker id map
            for id, mid in speaker_mid.items():
                for seg in result["segments"]:
                    if seg["start"] < mid < seg["end"]:
                        speaker_id[seg["speaker"]] = id
                        break

        # truncate results
        transcript = {"segments": [], "language": language}
        first_speaker_mid = min(speaker_mid.values(), default=float('inf'))
        for seg in result["segments"]:
            seg_start = seg["start"]
            seg_end = seg["end"]
            if "words" in seg and seg["words"]:
                seg_start = seg["words"][0]["start"]
                seg_end = seg["words"][-1]["end"]
            if seg_start < audio_end and seg_end < first_speaker_mid:
                _seg = {
                    "text": seg["text"].strip(),
                    "start": seg_start,
                    "end": seg_end,
                }
                if "speaker" in seg:
                    _seg["speaker"] = speaker_id.get(seg["speaker"], seg["speaker"])
                transcript["segments"].append(_seg)

        # console debug output
        text = " ".join([seg["text"].strip() for seg in transcript["segments"]])
        logger.info(f"Transcript: {text}")

        return transcript

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
        print(f"\033[35mfiles: {[(key, len(value[1])) for key, value in files.items()]}\033[0m")
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

    def get_duration(self, audio_bytes: bytes):
        import torch
        import torchaudio

        with tempfile.NamedTemporaryFile(suffix=".wav") as f:
            f.write(audio_bytes)
            f.flush()
            probe = ffmpeg.probe(f.name)
            return float(probe["format"]["duration"])
