FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-devel

WORKDIR /xtts-server

# Install Python dependencies
RUN pip install --upgrade pip setuptools
RUN pip install langid TTS==0.22.0 deepspeed==0.12.4 "fastapi[all]"
RUN pip cache purge

# Copy the project files
COPY *.py /xtts-server/
COPY ffmpeg.zip /xtts-server/

# Expose 8000 port from the docker image.
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
