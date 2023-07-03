from pydantic.dataclasses import dataclass
from starlette.websockets import WebSocketState, WebSocket
from typing import List


@dataclass
class Companion:
    name: str
    llm_system_prompt: str
    llm_user_prompt: str


@dataclass
class ConversationHistory:
    system_prompt: str
    user: list[str]
    ai: list[str]

    def __iter__(self):
        yield self.system_prompt
        for user_message, ai_message in zip(self.user, self.ai):
            yield user_message
            yield ai_message


class Singleton:
    _instances = {}

    @classmethod
    def get_instance(cls, *args, **kwargs):
        """ Static access method. """
        if cls not in cls._instances:
            cls._instances[cls] = cls(*args, **kwargs)

        return cls._instances[cls]

    @classmethod
    def initialize(cls, *args, **kwargs):
        """ Static access method. """
        if cls not in cls._instances:
            cls._instances[cls] = cls(*args, **kwargs)

    def __init__(self):
        pass


class ConnectionManager(Singleton):
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


def get_connection_manager():
    return ConnectionManager.get_instance()
