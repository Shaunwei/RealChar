FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

# Install system-level dependencies
RUN apt-get update && apt-get install -y git && apt-get clean

WORKDIR /whisperx_server

# Copy the project files
COPY *.py /whisperx_server/
COPY *.mp3 /whisperx_server/

# Install Python dependencies
# RUN bash -i /whisperx_server/setup.sh
RUN pip install --upgrade pip
RUN pip install --upgrade setuptools
RUN pip install git+https://github.com/m-bain/whisperx.git@051047bb25b740fed2ea93ca737499c37e8dc9d4
RUN pip install opencc
RUN pip install "fastapi[all]"
RUN pip cache purge

# Expose 8000 port from the docker image.
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
