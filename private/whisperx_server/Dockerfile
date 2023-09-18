FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

# Install system-level dependencies
RUN apt-get update && apt-get install -y wget git build-essential && apt-get clean

WORKDIR /whisperx_server

# Copy the project files
COPY ./ /whisperx_server

# Install Python dependencies
# RUN bash -i /whisperx_server/setup.sh
RUN pip install --upgrade pip
RUN pip install --upgrade setuptools
RUN pip install git+https://github.com/m-bain/whisperx.git
RUN pip install "fastapi[all]"
RUN pip cache purge

# Expose 8000 port from the docker image.
EXPOSE 8000

# Select the GPU to use
ENV NVIDIA_VISIBLE_DEVICES 0

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
