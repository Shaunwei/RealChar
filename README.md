# <img src="./realtime_ai_character/static/realchar.svg" height="24px" style="padding-top:4px"/>RealChar. - Your Realtime AI Character
<br/>
<div align="center">
    <img src="./realtime_ai_character/static/logo.png" alt="RealChar-logo" width="80%"  style="padding: 40px"/>
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
    <img alt="GitHub" src="https://img.shields.io/github/stars/Shaunwei/RealChar?style=for-the-badge&color=gold" height="20">
    </a>
    <a href="https://github.com/Shaunwei/RealChar/commits/main">
    <img alt="GitHub" src="https://img.shields.io/github/last-commit/Shaunwei/RealChar/main?style=for-the-badge" height="20">
    </a>
    <a href="https://github.com/Shaunwei/RealChar/blob/main/README.md" target="_blank">
    <img src="https://img.shields.io/static/v1?label=license&message=MIT&color=green&style=for-the-badge" alt="License" height="20">
    </a>
    <a href="https://hub.docker.com/repository/docker/shaunly/real_char/general" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/shaunly/real_char?style=for-the-badge"  height="20">
    </a>
</div>

## ✨ Demo
Try our site at [RealChar.ai](https://realchar.ai/)

(We are also beta-testing our iOS mobile app📱! Sign up [here](https://testflight.apple.com/join/JA6p9sZQ))

### Demo 1 - with AI Elon about cage fight!

https://github.com/Shaunwei/RealChar/assets/5101573/5de0b023-6cf3-4947-84cb-596f429d109e

### Demo 2 - with AI Raiden about AI and "real" memory

https://github.com/Shaunwei/RealChar/assets/5101573/62a1f3d1-1166-4254-9119-97647be52c42



__Demo settings: Web, GPT4, ElevenLabs with voice clone, Chroma, Google Speech to Text__

## 🎯 Key Features
- **Easy to use**: No coding required to create your own AI character.
- **Customizable**: You can customize your AI character's personality, background, and even voice
- **Realtime**: Talk to or message your AI character in realtime
- **Multi-Platform**: You can talk to your AI character on web, terminal and mobile(Yes. we open source our mobile app)
- **Most up-to-date AI**: We use the most up-to-date AI technology to power your AI character, including OpenAI, Anthropic Claude 2, Chroma, Whisper, ElevenLabs, etc.
- **Modular**: You can easily swap out different modules to customize your flow. Less opinionated, more flexible. Great project to start your AI Engineering journey.

## 🔬 Tech stack
<div align="center">
    <img src="https://storage.googleapis.com/assistly/static/realchar/techstack.png" alt="RealChar-tech-stack" width="100%"  style="padding: 20px"/>
</div>

- ✅**Web**: [Vanilla JS](http://vanilla-js.com/), [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- ✅**Mobile**: [Swift](https://developer.apple.com/swift/), [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- ✅**Backend**: [FastAPI](https://fastapi.tiangolo.com/), [SQLite](https://www.sqlite.org/index.html), [Docker](https://www.docker.com/)
- ✅**Data Ingestion**: [LlamaIndex](https://www.llamaindex.ai/), [Chroma](https://www.trychroma.com/)
- ✅**LLM Orchestration**: [LangChain](https://langchain.com/), [Chroma](https://www.trychroma.com/)
- ✅**LLM**: [OpenAI GPT3.5/4](https://platform.openai.com/docs/api-reference/chat), [Anthropic Claude 2](https://docs.anthropic.com/claude/docs/getting-started-with-claude)
- ✅**Speech to Text**: [Local Whisper](https://github.com/openai/whisper), [OpenAI Whisper API](https://platform.openai.com/docs/api-reference/audio), [Google Speech to Text](https://cloud.google.com/speech-to-text/docs#docs)
- ✅**Text to Speech**: [ElevenLabs](https://beta.elevenlabs.io/)
- ✅**Voice Clone**: [ElevenLabs](https://beta.elevenlabs.io/voice-lab)

## 📚 Comparison with existing products
<div align="center">
    <img src="https://storage.googleapis.com/assistly/static/realchar/compare.png">
</div>


## 👨‍🚀 Prerequisites

Before you begin setting up this project, please ensure you have completed the following tasks:

### 0. Setup Tutorial

- [Tutorial - YouTuBe](https://www.youtube.com/watch?v=Q16ZH3kJWxw)

### 1. LLM -  OpenAI API Token
<details><summary>👇click me</summary>
This application utilizes the OpenAI API to access its powerful language model capabilities. In order to use the OpenAI API, you will need to obtain an API token.

To get your OpenAI API token, follow these steps:

1. Go to the [OpenAI website](https://beta.openai.com/signup/) and sign up for an account if you haven't already.
2. Once you're logged in, navigate to the [API keys page](https://beta.openai.com/account/api-keys).
3. Generate a new API key by clicking on the "Create API Key" button.
4. Copy the API key and store it safely.
5. Add the API key to your environment variable, e.g. `export OPENAI_API_KEY=<your API key>`

(Optional) To use Azure OpenAI API instead, refer to the following section:

1. Set API type
`export OPENAI_API_TYPE=azure`

If you want to use the earlier version `2023-03-15-preview`:

`export OPENAI_API_VERSION=2023-03-15-preview`

2. To set the base URL for your Azure OpenAI resource.
You can find this in the Azure portal under your Azure OpenAI resource.

`export OPENAI_API_BASE=https://your-base-url.openai.azure.com`

3. To set the OpenAI model deployment name for your Azure OpenAI resource.

`export OPENAI_API_MODEL_DEPLOYMENT_NAME=gpt-35-turbo-16k`

4. To set the OpenAIEmbeddings model deployment name for your Azure OpenAI resource.

`export OPENAI_API_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002`

</details>

### 1.1 (Optional) Prepare LLM -  Anthropic(Claude 2) API Token
<details><summary>👇click me</summary>

To get your Anthropic API token, follow these steps:

1. Go to the [Anthropic website](https://docs.anthropic.com/claude/docs/getting-started-with-claude) and sign up for an account if you haven't already.
2. Once you're logged in, navigate to the [API keys page](https://console.anthropic.com/account/keys).
3. Generate a new API key by clicking on the "Create Key" button.
4. Copy the API key and store it safely.
5. Add the API key to your environment variable, e.g. `export ANTHROPIC_API_KEY=<your API key>`
</details>

### 2. (Optional) Prepare Speech to Text - Google Cloud API
<details><summary>👇click me</summary>

To get your Google Cloud API credentials.json, follow these steps:

1. Go to the [GCP website](https://cloud.google.com/speech-to-text/docs/before-you-begin) and sign up for an account if you haven't already.
2. Follow the guide to create a project and enable Speech to Text API
3. Put `google_credentials.json` in the root folder of this project. Check [GCP website](https://cloud.google.com/speech-to-text/docs/before-you-begin#set_your_authentication_environment_variable)
4. Change `SPEECH_TO_TEXT_USE` to use `GOOGLE` in your `.env` file
</details>


### 3. Prepare Text to Speech - ElevenLabs API Key
<details><summary>👇click me</summary>
1. Creating an ElevenLabs Account
Visit [ElevenLabs](https://beta.elevenlabs.io/) to create an account. You'll need this to access the text to speech and voice cloning features.

2. In your Profile Setting, you can get an API Key. Save it in a safe place.

3. Set API key in your .env file:
```
ELEVEN_LABS_API_KEY=<api key>
```
</details>

## 💿 Installation via Python
- **Step 1**. Clone the repo
   ```sh
   git clone https://github.com/Shaunwei/RealChar.git && cd RealChar
    ```
- **Step 2**. Install requirements
    - Install [portaudio](https://people.csail.mit.edu/hubert/pyaudio/) and [ffmpeg](https://ffmpeg.org/download.html) for audio
    ```sh
    # for mac
    brew install portaudio
    brew install ffmpeg
    ```
    ```sh
    # for ubuntu
    sudo apt update
    sudo apt install portaudio19-dev
    sudo apt install ffmpeg
    ```
    - Then install all python requirements
    ```sh
    pip install -r requirements.txt
    ```
- **Step 3**. Create an empty [sqlite](https://www.sqlite.org/index.html) database if you have not done so before
    ```sh
    sqlite3 test.db "VACUUM;"
    ```
- **Step 4**. Run db upgrade
    ```sh
    alembic upgrade head
    ```
    This ensures your database schema is up to date. Please run this after every time you pull the main branch.
- **Step 5**. Setup `.env`: update API keys and select module
   ```sh
   cp .env.example .env
   ```
- **Step 6**. Run server with `cli.py` or use uvicorn directly
    ```sh
    python cli.py run-uvicorn
    # or
    uvicorn realtime_ai_character.main:app
    ```
- **Step 7**. Run client:
    - Use **GPT4** for better conversation and **Wear headphone** for best audio(avoid echo)
    - There are two ways to access the web client:
        - **Option 1**: Open your web browser and navigate to http://localhost:8000 (NOT 0.0.0.0:8000)
        - **Option 2**: Running the client in React.
            ```sh
            cd client/web
            npm install
            npm start
            ```
            After running these commands, a local development server will start, and your default web browser will open a new tab/window pointing to this server (usually http://localhost:3000).
    - (Optional) Terminal client: Run the following command in your terminal
    ```sh
    python client/cli.py
    ```
    - (Optional) mobile client: open `client/mobile/ios/rac/rac.xcodeproj/project.pbxproj` in Xcode and run the app
- **Step 8**. Select one character to talk to, then start talking


## (Optional) 📀 Installation via Docker
<details><summary>👇click me</summary>

1. Docker image: you can use our docker image directly (if you are not using Apple M1/M2 CPUs)
    ```sh
    docker pull shaunly/real_char:latest
    docker tag shaunly/real_char:latest realtime-ai-character
    ```
    (Or you want build yourself) Build docker image
    ```sh
    python cli.py docker-build
    ```
    If you have issues with docker (especially on a non-Linux machine), please refer to https://docs.docker.com/get-docker/ (installation) and https://docs.docker.com/desktop/troubleshoot/overview/ (troubleshooting).
2. Run docker image with `.env` file
    ```sh
    python cli.py docker-run
    ```

3. Go to http://localhost:8000 (NOT 0.0.0.0:8000) to start talking or use terminal    client
    ```sh
    python client/cli.py
    ```

</details>

<br/>

## 🆕! LangSmith integration
<details><summary>👇click me</summary>

If you have access to LangSmith, you can edit these environment variables to enable:
```
LANGCHAIN_TRACING_V2=false # default off
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=YOUR_LANGCHAIN_API_KEY
LANGCHAIN_PROJECT=YOUR_LANGCHAIN_PROJECT
```
And it should work out of the box.

</details>

<br/>

## 📍 Roadmap
- [x] Launch v0.0.1 and build a community
- [x] Move away from Vanilla JS
- [x] Launch mobile app (iOS TestFlight Beta link: https://testflight.apple.com/join/JA6p9sZQ)
- [x] Add authentication for customization
- [x] Allow selecting different LLM
- [x] Add ability to add community characters

## 🫶 Contribute to RealChar
Please check out our [Contribution Guide](contribute.md)!

## 💪 Contributors
<a href="https://github.com/Shaunwei/RealChar">
  <img src="https://contrib.rocks/image?repo=Shaunwei/RealChar" />
</a>

## 🎲 Community
- Join us on [Discord](https://discord.gg/e4AYNnFg2F)
