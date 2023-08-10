import os
from typing import List

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import ChatOpenAI
from langchain.schema import BaseMessage, HumanMessage

from realtime_ai_character.database.chroma import get_chroma
from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, AsyncCallbackTextHandler, LLM, SearchAgent
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Character

logger = get_logger(__name__)


class AnysacleLlm(LLM):
    def __init__(self, model):
        self.chat_open_ai = ChatOpenAI(
            model=model,
            temperature=0.5,
            streaming=True,
            openai_api_base='https://api.endpoints.anyscale.com/v1',
            openai_api_key=os.getenv('ANYSCALE_ENDPOINT_API_KEY'),
        )
        self.config = {
            "model": model,
            "temperature": 0.5,
            "streaming": True
        }
        self.db = get_chroma()
        self.search_agent = None
        self.search_agent = SearchAgent()

    def get_config(self):
        return self.config

    async def achat(self,
                    history: List[BaseMessage],
                    user_input: str,
                    user_input_template: str,
                    callback: AsyncCallbackTextHandler,
                    audioCallback: AsyncCallbackAudioHandler,
                    character: Character,
                    useSearch: bool = False,
                    *args, **kwargs) -> str:
        # 1. Generate context
        context = self._generate_context(user_input, character)
        # Get search result if enabled
        if useSearch:
            context += self.search_agent.search(user_input)

        # 2. Add user input to history
        history.append(HumanMessage(content=user_input_template.format(
            context=context, query=user_input)))

        # 3. Generate response
        response = await self.chat_open_ai.agenerate(
            [history], callbacks=[callback, audioCallback, StreamingStdOutCallbackHandler()])
        logger.info(f'Response: {response}')
        return response.generations[0][0].text

    def _generate_context(self, query, character: Character) -> str:
        docs = self.db.similarity_search(query)
        docs = [d for d in docs if d.metadata['character_name'] == character.name]
        logger.info(f'Found {len(docs)} documents')

        context = '\n'.join([d.page_content for d in docs])
        return context
