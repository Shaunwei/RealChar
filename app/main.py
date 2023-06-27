from fastapi import FastAPI
from .websocket_routes import router as websocket_router
from .restful_routes import router as restful_router

app = FastAPI()

app.include_router(restful_router)
app.include_router(websocket_router)
