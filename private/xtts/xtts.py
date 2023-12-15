import os
import io
import time
import torch
import torchaudio
import re
import wave

import langid
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts
from TTS.utils.generic_utils import get_user_data_dir
from TTS.utils.manage import ModelManager

XTTS_LANGUAGE_CODE_MAPPING = {
    "en-US": "en",
    "es-ES": "es",
    "fr-FR": "fr",
    "de-DE": "de",
    "it-IT": "it",
    "pt-PT": "pt",
    "pl-PL": "pl",
    "zh-CN": "zh-cn",
    "ja-JP": "ja",
}

MAX_REF_LENGTH = os.getenv("MAX_REF_LENGTH", "30")
GPT_COND_LEN = os.getenv("GPT_COND_LEN", "6")
GPT_COND_CHUNK_LEN = os.getenv("GPT_COND_CHUNK_LEN", "6")
SOUND_NORM_REFS = os.getenv("SOUND_NORM_REFS", "false")
LOAD_SR = os.getenv("LOAD_SR")
STREAM_CHUNK_SIZE = os.getenv("STREAM_CHUNK_SIZE", "20")
OVERLAP_WAV_LEN = os.getenv("OVERLAP_WAV_LEN", "1024")
TEMPERATURE = os.getenv("TEMPERATURE", "0.75")
LENGTH_PENALTY = os.getenv("LENGTH_PENALTY", "1")
REPETITION_PENALTY = os.getenv("REPETITION_PENALTY", "10")
TOP_K = os.getenv("TOP_K", "50")
TOP_P = os.getenv("TOP_P", "0.85")
DO_SAMPLE = os.getenv("DO_SAMPLE", "true")
SPEED = os.getenv("SPEED", "1.0")
ENABLE_TEXT_SPLITTING = os.getenv("ENABLE_TEXT_SPLITTING", "false")
STREAM = os.getenv("STREAM", "true")

# By using XTTS you agree to CPML license https://coqui.ai/cpml
os.environ["COQUI_TOS_AGREED"] = "1"


def log(message: str):
    print(f"\033[36m[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\033[0m")
    

def get_sample_rate_wav(file_path):
    with wave.open(file_path, 'r') as wav_file:
        sample_rate = wav_file.getframerate()
        return sample_rate


class XTTS:
    def __init__(self):
        model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        log(f"Downloading model: {model_name}")
        ModelManager().download_model(model_name)
        checkpoint_dir = os.path.join(get_user_data_dir("tts"), model_name.replace("/", "--"))
        log(f"Downloaded model: {model_name}")
        self.config = XttsConfig()
        self.config.load_json(os.path.join(checkpoint_dir, "config.json"))
        self.model = Xtts.init_from_config(self.config)
        self.model.load_checkpoint(
            self.config,
            checkpoint_dir=checkpoint_dir,
            eval=True,
            use_deepspeed=True,
        )
        self.model.cuda()
        self.supported_languages = self.config.languages
        log(f"Loaded model: {model_name}")
        log(f"max_ref_length: {MAX_REF_LENGTH}")
        log(f"gpt_cond_len: {GPT_COND_LEN}")
        log(f"gpt_cond_chunk_len: {GPT_COND_CHUNK_LEN}")
        log(f"sound_norm_refs: {SOUND_NORM_REFS}")
        log(f"load_sr: {LOAD_SR}")
        log(f"stream_chunk_size: {STREAM_CHUNK_SIZE}")
        log(f"overlap_wav_len: {OVERLAP_WAV_LEN}")
        log(f"temperature: {TEMPERATURE}")
        log(f"length_penalty: {LENGTH_PENALTY}")
        log(f"repetition_penalty: {REPETITION_PENALTY}")
        log(f"top_k: {TOP_K}")
        log(f"top_p: {TOP_P}")
        log(f"do_sample: {DO_SAMPLE}")
        log(f"speed: {SPEED}")
        log(f"enable_text_splitting: {ENABLE_TEXT_SPLITTING}")
        log(f"stream: {STREAM}")

    def predict(self, prompt, language, voice_id):
        log(f"Received prompt: {prompt}, language: {language}, voice_id: {voice_id}")

        # detect language
        language = XTTS_LANGUAGE_CODE_MAPPING.get(language)
        try:
            language_predicted = langid.classify(prompt)[0].strip()
            # tts expects chinese as zh-cn
            if language_predicted == "zh":
                # we use zh-cn
                language_predicted = "zh-cn"
            log(f"Detected language:{language_predicted}")
            language = language_predicted
        except Exception as e:
            log(f"Language detection error: {e}")

        if language not in self.supported_languages:
            language = "en"
            log(f"Language not supported, switch to default language: {language}")

        speaker_wav = f"voices/{voice_id}.wav"
        if not os.path.exists(speaker_wav):
            log(f"Speaker wav file not found: {speaker_wav}, setting to default speaker")
            speaker_wav = "voices/default.wav"

        # # Filtering for microphone input, as it has BG noise, maybe silence in beginning and end
        # # This is fast filtering not perfect

        # # Apply all on demand
        # lowpassfilter = denoise = trim = loudness = True

        # if lowpassfilter:
        #     lowpass_highpass = "lowpass=8000,highpass=75,"
        # else:
        #     lowpass_highpass = ""

        # if trim:
        #     # better to remove silence in beginning and end for microphone
        #     trim_silence = (
        #         "areverse,silenceremove=start_periods=1:start_silence=0:"
        #         "start_threshold=0.02,areverse,silenceremove=start_periods=1:"
        #         "start_silence=0:start_threshold=0.02,"
        #     )
        # else:
        #     trim_silence = ""

        # if voice_cleanup:
        #     try:
        #         out_filename = (
        #             speaker_wav + str(uuid.uuid4()) + ".wav"
        #         )  # ffmpeg to know output format

        #         # we will use newer ffmpeg as that has afftn denoise filter
        #         shell_command = (
        #             f"./ffmpeg -y -i {speaker_wav} "
        #             f"-af {lowpass_highpass}{trim_silence} {out_filename}"
        #         ).split(" ")

        #         command_result = subprocess.run(
        #             [item for item in shell_command], capture_output=False, text=True, check=True
        #         )
        #         speaker_wav = out_filename
        #         log("Filtered microphone input")
        #     except subprocess.CalledProcessError:
        #         # There was an error - command exited with non-zero code
        #         log("Error: failed filtering, use original microphone input")
        # else:
        #     speaker_wav = speaker_wav

        if len(prompt) < 2:
            log("Prompt length < 2. Please give a longer prompt text")
            return

        metrics_text = ""

        t_latent = time.time()

        # load sample rate from env and from source
        if LOAD_SR:
            load_sr = int(LOAD_SR)
        else:
            try:
                # this is 1000X faster than torchaudio.load
                load_sr = get_sample_rate_wav(speaker_wav)
            except Exception as e:
                log(f"Can not load speaker wav file: {e}")
                return

        try:
            gpt_cond_latent, speaker_embedding = self.model.get_conditioning_latents(
                audio_path=speaker_wav,
                max_ref_length=int(MAX_REF_LENGTH),
                gpt_cond_len=int(GPT_COND_LEN),
                gpt_cond_chunk_len=int(GPT_COND_CHUNK_LEN),
                sound_norm_refs=(SOUND_NORM_REFS == "true"),
                load_sr=load_sr,
            )
        except Exception as e:
            log(f"Speaker encoding error: {e}")
            return

        latent_calculation_time = time.time() - t_latent
        metrics_text = f"Embedding calculation time: {latent_calculation_time:.2f} seconds\n"

        # temporary comma fix
        prompt = re.sub("([^\x00-\x7F]|\w)(\.|\。|\?)", r"\1 \2\2", prompt)

        wav_chunks = []

        t_inference = time.time()

        if STREAM == "true":
            chunks = self.model.inference_stream(
                prompt,
                language,
                gpt_cond_latent,
                speaker_embedding,
                stream_chunk_size=int(STREAM_CHUNK_SIZE),
                overlap_wav_len=int(OVERLAP_WAV_LEN),
                temperature=float(TEMPERATURE),
                length_penalty=float(LENGTH_PENALTY),
                repetition_penalty=float(REPETITION_PENALTY),
                top_k=int(TOP_K),
                top_p=float(TOP_P),
                do_sample=(DO_SAMPLE == "true"),
                speed=float(SPEED),
                enable_text_splitting=(ENABLE_TEXT_SPLITTING == "true"),
            )
        else:
            result = self.model.inference(
                prompt,
                language,
                gpt_cond_latent,
                speaker_embedding,
                temperature=float(TEMPERATURE),
                length_penalty=float(LENGTH_PENALTY),
                repetition_penalty=float(REPETITION_PENALTY),
                top_k=int(TOP_K),
                top_p=float(TOP_P),
                do_sample=(DO_SAMPLE == "true"),
                speed=float(SPEED),
                enable_text_splitting=(ENABLE_TEXT_SPLITTING == "true"),
            )
            chunks = [torch.Tensor(result["wav"])]

        first_chunk = True
        for i, chunk in enumerate(chunks):
            if first_chunk:
                first_chunk_time = time.time() - t_inference
                metrics_text += (
                    f"Latency to first audio chunk: {round(first_chunk_time*1000)} milliseconds\n"
                )
                first_chunk = False
                log(metrics_text)

            wav_chunks.append(chunk)
            log(f"Generated chunk {i} of audio length {chunk.shape[0]}")

            audio_file = io.BytesIO()
            torchaudio.save(  # type: ignore
                audio_file, chunk.detach().cpu().unsqueeze(0), 24000, format="mp3"
            )

            yield audio_file.getvalue()
