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

# MODEL = os.getenv("MODEL", "base")
MODEL = "large-v2"
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
        speaker_audio_samples={},
    ):
        log(f"Received {len(audio_bytes)} bytes of audio data. Language: {language}")

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
                log(f"Wav Shape: {wav.shape}")
                log(f"Audio length: {len(audio) / 16000:.2f} s")
                log(f"Received {reader.get_src_stream_info(0)}")
            return audio
        
        # prepare audio
        audio = get_audio(audio_bytes, verbose=True)
        
        # transcribe
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, None)
        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        _ = time.perf_counter()
        result = self.model.transcribe(audio, batch_size=1, language=language)
        log(f"transcribe time: {(time.perf_counter() - _) * 1000:.0f} ms, model: {MODEL}")
        if not result["segments"]:
            return result
        log(f"transcribe result: {[(seg['text'], '{:.2f}'.format(seg['start']), '{:.2f}'.format(seg['end'])) for seg in result['segments']]}")

        # convert traditional chinese to simplified chinese
        if result["language"] == "zh":
            for seg in result["segments"]:
                seg["text"] = self.chinese_t2s.convert(seg["text"])

        # console debug output
        text = " ".join([seg["text"].strip() for seg in result["segments"]])
        log(f"Transcript: {text}")

        # diarization
        if diarization and speaker_audio_samples:
            speaker_audios = {id: get_audio(ab) for id, ab in speaker_audio_samples.items()}
            result = self.diarize(result, audio, speaker_audios)

        return result

    def diarize(self, result, audio: np.ndarray, speaker_audios: dict[str, np.ndarray]):
        gap = 2  # seconds between audio slices
        audio_end = len(audio) / 16000 + gap / 2
        speaker_mid = {}
        ext_audio = audio.copy()
        for id, speaker_audio in speaker_audios.items():
            ext_audio = np.concatenate([ext_audio, np.zeros(16000 * gap, np.float32), speaker_audio])
            speaker_mid[id] = (len(ext_audio) - len(speaker_audio) / 2) / 16000
        log(f"Full audio length: {len(ext_audio) / 16000:.2f} s")
        # save audio for debug
        torchaudio.save(f"/home/yiguo/Downloads/{time.time():.0f}.wav", torch.from_numpy(ext_audio[None, :]), 16000)
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
        log("aligned result:")
        for seg in word_segments:
            log(f"  {seg}")
        # diarize
        num_speakers = len(speaker_audios)
        diarize_segments = self.diarize_model(ext_audio, min_speakers=0, max_speakers=num_speakers)
        log(f"diarize result:\n{diarize_segments}\nnum_speakers: {num_speakers}")
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
        log(f"speaker_id: {speaker_id}")
        # align results with mapped speaker id
        result = {
            "segments": [
                {
                    "start": row["start"],
                    "end": row["end"],
                    "speaker": speaker_id[row["speaker"]],
                }
                for _, row in diarize_segments.iterrows() if row["end"] < audio_end
            ],
            "language": language
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

        log(f"audio_end: {audio_end:.2f}")
        for id, mid in speaker_mid.items():
            log(f"speaker {id}, mid: {mid:.2f}")

        log(f"diarized transcript: {[(seg.get('speaker'), seg['text'], '{:.2f}'.format(seg['start']), '{:.2f}'.format(seg['end'])) for seg in result['segments']]}")

        return result