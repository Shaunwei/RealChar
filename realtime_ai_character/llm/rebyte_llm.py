from typing import List, Union
import os

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.schema import BaseMessage, HumanMessage

from realtime_ai_character.llm.base import (
    AsyncCallbackAudioHandler,
    AsyncCallbackTextHandler,
    LLM,
)
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Character, timed

from rebyte_langchain.rebyte_langchain import RebyteEndpoint

logger = get_logger(__name__)


class RebyteLlm(LLM):
    def __init__(self):
        self.rebyte_api_key = os.getenv('REBYTE_API_KEY', '')

        self.chat_rebyte = RebyteEndpoint(
            api_key=self.rebyte_api_key,
            streaming=True
        )
        self.config = {}

    def get_config(self):
        return self.config

    def _set_character_config(self, character: Character):
        self.chat_rebyte.project_id = character.rebyte_api_project_id
        self.chat_rebyte.agent_id = character.rebyte_api_agent_id
        if character.rebyte_api_version is not None:
            self.chat_rebyte.version = character.rebyte_api_version

    def _set_user_config(self, user_id: str):
        self.chat_rebyte.session_id = user_id

    @timed
    async def achat(
        self,
        history: Union[List[BaseMessage], List[str]],
        user_input: str,
        callback: AsyncCallbackTextHandler,
        audioCallback: AsyncCallbackAudioHandler,
        character: Character,
        metadata: dict = None,
        *args,
        **kwargs,
    ) -> str:
        # 1. Add user input to history
        # delete the first system message in history. just use the system prompt in rebyte platform
        history.pop(0) 

        history.append(
            HumanMessage(
                content=user_input
            )
        )
        # 2. Generate response
        # set project_id and agent_id for character
        self._set_character_config(character=character)
        # set session_id for user
        self._set_user_config(user_id=metadata["user_id"])

        response = await self.chat_rebyte.agenerate(
            [history],
            callbacks=[callback, audioCallback, StreamingStdOutCallbackHandler()],
            metadata=metadata,
        )
        logger.info(f'Response: {response}')
        return response.generations[0][0].text

