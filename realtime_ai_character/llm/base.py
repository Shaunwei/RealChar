from abc import ABC, abstractmethod

from langchain.callbacks.base import AsyncCallbackHandler
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

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
    def __init__(self, text_to_speech=None, websocket=None, tts_event=None, character_name="", *args, **kwargs):
        super().__init__(*args, **kwargs)
        if text_to_speech is None:
            def text_to_speech(token): return print(
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


class LLM(ABC):
    @abstractmethod
    async def achat(self, *args, **kwargs):
        pass
