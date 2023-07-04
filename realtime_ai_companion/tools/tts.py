import httpx
import os
from dotenv import load_dotenv
from elevenlabs import generate
from elevenlabs import set_api_key
from realtime_ai_companion.utils import Singleton

load_dotenv()
set_api_key(os.environ['ELEVEN_LABS_API'])

class Text2Audio(Singleton):
    def __init__(self):
        super().__init__()
        self.raiden_voice = "GQbV9jBB6X50z0S6R2d0"
        self.loki_voice = "GQbV9jBB6X50z0S6R2d0"
        self.custom_voice = "GQbV9jBB6X50z0S6R2d0"
        self.default_voice = "Bella"

    # def speak(self, text: str) -> None:
    #     audio_stream = generate(
    #         text=text,
    #         voice=self.raiden_voice,
    #         stream=True
    #     )
    #     audio_bytes = b''.join(audio_stream)
    #     return audio_bytes

    async def stream(self, text: str, websocket) -> None:
        CHUNK_SIZE = 1024
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.raiden_voice}/stream"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": os.environ['ELEVEN_LABS_API']
        }

        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)

            # Start sending audio type socket
            await websocket.send_text("type:audio")

            # Stream audio to client
            async for chunk in response.aiter_bytes():
                await websocket.send_bytes(chunk)


def get_tts():
    return Text2Audio.get_instance()
