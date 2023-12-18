import io
import langid
import os
import time
import torch
import torchaudio
import wave

from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts
from TTS.utils.generic_utils import get_user_data_dir
from TTS.utils.manage import ModelManager

from utils import Data, log


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

# By using XTTS you agree to CPML license https://coqui.ai/cpml
os.environ["COQUI_TOS_AGREED"] = "1"


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

    def predict(self, data: Data):
        print(f"MAX_REF_LENGTH: {data.max_ref_length}")
        print(f"GPT_COND_LEN: {data.gpt_cond_len}")
        print(f"GPT_COND_CHUNK_LEN: {data.gpt_cond_chunk_len}")
        print(f"SOUND_NORM_REFS: {data.sound_norm_refs}")
        print(f"LOAD_SR: {data.load_sr}")
        print(f"STREAM_CHUNK_SIZE: {data.stream_chunk_size}")
        print(f"OVERLAP_WAV_LEN: {data.overlap_wav_len}")
        print(f"TEMPERATURE: {data.temperature}")
        print(f"LENGTH_PENALTY: {data.length_penalty}")
        print(f"REPETITION_PENALTY: {data.repetition_penalty}")
        print(f"TOP_K: {data.top_k}")
        print(f"TOP_P: {data.top_p}")
        print(f"DO_SAMPLE: {data.do_sample}")
        print(f"SPEED: {data.speed}")
        print(f"ENABLE_TEXT_SPLITTING: {data.enable_text_splitting}")
        print(f"STREAM: {data.stream}")

        prompt = data.prompt
        language = data.language
        voice_id = data.voice_id
        log(f"Received prompt: {repr(prompt)}, language: {language}, voice_id: {voice_id}")
        # print prompt with showing non-ascii characters
        log(f"Unicode Escaped Prompt: {repr(prompt.encode('unicode_escape').decode('utf-8'))}")

        # detect language
        language = XTTS_LANGUAGE_CODE_MAPPING.get(language)
        if not language:
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
        if data.load_sr:
            load_sr = int(data.load_sr)
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
                max_ref_length=data.max_ref_length,
                gpt_cond_len=data.gpt_cond_len,
                gpt_cond_chunk_len=data.gpt_cond_chunk_len,
                sound_norm_refs=data.sound_norm_refs,
                load_sr=load_sr,
            )
        except Exception as e:
            log(f"Speaker encoding error: {e}")
            return

        latent_calculation_time = time.time() - t_latent
        metrics_text = f"Embedding calculation time: {latent_calculation_time:.2f} seconds\n"

        wav_chunks = []

        t_inference = time.time()

        if data.stream:
            chunks = self.model.inference_stream(
                prompt,
                language,
                gpt_cond_latent,
                speaker_embedding,
                stream_chunk_size=data.stream_chunk_size,
                overlap_wav_len=data.overlap_wav_len,
                temperature=data.temperature,
                length_penalty=data.length_penalty,
                repetition_penalty=data.repetition_penalty,
                top_k=data.top_k,
                top_p=data.top_p,
                do_sample=data.do_sample,
                speed=data.speed,
                enable_text_splitting=data.enable_text_splitting,
            )
        else:
            result = self.model.inference(
                prompt,
                language,
                gpt_cond_latent,
                speaker_embedding,
                temperature=data.temperature,
                length_penalty=data.length_penalty,
                repetition_penalty=data.repetition_penalty,
                top_k=data.top_k,
                top_p=data.top_p,
                do_sample=data.do_sample,
                speed=data.speed,
                enable_text_splitting=data.enable_text_splitting,
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
