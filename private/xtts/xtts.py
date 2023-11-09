import os
import io
import time
import torchaudio
import re

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


def log(message: str):
    print(f"\033[36m[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\033[0m")


class XTTS:
    def __init__(self):
        model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        model_path = os.path.join("models", model_name.replace("/", "--"))
        if not os.path.exists(model_path):
            log(f"Downloading model: {model_name}")
            ModelManager().download_model(model_name)
            model_path = os.path.join(get_user_data_dir("tts"), model_name.replace("/", "--"))
            log(f"Downloaded model: {model_name}")
        self.config = XttsConfig()
        self.config.load_json(os.path.join(model_path, "config.json"))
        self.model = Xtts.init_from_config(self.config)
        self.model.load_checkpoint(
            self.config,
            checkpoint_path=os.path.join(model_path, "model.pth"),
            vocab_path=os.path.join(model_path, "vocab.json"),
            eval=True,
            use_deepspeed=True,
        )
        self.model.cuda()
        self.supported_languages = self.config.languages
        log(f"Loaded model: {model_name}")

    def predict(self, prompt, language, voice_id):
        log(f"Received prompt: {prompt}, language: {language}, voice_id: {voice_id}")

        # After text character length 15 trigger language detection
        if len(prompt) > 15:
            log(f"Prompt length > 15. Detecting language for prompt: {prompt}")
            language_predicted = langid.classify(prompt)[0].strip()
            # tts expects chinese as zh-cn
            if language_predicted == "zh":
                # we use zh-cn
                language_predicted = "zh-cn"
            log(f"Detected language:{language_predicted}")
            language = language_predicted
        else:
            language = XTTS_LANGUAGE_CODE_MAPPING.get(language)

        if language not in self.supported_languages:
            language = "en"
            log(f"Language not supported, changed to default language: {language}")

        speaker_wav = f"voices/{voice_id}.wav"
        if not os.path.exists(speaker_wav):
            log(f"Speaker wav file not found: {speaker_wav}, setting to default speaker")
            speaker_wav = "voices/female.wav"

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

        try:
            gpt_cond_latent, speaker_embedding = self.model.get_conditioning_latents(
                audio_path=speaker_wav, gpt_cond_len=30, max_ref_length=30
            )
        except Exception as e:
            log(f"Speaker encoding error: {e}")
            return

        latent_calculation_time = time.time() - t_latent
        metrics_text = f"Embedding calculation time: {latent_calculation_time:.2f} seconds\n"

        # temporary comma fix
        prompt= re.sub("([^\x00-\x7F]|\w)(\.|\。|\?)",r"\1 \2\2",prompt)

        wav_chunks = []

        t_inference = time.time()

        chunks = self.model.inference_stream(
            prompt,
            language,
            gpt_cond_latent,
            speaker_embedding,
            #repetition_penalty=5.0,
            temperature=0.85,
        )

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
