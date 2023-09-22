FROM python:slim

# Install dependencies necessary to build and run FFmpeg
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    yasm \
    git \
    curl \
    portaudio19-dev \
    libffi-dev \
    libssl-dev \
    libx264-dev \
    libopus-dev

# Compile and install FFmpeg 4.4 from source
RUN mkdir -p ffmpeg && cd ffmpeg && \
    curl -O https://ffmpeg.org/releases/ffmpeg-4.4.tar.bz2 && \
    tar xvf ffmpeg-4.4.tar.bz2 && cd ffmpeg-4.4 && \
    ./configure --enable-gpl --enable-nonfree --enable-libx264 --enable-libopus && \
    make -j$(nproc) && \
    make install && \
    ldconfig && \
    cd ../.. && rm -r ffmpeg

WORKDIR /realtime_ai_character

# Install Python dependencies
COPY requirements.txt /realtime_ai_character
RUN pip install -r /realtime_ai_character/requirements.txt

# Copy the project files
COPY ./ /realtime_ai_character

# Expose 8000 port from the docker image.
EXPOSE 8000

# Make the entrypoint script executable
RUN chmod +x /realtime_ai_character/entrypoint.sh

# Run the application
CMD ["/bin/sh", "/realtime_ai_character/entrypoint.sh"]
