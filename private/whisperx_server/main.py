import os
import json
from dotenv import load_dotenv
from time import perf_counter, time
from typing import cast
from fastapi import FastAPI, HTTPException, UploadFile, Request, Form

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
async def transcribe(request: Request, metadata: str = Form(...)):
    start = perf_counter()

    # parse metadata
    metadata_dict = cast(dict, json.loads(metadata))
    api_key = metadata_dict.get("api_key", "")
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key.")
    platform = metadata_dict.get("platform", "web")
    initial_prompt = metadata_dict.get("initial_prompt", "")
    language = metadata_dict.get("language", "en-US")
    suppress_tokens = metadata_dict.get("suppress_tokens", [-1])
    diarization = metadata_dict.get("diarization", False)

    # parse audio
    data = await request.form()
    audio_bytes = await cast(UploadFile, data.get("audio_file")).read()
    speaker_audio_samples = {
        key.split("speaker_audio_sample_")[1]: await cast(UploadFile, file).read()
        for key, file in data.items()
        if key.startswith("speaker_audio_sample_")
    }
    for key, value in speaker_audio_samples.items():
        print(f"\033[36mspeaker_audio_sample_{key}: {len(value)}\033[0m")

    # transcribe
    result = whisperx.transcribe(
        audio_bytes, platform, initial_prompt, language, suppress_tokens, diarization, speaker_audio_samples
    )

    elapsed = perf_counter() - start
    now = time()
    latency.append(elapsed)
    timestamp.append(now)
    while timestamp[0] < now - 86400:
        latency.pop(0)
        timestamp.pop(0)
    return result
