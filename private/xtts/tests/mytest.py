import asyncio
import os
import httpx
from time import perf_counter
from dotenv import load_dotenv
load_dotenv()


api_key = os.getenv("API_KEY", "")
api_url = os.getenv("API_URL", "")
prompt = os.getenv("PROMPT", "")


async def test(verbose=True):
    headers = {
        'api-key': api_key,
    }
    data = {
        "prompt": prompt,
        "language": "en",
        "voice_id": "female",
    }
    if verbose:
        print(f"Sending request to {api_url}")
        print(f"Prompt: {prompt}")

    for file in os.listdir("tests"):
        if file.endswith(".wav"):
            os.remove(os.path.join("tests", file))
    start = perf_counter()
    i_chunk = 0
    tot_chunk = b""
    with httpx.stream("POST", api_url, data=data, headers=headers) as response:
        print(f"Status code: {response.status_code}")
        for chunk in response.iter_bytes():
            print(f"Chunk: {len(chunk)} bytes, "
                  f"time elapsed: {(perf_counter() - start) * 1000:.0f} ms")
            tot_chunk += chunk
            with open(f"tests/chunk{i_chunk}.wav", "wb") as f:
                f.write(chunk)
            i_chunk += 1
    print(f"Total chunk: {len(tot_chunk)} bytes")
    with open("tests/tot_chunk.wav", "wb") as f:
        f.write(tot_chunk)

    if response.status_code == 200:
        if verbose:
            print(f"Success: {response.status_code}")
    else:
        if verbose:
            print(f"Error: {response.status_code}")

    return perf_counter() - start


if __name__ == "__main__":
    elapsed = asyncio.run(test())
    print(f"Request took {elapsed * 1000:.0f} ms")
