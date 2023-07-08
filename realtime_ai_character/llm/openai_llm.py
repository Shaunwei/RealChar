import os
from typing import List

import openai
from dotenv import load_dotenv
from langchain.callbacks.base import AsyncCallbackHandler
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import (AIMessage, BaseMessage, HumanMessage,
                              SystemMessage)

from realtime_ai_character.database.chroma import get_chroma
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import (Character, ConversationHistory,
                                         Singleton)

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

logger = get_logger(__name__)
embedding = OpenAIEmbeddings()

StreamingStdOutCallbackHandler.on_chat_model_start = lambda *args, **kwargs: None


class AsyncCallbackHandler(AsyncCallbackHandler):
    def __init__(self, on_new_token=None, token_buffer=None, on_llm_end=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.on_new_token = on_new_token
        self._on_llm_end = on_llm_end
        self.token_buffer = token_buffer

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_new_token(self, token: str, *args, **kwargs):
        if self.token_buffer is not None:
            self.token_buffer.append(token)
        await self.on_new_token(token)

    async def on_llm_end(self, *args, **kwargs):
        if self._on_llm_end is not None:
            await self._on_llm_end(''.join(self.token_buffer))
            self.token_buffer.clear()


class AsyncCallbackAudioHandler(AsyncCallbackHandler):
    def __init__(self, text_to_speech=None, websocket=None, tts_event=None, character_name="", *args, **kwargs):
        super().__init__(*args, **kwargs)
        if text_to_speech is None:
            def text_to_speech(token): return logger.info(
                f'New audio token: {token}')
        self.text_to_speech = text_to_speech
        self.websocket = websocket
        self.current_sentence = ""
        self.character_name = character_name
        self.is_reply = False  # the start of the reply. i.e. the substring after '>'
        self.tts_event = tts_event
        # optimization: trade off between latency and quality for the first sentence
        self.is_first_sentence = True

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_new_token(self, token: str, *args, **kwargs):
        if not self.is_reply and token == ">":
            self.is_reply = True
        elif self.is_reply:
            if token != ".":
                self.current_sentence += token
            else:
                await self.text_to_speech.stream(
                    self.current_sentence,
                    self.websocket,
                    self.tts_event,
                    self.character_name,
                    self.is_first_sentence)
                self.current_sentence = ""
                if self.is_first_sentence:
                    self.is_first_sentence = False

    async def on_llm_end(self, *args, **kwargs):
        if self.current_sentence != "":
            await self.text_to_speech.stream(
                self.current_sentence,
                self.websocket, self.tts_event, self.character_name, self.is_first_sentence)


class OpenaiLlm(Singleton):
    def __init__(self):
        super().__init__()

        self.chat_open_ai = ChatOpenAI(
            model='gpt-3.5-turbo-16k-0613',
            temperature=0.2,
            streaming=True
        )
        self.db = get_chroma()

    async def achat(self,
                    history: List[BaseMessage],
                    user_input: str,
                    user_input_template: str,
                    callback: AsyncCallbackHandler,
                    audioCallback: AsyncCallbackAudioHandler,
                    character: Character) -> str:
        # 1. Generate context
        context = self._generate_context(user_input, character)

        # 2. Add user input to history
        history.append(HumanMessage(content=user_input_template.format(
            context=context, query=user_input)))

        # 3. Generate response
        response = await self.chat_open_ai.agenerate(
            [history], callbacks=[callback, audioCallback, StreamingStdOutCallbackHandler()])
        logger.info(f'Response: {response}')
        return response.generations[0][0].text

    def build_history(self, conversation_history: ConversationHistory) -> List[BaseMessage]:
        history = []
        for i, message in enumerate(conversation_history):
            if i == 0:
                history.append(SystemMessage(content=message))
            elif i % 2 == 0:
                history.append(AIMessage(content=message))
            else:
                history.append(HumanMessage(content=message))
        return history

    def _generate_context(self, query, character: Character) -> str:
        docs = self.db.similarity_search(query)
        docs = [d for d in docs if d.metadata['character_name'] == character.name]
        logger.info(f'Found {len(docs)} documents')

        context = '\n'.join([d.page_content for d in docs])
        return context


def get_llm():
    return OpenaiLlm.get_instance()


if __name__ == '__main__':
    import asyncio
    llm = OpenaiLlm()
    conversation_history = ConversationHistory(
        system_prompt='You are a helpful AI character.',
        user=['Hello'],
        ai=['Hello from AI'],
    )
    history = llm.build_history(conversation_history)
    print(history)

    response = asyncio.get_event_loop().run_until_complete(
        llm.achat(history, 'Hello',
                  'context: {context} \n ---\n User question: {query}', AsyncCallbackHandler()))
    print(response)
