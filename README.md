# <img src="./realtime_ai_character/static/realchar.svg" height="24px" style="padding-top:4px"/>RealChar. - Realtime AI Character
<br/>
<div align="center">
    <img src="./realtime_ai_character/static/logo.png" alt="Quivr-logo" width="80%"  style="padding: 40px"/>
</div>
<br/>
<p align="center">
  🎙️🤖<em>Create, customize and talk to your AI Character/Companion in realtime</em>🎙️🤖
</p>

<div align="center">
    <a href="https://discord.gg/e4AYNnFg2F">
    <img src="https://img.shields.io/badge/discord-join%20chat-blue.svg?style=for-the-badge" alt="Join our Discord" height="20">
    </a>
    <a href="https://twitter.com/agishaun">
    <img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/agishaun?style=for-the-badge" height="20">
    <a href="https://github.com/Shaunwei/RealChar">
    <img alt="GitHub" src="https://img.shields.io/github/stars/Shaunwei/RealChar?style=for-the-badge" height="20">
    </a>
    <a href="https://github.com/Shaunwei/RealChar/blob/main/README.md" target="_blank">
    <img src="https://img.shields.io/static/v1?label=license&message=MIT&color=green&style=for-the-badge" alt="License" height="20">
    </a>
    <a href="https://hub.docker.com/repository/docker/shaunly/real_char/general" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/shaunly/real_char?style=for-the-badge"  height="20">
    </a>
</div>

## ✨ Demo
For the best demo experience,  try [our site](link) directly
[Demo Video](link)

## 🎯 Key Features
- **Easy to use**: No coding required to create your own AI character. All in one codebase.
- **Customizable**: You can customize your AI character's personality, background, and even voice
- **Realtime**: Talk to or message your AI character in realtime
- **Companion**: Your AI character can be your companion, friend, or even your lover
- **Multi-Platform**: You can talk to your AI character on web, terminal and mobile(we also open source our mobile app)
- **Most up-to-date AI**: We use the most up-to-date AI technology to power your AI character, including OpenAI, Anthropic Claude 2, Chroma, Whisper, ElevenLabs, etc.
- **Modular**: You can easily swap out different modules to customize your flow. Less opinionated, more flexible.

## 🔬 Tech stack
- **Frontend**: Vinilla JS, WebSockets
- **Backend**: FastAPI, SQLite, Alembic, Docker
- **Data Ingession**: LlamaIndex, Chroma
- **LLM Orchestration**: LangChain, Chroma
- **LLM**: OpenAI GPT3.5/4, Anthropic Claude 2
- **Speech to Text**: Local Whisper, OpenAI Whisper API, Google Speech to Text API
- **Text to Speech**: ElevenLabs API
- **Voice Clone**: ElevenLabs API

## 📚 Character Catalog


## 👨‍🚀 Prerequisites

Before you begin setting up this project, please ensure you have completed the following tasks:

### 1. Prepare LLM -  OpenAI API Token
<details><summary>click me</summary>
This application utilizes the OpenAI API to access its powerful language model capabilities. In order to use the OpenAI API, you will need to obtain an API token.

To get your OpenAI API token, follow these steps:

1. Go to the [OpenAI website](https://beta.openai.com/signup/) and sign up for an account if you haven't already.
2. Once you're logged in, navigate to the [API keys page](https://beta.openai.com/account/api-keys).
3. Generate a new API key by clicking on the "Create API Key" button.
4. Copy the API key and store it safely.
5. Add the API key to your environment variable, e.g. `export OPENAI_API_KEY=<your API key>`
</details>

### 1.1 Prepare LLM -  Anthropic API Token

### 2.(Optional) Prepare Speech to Text - Google Cloud API

### 3. Prepare Text to Speech - ElevenLabs API Key
<details><summary>click me</summary>
1. Creating an ElevenLabs Account
Visit [ElevenLabs](https://beta.elevenlabs.io/) to create an account. You'll need this to access the speech synthesis and voice cloning features.

2. In your Profile Setting, you can get an API Key. Save it in a safe place.

3. Set API key in your .env file:
```
XI_API_KEY=<api key>
```
</details>


## Installation via Python
1. Clone the repo
   ```sh
   git clone
    ```
2. Install requirements
   - Install portaudio and ffmpeg
    ```sh
    (For Mac)
    brew install portaudio
    brew install ffmpeg
    ```
    Then install all python requirements
    ```sh
    pip install -r requirements.txt
    ```
3. Create an empty database if you have not done so before
    ```sh
    sqlite3 test.db "VACUUM;"
    ```
4. Run db upgrade
    ```sh
    alembic upgrade head
    ```
5. Setup `.env`: update API keys and select module
   ```sh
   cp .env.example .env
   ```
6. Run server
    ```sh
    uvicorn realtime_ai_character.main:app --reload
    ```
7. Run client:
    - Web client: Open your web browser and navigate to http://localhost:8000
    - (Optional) Terminal client: Run the following command in your terminal
        ```sh
        python client/cli.py
        ```
8. Select one character to talk to, then start talking


## (Optional) Installation via Docker
<details><summary>click me</summary>
1. Build docker image
    ```sh
    python cli.py docker-build
    ```
2. Run docker image
    ```sh
    python cli.py docker-run
    ```
3. Go to http://localhost:8000 to start talking (note: you need https to use microphone)

If you have issues with docker (especially on a non-Linux machine), please refer to https://docs.docker.com/get-docker/ (installation) and https://docs.docker.com/desktop/troubleshoot/overview/ (troubleshooting).
</details>

## Tech Stack
Speech to Text: Whisper

Voice Clone and Sound Synthesis: ElevenLabs
