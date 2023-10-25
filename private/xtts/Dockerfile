FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-devel

WORKDIR /xtts-server

# Copy the project files
COPY *.py /xtts-server/
COPY voices/ /xtts-server/voices/
COPY models/ /xtts-server/models/
COPY ffmpeg.zip /xtts-server/

# Install Python dependencies
RUN pip install --upgrade pip setuptools
RUN pip install langid TTS==0.18.2 deepspeed==0.11.1 pydantic==1.* "fastapi[all]"
RUN pip cache purge

# Expose 8000 port from the docker image.
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
