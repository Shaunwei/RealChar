import os
from abc import ABC, abstractmethod
import requests
import multion
import asyncio

from langchain.callbacks.base import AsyncCallbackHandler
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.utilities import GoogleSerperAPIWrapper, SerpAPIWrapper, GoogleSearchAPIWrapper

from realtime_ai_character.logger import get_logger

logger = get_logger(__name__)

StreamingStdOutCallbackHandler.on_chat_model_start = lambda *args, **kwargs: None


class AsyncCallbackTextHandler(AsyncCallbackHandler):
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
    def __init__(self, text_to_speech=None, websocket=None, tts_event=None, voice_id="",
                 language="en-US", *args, **kwargs):
        super().__init__(*args, **kwargs)
        if text_to_speech is None:
            def text_to_speech(token): return print(
                f'New audio token: {token}')
        self.text_to_speech = text_to_speech
        self.websocket = websocket
        self.current_sentence = ""
        self.voice_id = voice_id
        self.language = language
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
            if token not in {'.', '?', '!'}:
                self.current_sentence += token
            else:
                await self.text_to_speech.stream(
                    self.current_sentence,
                    self.websocket,
                    self.tts_event,
                    self.voice_id,
                    self.is_first_sentence,
                    self.language)
                self.current_sentence = ""
                if self.is_first_sentence:
                    self.is_first_sentence = False

    async def on_llm_end(self, *args, **kwargs):
        if self.current_sentence != "":
            await self.text_to_speech.stream(
                self.current_sentence,
                self.websocket,
                self.tts_event,
                self.voice_id,
                self.is_first_sentence,
                self.language)

class SearchAgent:

    def __init__(self):
        self.search_wrapper = None
        if os.getenv('SERPER_API_KEY'):
            self.search_wrapper = GoogleSerperAPIWrapper()
        elif os.getenv('SERPAPI_API_KEY'):
            self.search_wrapper = SerpAPIWrapper()
        elif os.getenv('GOOGLE_API_KEY') and os.getenv('GOOGLE_CSE_ID'):
            self.search_wrapper = GoogleSearchAPIWrapper()
    
    def search(self, query: str) -> str:
        if self.search_wrapper is None:
            logger.warning('Search is not enabled, please set SERPER_API_KEY to enable it.')
        else:
            try:
                search_result: str = self.search_wrapper.run(query)
                search_context = '\n'.join([
                    '---',
                    'Internet search result:',
                    '---',
                    'Question: ' + query,
                    'Search Result: ' + search_result,
                ])
                logger.info(f'Search result: {search_context}')
                # Append to context
                return '\n' + search_context
            except Exception as e:
                logger.error(f'Error when searching: {e}')
        return ''

class QuivrAgent:

    def __init__(self):
        pass

    def question(self, query: str, apiKey: str, brainId: str) -> str:
        try:
            url = f"https://api.quivr.app/brains/{brainId}/question_context"
            headers = {"Authorization": f"Bearer {apiKey}"}
            data = {
                "question": query,
            }

            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            quivr_result = response.json()["context"]

            quivr_context = '\n'.join([
                '---',
                'Second brain result:',
                '---',
                'Question: ' + query,
                'Query Result: ' + quivr_result,
            ])
            logger.info(f'Quvir query result: {quivr_context}')
            # Append to context
            return '\n' + quivr_context
        except Exception as e:
            logger.error(f'Error when querying quivr: {e}')
        return ''

class MultiOnAgent:
    def __init__(self):
        self.init = False

    async def action(self, query: str) -> str:
        if not self.init:
            logger.info("Initializing multion agent...")
            multion.login()
            self.init = True
        try:
            await asyncio.wait_for(asyncio.to_thread(multion.new_session, {"input": query}),
                                   timeout=30)
            return ("This query has been handled by a MutliOn agent successfully. "
                    "The result has been delivered to the user. Do not try to complete this "
                    "request. Instead, inform user about the successful execution.")
        except Exception as e:
            logger.error(f'Error when querying multion: {e}')
            return ("The query was attempted by a MutliOn agent, but failed. Inform user about "
                    "this failure.")

class LLM(ABC):
    @abstractmethod
    async def achat(self, *args, **kwargs):
        pass

    @abstractmethod
    def get_config(self):
        pass
