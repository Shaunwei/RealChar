import warnings
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from realtime_ai_companion.audio.text_to_speech.elevenlabs import ElevenLabs
from realtime_ai_companion.websocket_routes import router as websocket_router
from realtime_ai_companion.restful_routes import router as restful_router
from realtime_ai_companion.companion_catalog.catalog_manager import CatalogManager
from realtime_ai_companion.audio.speech_to_text.whisper import Whisper
from realtime_ai_companion.utils import ConnectionManager

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
