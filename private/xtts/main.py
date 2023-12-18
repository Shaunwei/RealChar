import os
import stat
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import StreamingResponse
from typing import Annotated
from xtts import XTTS
from zipfile import ZipFile

from utils import Data


load_dotenv()
API_KEY = os.getenv("API_KEY", "")

# Use never ffmpeg binary for Ubuntu20 to use denoising for microphone input
# print("Export newer ffmpeg binary for denoise filter")
ZipFile("ffmpeg.zip").extractall()
# print("Make ffmpeg binary executable")
st = os.stat("ffmpeg")
os.chmod("ffmpeg", st.st_mode | stat.S_IEXEC)

app = FastAPI()

xtts = XTTS()


@app.post("/speech")
async def speech(
    api_key: Annotated[str, Header()],
    data: Data
):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key.")

    result = xtts.predict(data)

    return StreamingResponse(result, media_type="audio/mpeg")
