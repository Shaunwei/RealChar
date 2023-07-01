import os
from dotenv import load_dotenv
from elevenlabs import generate, play, stream, clone, save
from elevenlabs import set_api_key
import openai

load_dotenv()
# TODO: if user inputs an api key, use their api key first. otherwise, limit conversation to five rounds.
set_api_key(os.environ['ELEVEN_LABS_API'])
openai.api_key = os.environ['OPENAI_API']

class AICompanion:
    def __init__(self):
        pass

    def generate_response(self) -> str:
        input_command = input("User:")
        messages = [
            {
                "role": "system", 
                "content": "You are Raiden Shogun who limits their replies to 500 characters."
            },
        ]
        messages.append({"role": "user", "content": input_command})
        chat = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-0301", messages=messages
        )
        reply = chat.choices[0].message.content
        return reply


class Text2Audio:
    def __init__(self):
        self.voice = "GQbV9jBB6X50z0S6R2d0" #raiden shogun

    def voice_clone(self):
        voice = clone(
            name="Raiden Shogun",
            description="A powerful female",
            files=["../../training_data/1.mp3", "../../training_data/2.mp3", 
                   "../../training_data/3.mp3", "../../training_data/5.mp3", 
                   "../../training_data/5.mp3", "../../training_data/6.mp3",
                   "../../training_data/7.mp3", "../../training_data/8.mp3",
                   "../../training_data/9.mp3"],
        )
        print("voice_id: ", voice.voice_id)
        audio = generate(text="No salutations needed. My exalted status shall not be disclosed as we travel among the common folk. I acknowledge that you are a person of superior ability. Henceforth, you will be my guard. Worry not. Should any danger arise, I shall dispose of it.", voice=voice)
        self.voice = voice.voice_id
        save(audio, "raiden_shogun_demo.mp3")
        play(audio)

    def voice_design(self):
        """design the voice and replace self.voice_id with the new voice id"""
        pass

    # TODO: interface: llm.generate_response()
    def run(self) -> str:
        x = 1
        llm = AICompanion()
        while x < x + 1:
            reply = llm.generate_response()
            print("AI:" + reply)

            audio_stream = generate(
                text=reply,
                voice=self.voice,
                stream=True
            )
            stream(audio_stream)

if __name__=="__main__":
    tts = Text2Audio()
    tts.run()
    # tts.voice_clone()
