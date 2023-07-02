import os
from dotenv import load_dotenv
from fastapi import FastAPI
from realtime_ai_companion.websocket_routes import router as websocket_router
from realtime_ai_companion.restful_routes import router as restful_router
from realtime_ai_companion.companion_catalog.catalog_manager import CatalogManager

load_dotenv()
app = FastAPI()

app.include_router(restful_router)
app.include_router(websocket_router)

# initialize catalog manager
CatalogManager.initialize(overwrite=True)
