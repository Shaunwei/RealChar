import asyncio
import fractions
import io
import time

import av
from av import AudioFrame, AudioResampler
from av.audio.fifo import AudioFifo
from aiortc import MediaStreamTrack
from aiortc.mediastreams import AUDIO_PTIME, MediaStreamError

from realtime_ai_character.logger import get_logger

logger = get_logger(__name__)


# Class for streaming TTS generated audio to client.
class TTSStreamingTrack(MediaStreamTrack):
    kind = "audio"

    sample_rate = 44100
    samples = sample_rate * AUDIO_PTIME
    format = "s16"
    layout = "mono"
    frame_buffer: asyncio.Queue()
    # Convert 3 sentences concurrently at most.
    audio_byteio_buffer: asyncio.Queue()
    resampler = AudioResampler(format=format, layout=layout, rate=sample_rate)

    conversion_cancelled: asyncio.Event
    _start: float
    _timestamp: int

    def __init__(self) -> None:
        super().__init__()
        self.play_buffer = False
        self.conversion_task = asyncio.create_task(self._start_converting())
        self.conversion_cancelled = asyncio.Event()
        # Maintain a buffer of 0.2 second of audio.
        self.frame_buffer = asyncio.Queue(maxsize=0.2 / AUDIO_PTIME)
        self.audio_byteio_buffer = asyncio.Queue(maxsize=3)

    def silence_frame(self):
        frame = AudioFrame(format=self.format, layout=self.layout, samples=self.samples)
        for p in frame.planes:
            p.update(bytes(p.buffer_size))
        frame.pts = self._timestamp
        frame.sample_rate = self.sample_rate
        frame.time_base = fractions.Fraction(1, self.sample_rate)
        return frame

    async def convert_frames(self, audio_bytes_io):
        if not audio_bytes_io:
            return
        # PyAV Audio "Pipeline" for uniform output frames
        with av.open(audio_bytes_io, mode="r") as container:
            in_stream = container.streams.audio[0]
            fifo = AudioFifo()
            processed_time = 0
            for frame in container.decode(in_stream):
                for resampled in self.resampler.resample(frame):
                    resampled.pts = None
                    processed_time += resampled.samples / resampled.sample_rate
                    fifo.write(resampled)
                    if processed_time >= AUDIO_PTIME:
                        processed_time -= AUDIO_PTIME
                        if self.conversion_cancelled.is_set():
                            return
                        await self.frame_buffer.put(fifo.read(self.samples))
            # Remove tail partial sample from fifo to minimize glitches.
            while tail_frame := fifo.read(self.samples, partial=False):
                if self.conversion_cancelled.is_set():
                    return
                await self.frame_buffer.put(tail_frame)

    async def _start_converting(self):
        while True:
            if self.conversion_cancelled.is_set():
                return
            try:
                await self.convert_frames(await self.audio_byteio_buffer.get())
            except asyncio.CancelledError:
                return

    def start_playing(self):
        self.play_buffer = True

    async def add_stream(self, audio_bytes_task):
        # If play_buffer is set to false, cancel the task.
        if not self.play_buffer:
            audio_bytes_task.cancel()
            return
        await self.audio_byteio_buffer.put(io.BytesIO(await audio_bytes_task))

    async def cancel_stream(self):
        self.play_buffer = False
        # Cancel the conversion task loop.
        self.conversion_cancelled.set()
        self.conversion_task.cancel()
        try:
            await self.conversion_task
        except asyncio.CancelledError:
            pass
        # Cancel pending convert_frames tasks.
        while self.audio_byteio_buffer.qsize() > 0:
            self.audio_byteio_buffer.get_nowait()
        # Clear frame buffer.
        while self.frame_buffer.qsize() > 0:
            self.frame_buffer.get_nowait()

        # Fire the loop again.
        self.conversion_cancelled.clear()
        self.conversion_task = asyncio.create_task(self._start_converting())

    async def recv(self):
        if self.readyState != "live":
            raise MediaStreamError("track is not live")

        sample_rate = 44100
        samples = int(AUDIO_PTIME * sample_rate)

        if hasattr(self, "_timestamp"):
            self._timestamp += samples
            wait = self._start + (self._timestamp / sample_rate) - time.time()
            await asyncio.sleep(wait)
        else:
            self._start = time.time()
            self._timestamp = 0

        frame = self.silence_frame()
        if self.play_buffer and self.frame_buffer.qsize() > 0:
            frame = self.frame_buffer.get_nowait()
            frame.pts = self._timestamp
            frame.sample_rate = sample_rate
            frame.time_base = fractions.Fraction(1, sample_rate)

        return frame
