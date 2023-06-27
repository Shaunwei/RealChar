from fastapi import FastAPI
from .websocket_routes import websocket_endpoint
from .restful_routes import router

app = FastAPI()

app.include_router(router)
app.websocket_route("/ws/{client_id}")(websocket_endpoint)
