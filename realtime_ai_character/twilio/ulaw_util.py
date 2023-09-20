def is_mulaw_silence_bytes(byte8bit: bytes):
    count0xff = 0
    count = 0

    for b in byte8bit:
        count += 1
        if b > 250:
            count0xff += 1

    return (count0xff / count) > 0.5
