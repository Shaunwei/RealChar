from dotenv import load_dotenv

load_dotenv()
import os
import requests
import json
from time import perf_counter


api_key = os.getenv("API_KEY", "")
api_url = os.getenv("API_URL", "")
audio_file = os.getenv("AUDIO_FILE", "")
platform = os.getenv("PLATFORM", "")

with open(audio_file, "rb") as f:
    audio_bytes = f.read()


def test(verbose=True):
    files = {"audio_file": ("", audio_bytes)}
    metadata = {
        "api_key": api_key,
        "platform": platform,
        "initial_prompt": "",
        "language": "en-US",
        "suppress_tokens": [-1],
        "diarization": True,
    }
    data = {"metadata": json.dumps(metadata)}
    start = perf_counter()
    if verbose:
        print(f"Sent {len(audio_bytes)} bytes of audio data.")
    response = requests.post(api_url, data=data, files=files)

    if response.status_code == 200:
        data = response.json()
        text = " ".join([seg["text"] for seg in data["segments"]])
        if verbose:
            print(f"Transcription: {text}")
    else:
        if verbose:
            print(f"Error: {response.status_code}")

    return perf_counter() - start


if __name__ == "__main__":
    elapsed = test()
    print(f"Request took {elapsed * 1000:.0f} ms")
