import io


def MP3ToUlaw(src: bytes) -> bytes:
    import torch
    import torchaudio

    waveform, sample_rate = torchaudio.load(io.BytesIO(src), normalize=True)  # type: ignore
    waveform = torchaudio.functional.resample(waveform, sample_rate, 8000)
    waveform = torchaudio.functional.highpass_biquad(waveform, sample_rate=8000, cutoff_freq=500)
    waveform = torchaudio.functional.lowpass_biquad(waveform, sample_rate=8000, cutoff_freq=3500)

    # ulaw encoding
    ulaw_encoding = torchaudio.transforms.MuLawEncoding(quantization_channels=256)
    ulaw_waveform = ulaw_encoding(waveform).to(torch.uint8)

    buffer = io.BytesIO()
    writer = torchaudio.io.StreamWriter(dst=buffer, format="mulaw")
    writer.add_audio_stream(sample_rate=8000, num_channels=1, format="u8")

    with writer.open():
        writer.write_audio_chunk(0, torch.transpose(ulaw_waveform, 0, 1))

    return buffer.getvalue()
