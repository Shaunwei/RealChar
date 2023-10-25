import os
import stat
from zipfile import ZipFile
from dotenv import load_dotenv
from typing import Annotated
from fastapi import FastAPI, HTTPException, Form, Header
from fastapi.responses import StreamingResponse

from xtts import XTTS


load_dotenv()

# Use never ffmpeg binary for Ubuntu20 to use denoising for microphone input
# print("Export newer ffmpeg binary for denoise filter")
ZipFile("ffmpeg.zip").extractall()
# print("Make ffmpeg binary executable")
st = os.stat("ffmpeg")
os.chmod("ffmpeg", st.st_mode | stat.S_IEXEC)

API_KEY = os.getenv("API_KEY", "")

app = FastAPI()

xtts = XTTS()


@app.post("/speech")
async def speech(
    api_key: Annotated[str | None, Header()] = None,
    prompt: str = Form(...),
    language: str = Form(...),
    voice_id: str = Form(...),
):
    # async def speech():
    # # get api_key from headers
    # api_key = request.headers.get("api-key", "")
    print(f"api_key: {api_key}")
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key.")

    # speech
    result = xtts.predict(prompt, language, voice_id)
    # def stream():
    #     for i in range(5):
    #         yield b"hello"
    #         time.sleep(1)
    #     yield b"world"

    return StreamingResponse(result, media_type="audio/mpeg3")
