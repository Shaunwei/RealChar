import asyncio
from fastapi import WebSocket, WebSocketDisconnect, Path
from typing import List
from starlette.websockets import WebSocketState


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


async def websocket_endpoint(websocket: WebSocket, client_id: int = Path(...)):
    await manager.connect(websocket)
    try:
        receive_task = asyncio.create_task(
            receive_and_echo_client_message(websocket, client_id))
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


async def receive_and_echo_client_message(websocket: WebSocket, client_id: int):
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Client #{client_id} said: {data}")
            await manager.send_message(f"Client #{client_id} said: {data}", websocket)
    except WebSocketDisconnect:
        print(f"Client #{client_id} closed the connection")


async def send_generated_numbers(websocket: WebSocket):
    index = 1
    try:
        while True:
            await manager.send_message(f"Generated Number: {index}", websocket)
            index += 1
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Connection closed while sending generated numbers.")
