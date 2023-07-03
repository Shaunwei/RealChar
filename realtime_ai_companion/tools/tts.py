import os
from dotenv import load_dotenv
from elevenlabs import generate, stream
from elevenlabs import set_api_key
from realtime_ai_companion.utils import Singleton


load_dotenv()
# TODO: if user inputs an api key, use their api key first. otherwise, limit conversation to five rounds.
set_api_key(os.environ['ELEVEN_LABS_API'])

class Text2Audio(Singleton):
    def __init__(self):
        super().__init__()

        self.raiden_voice = "GQbV9jBB6X50z0S6R2d0"
        self.loki_voice = "GQbV9jBB6X50z0S6R2d0"
        self.custom_voice = "GQbV9jBB6X50z0S6R2d0"
        self.default_voice = "Bella"

    async def speak(self, text: str) -> None:
        audio_stream = generate(
            text=text,
            voice=self.raiden_voice,
            stream=True
        )
        audio_bytes = b''.join(audio_stream)
        return audio_bytes

def get_tts():
    return Text2Audio.get_instance()