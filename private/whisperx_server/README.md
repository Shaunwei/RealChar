# whisperX-server
Self hosted whisperX endpoint.

## Server Setup

1. Create a virtural environment

    ```bash
    conda create -n whisperx-server python=3.10 -y && conda activate whisperx-server
    ```

1. Install ffmpeg

    ```bash
    conda install ffmpeg -c pytorch
    ```

    or

    ```bash
    sudo apt update && sudo apt install ffmpeg
    ```

1. Install whisperX

    ```bash
    pip install git+https://github.com/m-bain/whisperx.git
    ```

1. Install FastAPI

    ```bash
    pip install "fastapi[all]"
    ```

1.  Copy `.env.example` to `.env` and configure

    -   `API_KEY`: the same as WHISPER_X_API_KEY in `.env` of RealChar backend
    -   `HF_ACCESS_TOKEN`:  Since [diarization models](https://github.com/m-bain/whisperX#speaker-diarization) are private repos, you need to apply for access to these models on Hugging Face and put your HF access token here.

1. Start the service

    ```bash
    uvicorn main:app
    ```

    How to specify host and port

    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```

    How to specify devices

    ```bash
    # select GPU to use
    CUDA_VISIBLE_DEVICES=0 uvicorn main:app
    # CPU only
    CUDA_VISIBLE_DEVICES=-1 uvicorn main:app
    ```

## Use with Docker

1. Build image

    ```bash
    docker build -t whisperx-server .
    ```

1. Create container with GPU

    ```bash
    docker run -dp 8000:8000 --gpus all --env-file .env --name whisperx-server-gpu whisperx-server
    ```

    Create container with CPU

    ```bash
    docker run -dp 8000:8000 --env-file .env --name whisperx-server-cpu whisperx-server
    ```

1. Remember to assign `WHISPER_X_API_URL` with the server IP in `.env` of the RealChar backend.

1. Compiled image also found at [Docker Hub](https://hub.docker.com/repository/docker/y1guo/whisperx-server/general): `y1guo/whisperx-server`

## Use with BentoML

1.  Install BentoML

    ```bash
    pip install bentoml
    ```

1.  Build the bento

    ```bash
    cd bento && bentoml build
    ```

1.  Start the bento

    ```bash
    BENTOML_CONFIG=bentoml_configuration.yaml bentoml serve whisperx-server:latest
    ```

1.  Upload the bento

    ```bash
    bentoml push whisperx-server:latest
    ```

-   Note: Environment variables are set on deployment

## Client Setup

### Example Code

```python
import json
import requests


url = "http://localhost:8000/transcribe"


def sample_api(
    audio_bytes, api_key, platform, initial_prompt, language, suppress_tokens, diarization
):
    # send request
    files = {"audio_file": ("filename", audio_bytes)}
    metadata = {
        "api_key": api_key,
        "platform": platform,
        "initial_prompt": initial_prompt,
        "language": language,
        "suppress_tokens": suppress_tokens,
        "diarization": diarization,
    }
    data = {"metadata": json.dumps(metadata)}
    response = requests.post(url, data=data, files=files)

    # parse response
    if response.status_code == 200:
        data = response.json()
        text = " ".join([seg["text"] for seg in data["segments"]])
        print(f"Transcription: {text}\nSegments: {data['segments']}")


# test audio
with open("audio.wav", "rb") as f:
    audio_bytes = f.read()

sample_api(audio_bytes, "YOUR_API_KEY", "web", "", "en-US", [-1], False)
```

## Appendix

### Benchmarks of several (not all) performance implememtations of whisper

| | fast-whisper | fast-whisper | whisperX | whisperX | whisper-jax | whisper-jax |
| - | - | - | - | - | - | - |
| device | CPU | GPU | CPU | GPU | CPU | GPU |
| 2-5 s audio | 0.87 s | 0.39 s | 0.52 s | 0.10 s| 1.23 s | 0.14 s|
| 5-10 s ausio | 1.01 s | 0.43 s | 0.76 s | 0.13 s | 1.88 s | 0.14 s |
| VRAM usage | | 1.7 GB | | 3.1 GB | | 19.5 GB|

Tested on AMD 5950X + RTX4090, on 296 samples of 2-5s audios and 194 samples of 5-10s audios. Using "base" model of whisper.
