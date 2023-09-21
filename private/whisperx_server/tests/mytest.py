import requests
import json
from time import perf_counter


url = "http://localhost:8002/transcribe"
# url = "http://localhost:3000/transcribe"
# url = "http://whisperx-server-0-org-realchar--aws-us-west-1.mt1.bentoml.ai/transcribe"

# audio_file = "../reference.mp3"
audio_file = "/home/yiguo/Downloads/addf8-mulaw-GW.wav"
with open(audio_file, "rb") as f:
    audio_bytes = f.read()


def test(verbose=True):
    files = {"audio_file": ("audio_file", audio_bytes)}
    metadata = {
        "api_key": "YOUR_API_KEY_12345",
        "platform": "twilio",
        "initial_prompt": "",
        "language": "en-US",
        "suppress_tokens": [-1],
        "diarization": False,
    }
    data = {"metadata": json.dumps(metadata)}
    start = perf_counter()
    if verbose:
        print(f"Sent {len(audio_bytes)} bytes of audio data.")
    response = requests.post(url, data=data, files=files)

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
