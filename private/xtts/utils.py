import os
import time
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional


load_dotenv()
MAX_REF_LENGTH = int(os.getenv("MAX_REF_LENGTH", "30"))
GPT_COND_LEN = int(os.getenv("GPT_COND_LEN", "6"))
GPT_COND_CHUNK_LEN = int(os.getenv("GPT_COND_CHUNK_LEN", "6"))
SOUND_NORM_REFS = os.getenv("SOUND_NORM_REFS", "false") == "true"
LOAD_SR = int(os.getenv("LOAD_SR")) if os.getenv("LOAD_SR") else None
STREAM_CHUNK_SIZE = int(os.getenv("STREAM_CHUNK_SIZE", "20"))
OVERLAP_WAV_LEN = int(os.getenv("OVERLAP_WAV_LEN", "1024"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.75"))
LENGTH_PENALTY = int(os.getenv("LENGTH_PENALTY", "1"))
REPETITION_PENALTY = float(os.getenv("REPETITION_PENALTY", "10"))
TOP_K = int(os.getenv("TOP_K", "50"))
TOP_P = float(os.getenv("TOP_P", "0.85"))
DO_SAMPLE = os.getenv("DO_SAMPLE", "true") == "true"
SPEED = float(os.getenv("SPEED", "1.0"))
ENABLE_TEXT_SPLITTING = os.getenv("ENABLE_TEXT_SPLITTING", "false") == "true"
STREAM = os.getenv("STREAM", "true") == "true"


class Data(BaseModel):
    prompt: str
    voice_id: str
    language: Optional[str] = None
    max_ref_length: int = MAX_REF_LENGTH
    gpt_cond_len: int = GPT_COND_LEN
    gpt_cond_chunk_len: int = GPT_COND_CHUNK_LEN
    sound_norm_refs: bool = SOUND_NORM_REFS
    load_sr: Optional[int] = LOAD_SR
    stream_chunk_size: int = STREAM_CHUNK_SIZE
    overlap_wav_len: int = OVERLAP_WAV_LEN
    temperature: float = TEMPERATURE
    length_penalty: int = LENGTH_PENALTY
    repetition_penalty: float = REPETITION_PENALTY
    top_k: int = TOP_K
    top_p: float = TOP_P
    do_sample: bool = DO_SAMPLE
    speed: float = SPEED
    enable_text_splitting: bool = ENABLE_TEXT_SPLITTING
    stream: bool = STREAM


def log(message: str):
    print(f"\033[36m[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\033[0m")
