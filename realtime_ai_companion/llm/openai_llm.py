import os
from typing import List
from dotenv import load_dotenv
import openai
from langchain.embeddings import OpenAIEmbeddings
from langchain.callbacks.base import AsyncCallbackHandler
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import ChatOpenAI
from langchain.vectorstores import Chroma
from realtime_ai_companion.logger import get_logger
from langchain.schema import AIMessage, BaseMessage, HumanMessage, SystemMessage
from realtime_ai_companion.utils import Companion, Singleton, ConversationHistory
from realtime_ai_companion.database.chroma import get_chroma

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

logger = get_logger(__name__)
embedding = OpenAIEmbeddings()

StreamingStdOutCallbackHandler.on_chat_model_start = lambda *args, **kwargs: None


class AsyncCallbackHandler(AsyncCallbackHandler):
    def __init__(self, on_new_token=None, token_buffer=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if on_new_token is None:
            def on_new_token(token): return logger.info(f'New token: {token}')
        self.on_new_token = on_new_token
        self.token_buffer = token_buffer

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_new_token(self, token: str, *args, **kwargs):
        if self.token_buffer is not None:
            self.token_buffer.append(token)
        await self.on_new_token(token)


class AsyncCallbackAudioHandler(AsyncCallbackHandler):
    def __init__(self, text_to_speech=None, websocket=None, tts_event=None, companion_name="", *args, **kwargs):
        super().__init__(*args, **kwargs)
        if text_to_speech is None:
            def text_to_speech(token): return logger.info(
                f'New audio token: {token}')
        self.text_to_speech = text_to_speech
        self.websocket = websocket
        self.current_sentence = ""
        self.companion_name = companion_name
        self.isReply = False  # the start of the reply. i.e. the substring after '>'
        self.tts_event = tts_event

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_new_token(self, token: str, *args, **kwargs):
        if not self.isReply and token == ">":
            self.isReply = True
        elif self.isReply:
            if token != ".":
                self.current_sentence += token
            else:
                print(self.tts_event)
                await self.text_to_speech.stream(self.current_sentence, self.websocket, self.tts_event, self.companion_name)
                self.current_sentence = ""

    async def on_llm_end(self, *args, **kwargs):
        if self.current_sentence != "":
            await self.text_to_speech.stream(self.current_sentence, self.websocket, self.tts_event, self.companion_name)


class OpenaiLlm(Singleton):
    def __init__(self):
        super().__init__()

        self.chat_open_ai = ChatOpenAI(
            model='gpt-3.5-turbo-16k-0613',
            temperature=0.2,
            streaming=True
        )
        self.db = get_chroma()

    async def achat(self, history: List[BaseMessage], user_input: str, user_input_template: str, callback: AsyncCallbackHandler, audioCallback: AsyncCallbackAudioHandler, companion: Companion) -> str:
        # 1. Generate context
        context = self._generate_context(user_input, companion)

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

    def _generate_context(self, query, companion: Companion) -> str:
        docs = self.db.similarity_search(query)
        docs = [d for d in docs if d.metadata['companion_name'] == companion.name]
        logger.info(f'Found {len(docs)} documents')

        context = '\n'.join([d.page_content for d in docs])
        return context


def get_llm():
    return OpenaiLlm.get_instance()


if __name__ == '__main__':
    import asyncio
    llm = OpenaiLlm()
    conversation_history = ConversationHistory(
        system_prompt='You are a helpful AI companion.',
        user=['Hello'],
        ai=['Hello from AI'],
    )
    history = llm.build_history(conversation_history)
    print(history)

    response = asyncio.get_event_loop().run_until_complete(
        llm.achat(history, 'Hello',
                  'context: {context} \n ---\n User question: {query}', AsyncCallbackHandler()))
    print(response)
