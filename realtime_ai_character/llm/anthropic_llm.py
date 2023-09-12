from typing import List

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import ChatAnthropic
from langchain.schema import BaseMessage, HumanMessage

from realtime_ai_character.database.chroma import get_chroma
from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, \
    AsyncCallbackTextHandler, LLM, QuivrAgent, SearchAgent
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Character, timed

logger = get_logger(__name__)


class AnthropicLlm(LLM):
    def __init__(self, model):
        self.chat_anthropic = ChatAnthropic(
            model=model,
            temperature=0.5,
            streaming=True
        )
        self.config = {
            "model": model,
            "temperature": 0.5,
            "streaming": True
        }
        self.db = get_chroma()
        self.search_agent = SearchAgent()
        self.quivr_agent = QuivrAgent()

    def get_config(self):
        return self.config

    @timed
    async def achat(self,
                    history: List[BaseMessage],
                    user_input: str,
                    user_input_template: str,
                    callback: AsyncCallbackTextHandler,
                    audioCallback: AsyncCallbackAudioHandler,
                    character: Character,
                    useSearch: bool = False,
                    useQuivr: bool = False,
                    quivrApiKey: str = None,
                    quivrBrainId: str = None,
                    metadata: dict = None,
                    *args, **kwargs) -> str:
        # 1. Generate context
        context = self._generate_context(user_input, character)
        memory_context = self._generate_memory_context(user_id='', query=user_input)
        if memory_context:
            context += ("Information regarding this user based on previous chat: " 
            + memory_context + '\n')
        # Get search result if enabled
        if useSearch:
            context += self.search_agent.search(user_input)
        if useQuivr and quivrApiKey is not None and quivrBrainId is not None:
            context += self.quivr_agent.question(
                user_input, quivrApiKey, quivrBrainId)

        # 2. Add user input to history
        history.append(HumanMessage(content=user_input_template.format(
            context=context, query=user_input)))

        # 3. Generate response
        response = await self.chat_anthropic.agenerate(
            [history], callbacks=[callback, audioCallback, StreamingStdOutCallbackHandler()],
            metadata=metadata)
        logger.info(f'Response: {response}')
        return response.generations[0][0].text

    def _generate_context(self, query, character: Character) -> str:
        docs = self.db.similarity_search(query)
        docs = [d for d in docs if d.metadata['character_name'] == character.name]
        logger.info(f'Found {len(docs)} documents')

        context = '\n'.join([d.page_content for d in docs])
        return context

    def _generate_memory_context(self, user_id: str, query: str) -> str:
        # Not implemented
        pass
