import torch, torchaudio
from time import perf_counter
from whisperX import WhisperX


def benchmark(whisperx: WhisperX):
    """Returns the number of transcriptions per second at capacity, conservatively."""
    with open("reference.mp3", "rb") as f:
        audio_bytes = f.read()

    whisperx.transcribe(audio_bytes)  # warmup

    print("Benchmarking...")
    num_runs = 100
    start = perf_counter()
    for _ in range(num_runs):
        whisperx.transcribe(audio_bytes)
    elapsed = perf_counter() - start
    return num_runs / elapsed