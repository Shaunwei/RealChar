from abc import ABC, abstractmethod
import asyncio

from langchain.callbacks.base import AsyncCallbackHandler
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import get_timer, timed

logger = get_logger(__name__)

timer = get_timer()

StreamingStdOutCallbackHandler.on_chat_model_start = lambda *args, **kwargs: None


class AsyncCallbackTextHandler(AsyncCallbackHandler):
    def __init__(self, on_new_token=None, token_buffer=None, on_llm_end=None, tts_event=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.on_new_token = on_new_token
        self._on_llm_end = on_llm_end
        self.token_buffer = token_buffer
        self.tts_event = tts_event

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_new_token(self, token: str, *args, **kwargs):
        if self.token_buffer is not None:
            self.token_buffer.append(token)
        if self.tts_event is not None:
            while not self.tts_event.is_set():
                await asyncio.sleep(0.01)
                await self.on_new_token(token)
        else:
            await self.on_new_token(token)

    async def on_llm_end(self, *args, **kwargs):
        if self._on_llm_end is not None:
            await self._on_llm_end(''.join(self.token_buffer))
            self.token_buffer.clear()


class AsyncCallbackAudioHandler(AsyncCallbackHandler):
    def __init__(self, text_to_speech=None, websocket=None, tts_event=None, voice_id="",
                 language="en-US", sid="", platform="", *args, **kwargs):
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
        self.twilio_stream_id = sid
        self.platform = platform
        # optimization: trade off between latency and quality for the first sentence
        self.is_first_sentence = True

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_new_token(self, token: str, *args, **kwargs):
        timer.log("LLM First Token", lambda: timer.start("LLM First Sentence"))
        # if (
        #     not self.is_reply and ">" in token
        # ):  # small models might not give ">" (e.g. llama2-7b gives ">:" as a token)
        #     self.is_reply = True
        # elif self.is_reply:
        if token not in {'.', '?', '!', '。', '？', '！'}:
            self.current_sentence += token
        else:
            if self.is_first_sentence:
                timer.log("LLM First Sentence",
                          lambda: timer.start("TTS First Sentence"))
            await self.text_to_speech.stream(
                self.current_sentence,
                self.websocket,
                self.tts_event,
                self.voice_id,
                self.is_first_sentence,
                self.language,
                self.twilio_stream_id,
                self.platform)
            self.current_sentence = ""
            if self.is_first_sentence:
                self.is_first_sentence = False
            timer.log("TTS First Sentence")

    async def on_llm_end(self, *args, **kwargs):
        if self.current_sentence != "":
            await self.text_to_speech.stream(
                self.current_sentence,
                self.websocket,
                self.tts_event,
                self.voice_id,
                self.is_first_sentence,
                self.language)


class LLM(ABC):
    @abstractmethod
    @timed
    async def achat(self, *args, **kwargs):
        pass

    @abstractmethod
    def get_config(self):
        pass
