import os
import queue
import asyncio
import concurrent.futures
import functools
import io
import sys
import random
from threading import Thread
import time
import re

from dotenv import load_dotenv

import pyaudio
import speech_recognition as sr
import websockets
from aioconsole import ainput  # for async input
from pydub import AudioSegment
from simpleaudio import WaveObject

load_dotenv()

executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100


class AudioPlayer:
    def __init__(self):
        self.play_thread = None
        self.stop_flag = False
        self.queue = queue.Queue()

    def play_audio(self):
        while not self.stop_flag or not self.queue.empty():
            try:
                wav_data = self.queue.get_nowait()
            except queue.Empty:
                continue

            wave_obj = WaveObject.from_wave_file(wav_data)
            play_obj = wave_obj.play()

            while play_obj.is_playing() and not self.stop_flag:
                time.sleep(0.1)

            if self.stop_flag:
                play_obj.stop()

    def start_playing(self, wav_data):
        self.stop_flag = False
        self.queue.put(wav_data)

        if self.play_thread is None or not self.play_thread.is_alive():
            self.play_thread = Thread(target=self.play_audio)
            self.play_thread.start()

    def stop_playing(self):
        if self.play_thread and self.play_thread.is_alive():
            self.stop_flag = True
            self.play_thread.join()
            self.play_thread = None

    def add_to_queue(self, wav_data):
        self.queue.put(wav_data)


audio_player = AudioPlayer()


def get_input_device_id():
    p = pyaudio.PyAudio()
    devices = [(i, p.get_device_info_by_index(i)['name'])
               for i in range(p.get_device_count())
               if p.get_device_info_by_index(i).get('maxInputChannels')]

    print('Available devices:')
    for id, name in devices:
        print(f"Device id {id} - {name}")

    return int(input('Please select device id: '))


async def handle_audio(websocket, device_id):
    with sr.Microphone(device_index=device_id, sample_rate=RATE) as source:
        recognizer = sr.Recognizer()
        print('Source sample rate: ', source.SAMPLE_RATE)
        print('Source width: ', source.SAMPLE_WIDTH)
        print('Adjusting for ambient noise...Wait for 2 seconds')
        recognizer.energy_threshold = 5000
        recognizer.dynamic_energy_ratio = 6
        recognizer.dynamic_energy_adjustment_damping = 0.85
        recognizer.non_speaking_duration = 0.5
        recognizer.pause_threshold = 0.8
        recognizer.phrase_threshold = 0.5
        recognizer.adjust_for_ambient_noise(source, duration=2)
        listen_func = functools.partial(
            recognizer.listen, source, phrase_time_limit=30)

        print('Okay, start talking!')
        while True:
            print('[*]', end="")  # indicate that we are listening
            audio = await asyncio.get_event_loop().run_in_executor(executor, listen_func)
            await websocket.send(audio.frame_data)
            print('[-]', end="")  # indicate that we are done listening
            await asyncio.sleep(2)


async def handle_text(websocket):
    print('You: ', end="", flush=True)
    while True:
        message = await ainput()
        await websocket.send(message)


async def receive_message(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.exceptions.ConnectionClosedError as e:
            print("Connection closed unexpectedly: ", e)
            break
        except Exception as e:
            print("An error occurred: ", e)
            break

        if isinstance(message, str):
            if message == '[end]\n' or re.search(r'\[end=([a-zA-Z0-9]+)\]', message):
                print('\nYou: ', end="", flush=True)
            elif message.startswith('[+]'):
                # stop playing audio
                audio_player.stop_playing()
                # indicate the transcription is done
                print(f"\n{message}", end="\n", flush=True)
            elif message.startswith('[=]') or re.search(r'\[=([a-zA-Z0-9]+)\]', message):
                # indicate the response is done
                print(f"{message}", end="\n", flush=True)
            else:
                print(f"{message}", end="", flush=True)
        elif isinstance(message, bytes):
            audio_data = io.BytesIO(message)
            audio = AudioSegment.from_mp3(audio_data)
            wav_data = io.BytesIO()
            audio.export(wav_data, format="wav")
            # Start playing audio
            audio_player.start_playing(wav_data)
        else:
            print("Unexpected message")
            break


def select_model():
    llm_model_selection = input(
        '1: gpt-3.5-turbo-16k \n'
        '2: gpt-4 \n'
        '3: claude-2 \n'
        'Select llm model:')
    if llm_model_selection == '1':
        llm_model = 'gpt-3.5-turbo-16k'
    elif llm_model_selection == '2':
        llm_model = 'gpt-4'
    elif llm_model_selection == '3':
        llm_model = 'claude-2'
    return llm_model


async def start_client(client_id, url):
    api_key = os.getenv('AUTH_API_KEY')
    llm_model = select_model()
    uri = f"ws://{url}/ws/{client_id}?api_key={api_key}&llm_model={llm_model}"
    async with websockets.connect(uri) as websocket:
        # send client platform info
        await websocket.send('terminal')
        print(f"Client #{client_id} connected to server")
        welcome_message = await websocket.recv()
        print(f"{welcome_message}")
        character = input('Select character: ')
        await websocket.send(character)

        mode = input('Select mode (1: audio, 2: text): ')
        if mode.lower() == '1':
            device_id = get_input_device_id()
            send_task = asyncio.create_task(handle_audio(websocket, device_id))
        else:
            send_task = asyncio.create_task(handle_text(websocket))

        receive_task = asyncio.create_task(receive_message(websocket))
        await asyncio.gather(receive_task, send_task)


async def main(url):
    client_id = random.randint(0, 1000000)
    task = asyncio.create_task(start_client(client_id, url))
    try:
        await task
    except KeyboardInterrupt:
        task.cancel()
        await asyncio.wait_for(task, timeout=None)
        print("Client stopped by user")


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else 'localhost:8000'
    asyncio.run(main(url))
