# Deploy whisperX with BentoML

## Environment

1.  Create Virtual Environment

    ```bash
    conda create -n whisperx-server-bentoml python=3.10 -y && conda activate whisperx-server-bentoml
    ```

1.  Install whisperX

    ```bash
    pip install git+https://github.com/m-bain/whisperx.git
    ```

    Might need to manually add the `cudnn` path

    ```bash
    conda env config vars set LD_LIBRARY_PATH=/PATH-TO-YOUR-ENVS/whisperx-server-bentoml/lib/python3.10/site-packages/nvidia/cudnn/lib:$LD_LIBRARY_PATH
    ```

1.  Install ffmpeg

    ```bash
    conda install ffmpeg -c pytorch
    ```

    or

    ```bash
    sudo apt update && sudo apt install ffmpeg
    ```

1.  Install BentoML

    ```bash
    pip install bentoml
    ```

1.  To start the service

    ```bash
    BENTOML_CONFIG=bentoml_configuration.yaml bentoml serve main:svc
    ```

    or start with the bento

    ```bash
    BENTOML_CONFIG=bentoml_configuration.yaml bentoml serve whisperx-server:latest
    ```

1.  Environment variables are set on deployment

## Notes

To-do:

-   Allow editing environment variables outside of bento

-   Make sure ffmpeg is available for the bento on the cloud

-   Test with web client
