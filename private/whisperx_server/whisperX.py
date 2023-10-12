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
        gap = 4  # seconds between audio slices
        audio = get_audio(audio_bytes, verbose=True)
        audio_end = len(audio) / 16000 + gap / 2
        speaker_mid = {}
        if diarization:
            for id, speaker_audio_sample in speaker_audio_samples.items():
                speaker_audio = get_audio(speaker_audio_sample)
                audio = np.concatenate([audio, np.zeros(16000 * gap, np.float32), speaker_audio])
                speaker_mid[id] = (len(audio) - len(speaker_audio) / 2) / 16000
        log(f"Full audio length: {len(audio) / 16000:.2f} s")
        # save audio for debug
        torchaudio.save(f"/home/yiguo/Downloads/{time.time():.0f}.wav", torch.from_numpy(audio[None, :]), 16000)
        
        # transcribe
        language = WHISPER_LANGUAGE_CODE_MAPPING.get(language, None)
        self.model.options = self.model.options._replace(
            initial_prompt=prompt, suppress_tokens=suppress_tokens
        )
        result = self.model.transcribe(audio, batch_size=1, language=language)
        if not result["segments"]:
            return result
        language = result["language"]
        log(f"transcribe result: {[(seg['text'], '{:.2f}'.format(seg['start']), '{:.2f}'.format(seg['end'])) for seg in result['segments']]}")

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
            num_speakers = len(speaker_audio_samples)
            diarize_segments = self.diarize_model(audio, min_speakers=0, max_speakers=num_speakers)
            log(f"diarize result:\n{diarize_segments}")
            result = whisperx.assign_word_speakers(diarize_segments, result)
            log(f"aligned result: {[(seg['text'], '{:.2f}'.format(seg['start']), '{:.2f}'.format(seg['end'])) for seg in result['segments']]}")
            # figure out speaker id map
            for id, mid in speaker_mid.items():
                for seg in result["segments"]:
                    if seg["start"] < mid < seg["end"]:
                        speaker_id[seg["speaker"]] = id
                        break
        log(f"speaker id map: {speaker_id}")

        # truncate results and map speaker id
        transcript = {"segments": [], "language": language}
        for seg in result["segments"]:
            seg_text = []
            seg_start = seg["start"]
            seg_end = seg["end"]
            if "words" in seg and seg["words"]:
                start_set = False
                for word_seg in seg["words"]:
                    if "start" in word_seg and "end" in word_seg:
                        if word_seg["start"] > audio_end:
                            break
                        if not start_set:
                            seg_start = word_seg["start"]
                            start_set = True
                        if word_seg["end"] > word_seg["start"] + gap / 2:
                            seg_end = min(audio_end, word_seg["start"] + 0.5)
                        else:
                            seg_end = word_seg["end"]
                        seg_text.append(word_seg["word"])
            if seg_text:
                _seg = {
                    "text": "".join(seg_text) if language == "zh" else " ".join(seg_text),
                    "start": seg_start,
                    "end": seg_end,
                }
                if "speaker" in seg:
                    if seg["speaker"] not in speaker_id:
                        speaker_id[seg["speaker"]] = str(len(speaker_id))
                    _seg["speaker"] = speaker_id[seg["speaker"]]
                transcript["segments"].append(_seg)

        log(f"truncated aligned result: {[(seg.get('speaker'), seg['text'], '{:.2f}'.format(seg['start']), '{:.2f}'.format(seg['end'])) for seg in result['segments']]}")
        log("word segments:")
        if "word_segments" in result:
            for seg in result["word_segments"]:
                print(seg)
        log(f"audio_end: {audio_end:.2f}")
        for id, mid in speaker_mid.items():
            log(f"speaker {id}, mid: {mid:.2f}")
        log(f"transcript: {transcript['segments']}")

        # console debug output
        text = " ".join([seg["text"].strip() for seg in transcript["segments"]])
        log(f"Transcript: {text}")

        return transcript
