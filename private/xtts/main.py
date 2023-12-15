from dotenv import load_dotenv

load_dotenv()
import os
import stat
from zipfile import ZipFile
from typing import Annotated
from fastapi import FastAPI, HTTPException, Form, Header
from fastapi.responses import StreamingResponse
from xtts import XTTS

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
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key.")

    result = xtts.predict(prompt, language, voice_id)

    return StreamingResponse(result, media_type="audio/mpeg3")
