import os
import json
from dotenv import load_dotenv
from time import perf_counter, time
from typing import cast
from fastapi import FastAPI, HTTPException, Form, UploadFile
from fastapi.param_functions import File

load_dotenv()
from whisperX import WhisperX
from monitor import benchmark

API_KEY = os.getenv("API_KEY", "")

app = FastAPI()

whisperx = WhisperX()

capacity = benchmark(whisperx)

latency, timestamp = [], []


@app.get("/stats")
async def stats():
    _latency = cast(list[float], sorted(latency, reverse=True))
    stats = {}
    stats["num_transcriptions_24h"] = len(_latency)
    if _latency:
        stats["peak_latency_1percent"] = _latency[len(_latency) // 100]
        stats["peak_latency_5percent"] = _latency[len(_latency) // 20]
        stats["average_latency"] = sum(_latency) / len(_latency)
        stats["average_transcriptions_per_second"] = len(_latency) / sum(_latency)
        stats["device_peak_capacity"] = capacity
    stats["safe_total_transcriptions_per_second"] = (capacity * 0.8,)
    return stats


@app.post("/transcribe")
async def transcribe(audio_file: UploadFile = File(...), metadata: str = Form(default="")):
    metadict = cast(dict, json.loads(metadata))
    api_key = metadict.get("api_key", "")
    platform = metadict.get("platform", "web")
    initial_prompt = metadict.get("initial_prompt", "")
    language = metadict.get("language", "en-US")
    suppress_tokens = metadict.get("suppress_tokens", [-1])
    diarization = metadict.get("diarization", False)
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key.")
    try:
        start = perf_counter()
        audio_bytes = await audio_file.read()
        result = whisperx.transcribe(
            audio_bytes, platform, initial_prompt, language, suppress_tokens, diarization
        )
        elapsed = perf_counter() - start
        now = time()
        latency.append(elapsed)
        timestamp.append(now)
        while timestamp[0] < now - 86400:
            latency.pop(0)
            timestamp.pop(0)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
