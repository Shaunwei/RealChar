import os
import warnings

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from realtime_ai_character.audio.speech_to_text.whisper import Whisper
from realtime_ai_character.audio.text_to_speech.elevenlabs import ElevenLabs
from realtime_ai_character.character_catalog.catalog_manager import \
    CatalogManager
from realtime_ai_character.restful_routes import router as restful_router
from realtime_ai_character.utils import ConnectionManager
from realtime_ai_character.websocket_routes import router as websocket_router

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')

load_dotenv()
app = FastAPI()

app.include_router(restful_router)
app.include_router(websocket_router)

# initializations
CatalogManager.initialize(overwrite=False)
Whisper.initialize()
ConnectionManager.initialize()
ElevenLabs.initialize()

# suppress deprecation warnings
warnings.filterwarnings("ignore", module="whisper")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
