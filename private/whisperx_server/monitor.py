from time import perf_counter
from whisperX import WhisperX


def benchmark(whisperx: WhisperX):
    """Returns the number of transcriptions per second at capacity, conservatively."""
    with open("reference.mp3", "rb") as f:
        audio_bytes = f.read()

    whisperx.transcribe(audio_bytes)  # warmup

    start = perf_counter()
    whisperx.transcribe(audio_bytes)  # get estimate
    estimate = perf_counter() - start

    max_duration = 100  # seconds
    # max_num_runs = 100  # runs
    max_num_runs = 1  # runs
    num_runs = min(int(max_duration / estimate) + 1, max_num_runs)

    print("Benchmarking...")
    start = perf_counter()
    for _ in range(num_runs):
        whisperx.transcribe(audio_bytes)
    elapsed = perf_counter() - start
    capacity = num_runs / elapsed

    return capacity