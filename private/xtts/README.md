# Experiments

### Test sentence

    Hello, it's really a pleature to meet you. What can I help you today?

### Latency

None streaming: time to audio ready: about 1.7 sec. ([Coqui Studio XTTS](https://docs.coqui.ai/docs))

Latency to first audio chunk: 204 milliseconds ([xtts-streaming](https://huggingface.co/spaces/coqui/xtts-streaming)) About 1 sec each chunk.

### Environment

```bash
conda create -n xtts python=3.11 -y
conda activate xtts
conda install -c "nvidia/label/cuda-11.8.0" cuda -y
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

or use Docker environment (recommended): [pytorch/pytorch:2.1.0-cuda11.8-cudnn8-devel](https://hub.docker.com/layers/pytorch/pytorch/2.1.0-cuda11.8-cudnn8-devel/images/sha256-558b78b9a624969d54af2f13bf03fbad27907dbb6f09973ef4415d6ea24c80d9?context=explore)

### Notes

-   models: Copy your downloades xtts model here. It will be copied into the docker image. Otherwise one'll need to agree to the license upon image startup.

-   voices: Put the sample voice files you want the xtts server to be able to mimic. File name is the `voice_id`. e.g. `female.wav` means `voice_id = "female"`.
