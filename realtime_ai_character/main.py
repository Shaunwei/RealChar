import os
import warnings

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from realtime_ai_character.audio.speech_to_text import get_speech_to_text
from realtime_ai_character.audio.text_to_speech import get_text_to_speech
from realtime_ai_character.character_catalog.catalog_manager import CatalogManager
from realtime_ai_character.memory.memory_manager import MemoryManager
from realtime_ai_character.restful_routes import router as restful_router
from realtime_ai_character.utils import ConnectionManager
from realtime_ai_character.websocket_routes import router as websocket_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Change to domains if you deploy this to production
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(restful_router)
app.include_router(websocket_router)

web_build_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                              '..', 'client', 'web', 'build')

if os.path.exists(web_build_path):
    app.mount("/static/", 
              StaticFiles(directory=os.path.join(web_build_path, 'static')), 
              name="static")

    @app.get("/", response_class=FileResponse)
    async def read_index():
        return FileResponse(os.path.join(web_build_path, 'index.html'))
                            
    @app.get("/{catchall:path}", response_class=FileResponse)
    def read_static(request: Request):
        path = request.path_params["catchall"]
        file = os.path.join(web_build_path, path)

        if os.path.exists(file):
            return FileResponse(file)

        return RedirectResponse("/")
else:
    # If the web app is not built, prompt the user to build it
    static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    app.mount("/static/", StaticFiles(directory=static_path), name="static")

    @app.get("/", response_class=FileResponse)
    async def read_index():
        return FileResponse(os.path.join(static_path, '404.html'))

# initializations
overwrite_chroma = os.getenv("OVERWRITE_CHROMA", 'True').lower() in ('true', '1')
CatalogManager.initialize(overwrite=overwrite_chroma)
ConnectionManager.initialize()
MemoryManager.initialize()
get_text_to_speech()
get_speech_to_text()

# suppress deprecation warnings
warnings.filterwarnings("ignore", module="whisper")
