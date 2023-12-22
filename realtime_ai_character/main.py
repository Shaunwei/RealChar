import warnings

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from realtime_ai_character.audio.speech_to_text import get_speech_to_text
from realtime_ai_character.audio.text_to_speech import get_text_to_speech
from realtime_ai_character.character_catalog.catalog_manager import CatalogManager
from realtime_ai_character.restful_routes import router as restful_router
from realtime_ai_character.twilio.websocket import twilio_router
from realtime_ai_character.utils import ConnectionManager
from realtime_ai_character.websocket_routes import router as websocket_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Change to domains if you deploy this to production
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(restful_router)
app.include_router(websocket_router)
app.include_router(twilio_router)

# initializations
CatalogManager.initialize()
ConnectionManager.initialize()
get_text_to_speech()
get_speech_to_text()

# suppress deprecation warnings
warnings.filterwarnings("ignore", module="whisper")
