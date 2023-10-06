import os
import io
import json
import typing as t
from time import perf_counter, time

import bentoml
from bentoml.io import File, JSON, Multipart, Text
from bentoml._internal.runner.runner import RunnerMethod
from whisperX import WhisperX
from monitor import benchmark


class WhisperX_Runner(bentoml.Runnable):
    SUPPORTED_RESOURCES = ("cpu", "nvidia.com/gpu")
    SUPPORTS_CPU_MULTI_THREADING = False

    def __init__(self):
        self.latency = []
        self.timestamp = []
        self.whisperx = WhisperX()
        self.capacity = benchmark(self.whisperx)

    @bentoml.Runnable.method(batchable=False)
    def transcribe(self, *args, **kwargs):
        start = perf_counter()
        result = self.whisperx.transcribe(*args, **kwargs)
        elapsed = perf_counter() - start
        now = time()
        self.latency.append(elapsed)
        self.timestamp.append(now)
        while self.timestamp[0] < now - 86400:
            self.latency.pop(0)
            self.timestamp.pop(0)
        return result
    
    @bentoml.Runnable.method(batchable=False)
    def stats(self, dummy: str):
        latency = t.cast(list[float], sorted(self.latency, reverse=True))
        info = {}
        info["num_transcriptions_24h"] = len(latency)
        if latency:
            info["peak_latency_1percent"] = latency[len(latency) // 100]
            info["peak_latency_5percent"] = latency[len(latency) // 20]
            info["average_latency"] = sum(latency) / len(latency)
            info["average_transcriptions_per_second"] = len(latency) / sum(latency)
            info["device_peak_capacity"] = self.capacity
        info["safe_total_transcriptions_per_second"] = self.capacity * 0.8
        return info


class RunnerImpl(bentoml.Runner):
    transcribe: RunnerMethod
    stats: RunnerMethod


API_KEY = os.getenv("API_KEY", "")

runner = t.cast(RunnerImpl, bentoml.Runner(WhisperX_Runner, name="whisperx_runner"))

svc = bentoml.Service("whisperx_server", runners=[runner])


@svc.api(input=Text(), output=JSON())  # type: ignore
async def stats(dummy: str):
    info = await runner.stats.async_run(dummy)
    return info


@svc.api(input=Multipart(audio_file=File(), metadata=Text()), output=JSON())  # type: ignore
async def transcribe(audio_file: io.BytesIO, metadata: str):
    audio_bytes = audio_file.read()
    metadict = t.cast(dict, json.loads(metadata))
    api_key = metadict.get("api_key", "")
    platform = metadict.get("platform", "web")
    initial_prompt = metadict.get("initial_prompt", "")
    language = metadict.get("language", "en-US")
    suppress_tokens = metadict.get("suppress_tokens", [-1])
    diarization = metadict.get("diarization", False)
    if api_key != API_KEY:
        raise bentoml.exceptions.InvalidArgument("Invalid API key.")
    try:
        result = await runner.transcribe.async_run(
            audio_bytes, platform, initial_prompt, language, suppress_tokens, diarization
        )
        return result
    except Exception as e:
        raise bentoml.exceptions.InternalServerError(str(e))
