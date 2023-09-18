import requests
from time import perf_counter


url = "http://localhost:8002/transcribe"
with open("../reference.mp3", "rb") as f:
    audio_bytes = f.read()


def test(verbose=True):
    files = {"audio_file": ("audio_file", audio_bytes)}
    data = {
        "api_key": "YOUR_API_KEY",
        "initial_prompt": "",
        "language": "en-US",
        "suppress_tokens": [-1],
        "diarization": False,
    }
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
