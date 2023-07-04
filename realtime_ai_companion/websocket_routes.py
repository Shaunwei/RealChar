import asyncio
from fastapi import Depends, Path, WebSocket, WebSocketDisconnect, APIRouter
from typing import List
from requests import Session
from starlette.websockets import WebSocketState
from realtime_ai_companion.logger import get_logger
from realtime_ai_companion.database.connection import get_db
from realtime_ai_companion.models.interaction import Interaction
from realtime_ai_companion.llm.openai_llm import OpenaiLlm, AsyncCallbackHandler, get_llm
from realtime_ai_companion.utils import ConversationHistory
from realtime_ai_companion.companion_catalog.catalog_manager import CatalogManager, get_catalog_manager
from realtime_ai_companion.tools.tts import Text2Audio, get_tts
import time


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
async def websocket_endpoint(websocket: WebSocket, client_id: int = Path(...), db: Session = Depends(get_db), llm: OpenaiLlm = Depends(get_llm), catalog_manager=Depends(get_catalog_manager), tts=Depends(get_tts)):
    await manager.connect(websocket)
    try:
        receive_task = asyncio.create_task(
            receive_and_echo_client_message(websocket, client_id, db, llm, catalog_manager, tts))
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


async def receive_and_echo_client_message(websocket: WebSocket, client_id: int, db: Session, llm: OpenaiLlm, catalog_manager: CatalogManager, tts: Text2Audio):
    try:
        conversation_history = ConversationHistory(
            system_prompt='',
            user=[],
            ai=[]
        )
        user_input_template = 'Context:{context}\n User:{query}'

        async def on_new_token(token):
            return await manager.send_message(message=token, websocket=websocket)
        await manager.send_message(message=f"Select your companion [{', '.join(catalog_manager.companions.keys())}]\n", websocket=websocket)
        while True:
            print("receiving text \ n")
            data = await websocket.receive_text()
            print("received text \ n")
            if data in catalog_manager.companions.keys():
                print("1 in 3 \ n")
                companion = catalog_manager.get_companion(data)
                conversation_history.system_prompt = companion.llm_system_prompt
                user_input_template = companion.llm_user_prompt
                logger.info(
                    f"Client #{client_id} selected companion: {data}")
                continue
            logger.info(f"Client #{client_id} said: {data}")

            query = data
            print("start generating answer \ n")
            response = await llm.achat(
                history=llm.build_history(conversation_history), user_input=query, user_input_template=user_input_template, callback=AsyncCallbackHandler(on_new_token), companion=companion)
            
            # print("--------- start generating speak ---------")
            # start_time = time.time()
            # await tts.stream(response, websocket)
            # print("--- speech generated in %s seconds ---" % (time.time() - start_time))
            print("sending \ n")
            await manager.send_message(message='\n', websocket=websocket)
            print("sent \ n")
            
            conversation_history.user.append(query)
            conversation_history.ai.append(response)
            interaction = Interaction(
                client_id=client_id, client_message=query, server_message=response)
            db.add(interaction)
            db.commit()
    except WebSocketDisconnect:
        logger.info(f"Client #{client_id} closed the connection")
        raise  # re-raise the exception after logging
    except Exception as e:
        logger.error(f"Exception occurred: {e}")
        raise  # re-raise the exception after logging

async def send_generated_numbers(websocket: WebSocket):
    index = 1
    try:
        while True:
            # await manager.send_message(f"Generated Number: {index}", websocket)
            index += 1
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        logger.info("Connection closed while sending generated numbers.")
