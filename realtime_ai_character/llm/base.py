import asyncio
import re
from abc import ABC, abstractmethod
from typing import Callable, Coroutine, Optional

import emoji
from fastapi import WebSocket
from langchain.callbacks.base import AsyncCallbackHandler
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.schema.messages import BaseMessage

from realtime_ai_character.audio.text_to_speech.base import TextToSpeech
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Character, get_timer, timed


logger = get_logger(__name__)

timer = get_timer()

StreamingStdOutCallbackHandler.on_chat_model_start = lambda *args, **kwargs: None


class AsyncCallbackTextHandler(AsyncCallbackHandler):
    def __init__(
        self,
        on_new_token: Callable[[str], Coroutine],
        token_buffer: list[str],
        on_llm_end: Callable[[str], Coroutine],
        tts_event: Optional[asyncio.Event] = None,
        *args,
        **kwargs
    ):
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
            await self._on_llm_end("".join(self.token_buffer))
            self.token_buffer.clear()


class AsyncCallbackAudioHandler(AsyncCallbackHandler):
    def __init__(
        self,
        text_to_speech: TextToSpeech,
        websocket: WebSocket,
        tts_event: asyncio.Event,
        voice_id: str = "",
        language: str = "en-US",
        sid: str = "",
        platform: str = "",
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
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
        self.sentence_idx = 0

    async def on_chat_model_start(self, *args, **kwargs):
        pass

    async def on_llm_new_token(self, token: str, *args, **kwargs):
        timer.log("LLM First Token", lambda: timer.start("LLM First Sentence"))
        # skip emojis
        token = emoji.replace_emoji(token, "")
        token = self.text_regulator(token)
        if not token:
            return
        for char in token:
            await self._on_llm_new_character(char)

    async def _on_llm_new_character(self, char: str):
        # send to TTS in sentences
        punctuation = False
        if (
            # English punctuations
            (
                char == " "
                and self.current_sentence != ""
                and self.current_sentence[-1] in {".", "?", "!"}
            )
            # Chinese/Japanese/Korean punctuations
            or (char in {"。", "？", "！"})
            # newline
            or (char in {"\n", "\r", "\t"})
        ):
            punctuation = True

        self.current_sentence += char

        if punctuation and self.current_sentence.strip():
            first_sentence = self.sentence_idx == 0
            if first_sentence:
                timer.log("LLM First Sentence", lambda: timer.start("TTS First Sentence"))
            await self.text_to_speech.stream(
                text=self.current_sentence.strip(),
                websocket=self.websocket,
                tts_event=self.tts_event,
                voice_id=self.voice_id,
                first_sentence=first_sentence,
                language=self.language,
                sid=self.twilio_stream_id,
                platform=self.platform,
                priority=self.sentence_idx,
            )
            self.current_sentence = ""
            timer.log("TTS First Sentence")
            self.sentence_idx += 1

    async def on_llm_end(self, *args, **kwargs):
        first_sentence = self.sentence_idx == 0
        if self.current_sentence.strip():
            await self.text_to_speech.stream(
                text=self.current_sentence.strip(),
                websocket=self.websocket,
                tts_event=self.tts_event,
                voice_id=self.voice_id,
                first_sentence=first_sentence,
                language=self.language,
                priority=self.sentence_idx,
            )

    def text_regulator(self, text):
        pattern = (
            r"[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD\u2060\uFFFC\uFFFD]"  # Format characters
            r"|[\uFE00-\uFE0F]"  # Variation selectors
            r"|[\uE000-\uF8FF]"  # Private use area
            r"|[\uFFF0-\uFFFF]"  # Specials
        )
        filtered_text = re.sub(pattern, "", text)
        return filtered_text


class LLM(ABC):
    @abstractmethod
    @timed
    async def achat(
        self,
        history: list[BaseMessage],
        user_input: str,
        user_id: str,
        character: Character,
        callback: AsyncCallbackTextHandler,
        audioCallback: Optional[AsyncCallbackAudioHandler] = None,
        metadata: Optional[dict] = None,
        *args,
        **kwargs
    ):
        pass

    @abstractmethod
    def get_config(self):
        pass
