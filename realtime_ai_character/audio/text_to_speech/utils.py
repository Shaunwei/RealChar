import io

import torch
import torchaudio

from realtime_ai_character.logger import get_logger

logger = get_logger(__name__)


def MP3ToUlaw(src: bytes) -> bytes:
    reader = torchaudio.io.StreamReader(io.BytesIO(src))
    logger.info(f"MP3ToUlaw stream: {reader.get_src_stream_info(0)}")
    reader.add_basic_audio_stream(-1, decoder="mp3float", sample_rate=8000)
    audio = torch.concat([chunk[0] for chunk in reader.stream()])

    # ulaw encoding
    ulaw_encoding = torchaudio.transforms.MuLawEncoding()
    ulaw_wave = ulaw_encoding(audio).to(torch.uint8)

    buffer = io.BytesIO()
    writer = torchaudio.io.StreamWriter(dst=buffer, format="mulaw")
    writer.add_audio_stream(sample_rate=8000, num_channels=1, format="u8")

    with writer.open():
        writer.write_audio_chunk(0, ulaw_wave)

    return buffer.getvalue()
