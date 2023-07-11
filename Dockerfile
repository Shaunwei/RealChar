FROM python:3.10-bullseye

# Install system-level dependencies
RUN apt-get update && apt-get install -y portaudio19-dev libffi-dev libssl-dev ffmpeg

WORKDIR /realtime_ai_character

# Copy the project files
COPY ./ /realtime_ai_character

# Install Python dependencies
RUN pip install -r requirements.txt

# Build the application
RUN alembic upgrade head

EXPOSE 8000

CMD ["uvicorn", "realtime_ai_character.main:app", "--host", "0.0.0.0"]
