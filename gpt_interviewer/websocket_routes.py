import asyncio
from fastapi import Depends, Path, WebSocket, WebSocketDisconnect, APIRouter
from typing import List
from requests import Session
from starlette.websockets import WebSocketState
from gpt_interviewer.logger import get_logger
from gpt_interviewer.database.connection import get_db
from gpt_interviewer.models.interaction import Interaction

logger = get_logger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        await self.broadcast_message(f"Client #{id(websocket)} left the chat")

    async def send_message(self, message: str, websocket: WebSocket):
        if websocket.application_state == WebSocketState.CONNECTED:
            await websocket.send_text(message)

    async def broadcast_message(self, message: str):
        for connection in self.active_connections:
            if connection.application_state == WebSocketState.CONNECTED:
                await connection.send_text(message)


manager = ConnectionManager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int = Path(...), db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        receive_task = asyncio.create_task(
            receive_and_echo_client_message(websocket, client_id, db))
        send_task = asyncio.create_task(send_generated_numbers(websocket))

        done, pending = await asyncio.wait(
            [receive_task, send_task],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        await manager.broadcast_message(f"Client #{client_id} left the chat")


async def receive_and_echo_client_message(websocket: WebSocket, client_id: int, db: Session):
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Client #{client_id} said: {data}")
            message = f'Client #{client_id} said: {data}'
            interaction = Interaction(
                client_id=client_id, client_message=data, server_message=message)
            db.add(interaction)
            db.commit()
            await manager.send_message(message, websocket)
    except WebSocketDisconnect:
        logger.info(f"Client #{client_id} closed the connection")


async def send_generated_numbers(websocket: WebSocket):
    index = 1
    try:
        while True:
            await manager.send_message(f"Generated Number: {index}", websocket)
            index += 1
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        logger.info("Connection closed while sending generated numbers.")
