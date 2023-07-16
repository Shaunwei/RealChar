FROM python:3.10-bullseye

# Install system-level dependencies
RUN apt-get update && apt-get install -y portaudio19-dev libffi-dev libssl-dev ffmpeg

WORKDIR /realtime_ai_character

# Copy the project files
COPY ./ /realtime_ai_character

# Install Python dependencies
RUN pip install -r requirements.txt

EXPOSE 8000

# Make the entrypoint script executable
RUN chmod +x /realtime_ai_character/entrypoint.sh

# Run the application
CMD ["/bin/sh", "/realtime_ai_character/entrypoint.sh"]
