<p align="center">
  <img src="https://pic8.58cdn.com.cn/nowater/webim/big/n_v296d1faa2a0664e26b4ad2db2b17a83f9.png" height="300" alt="AgentGPT Logo"/>
</p>
<p align="center">
  <em>🤖 enabling dynamic audio-visual interactions between humans and AI. 🤖   </em>
</p>

Realtime AI Character is a revolutionary project enabling dynamic audio-visual interactions between humans and AI. Powered by Language Learning Model (LLM), it offers instant, natural, and context-aware responses, paving the way for a new era of interactive AI experiences 🚀.

## ✨ Demo
For the best demo experience,  try [our site](link) directly :)
[Demo Video](link)

## 👨‍🚀 Getting Started

The easiest way to get started with RAC is automatic setup CLI bundled with the project.
The cli sets up the following for AgentGPT:
- 🔐 [Environment variables](link) (and API Keys)
- 🗂️ [Database](link) (Mysql)
- 🤖 [Backend](link) (FastAPI)
- 🎨 [Frontend](link) (Nextjs)





## Prerequisites

Before you begin setting up this project, please ensure you have completed the following tasks:

### 1. Prepare OpenAI API Token

This application utilizes the OpenAI API to access its powerful language model capabilities. In order to use the OpenAI API, you will need to obtain an API token.

To get your OpenAI API token, follow these steps:

1. Go to the [OpenAI website](https://beta.openai.com/signup/) and sign up for an account if you haven't already.
2. Once you're logged in, navigate to the [API keys page](https://beta.openai.com/account/api-keys).
3. Generate a new API key by clicking on the "Create API Key" button.
4. Copy the API key and store it safely.
5. Add the API key to your environment variable, e.g. `export OPENAI_API_KEY=<your API key>`

### 2. Prepare ElevenLabs API Key

1. Creating an ElevenLabs Account
Visit [ElevenLabs](https://beta.elevenlabs.io/) to create an account. You'll need this to access the speech synthesis and voice cloning features.

2. In your Profile Setting, you can get an API Key. Save it in a safe place.

3. Set API key in your .env file:
```
XI_API_KEY=<api key>
```

## Installation
1. Clone the repo
   ```sh
   git clone
    ```
2. Install requirements
    ```sh
    pip install -r requirements.txt
    ```
3. Run db upgrade
    ```sh
    alembic upgrade head
    ```
4. Run the app
    ```sh
    uvicorn realtime_ai_character.main:app --reload
    ```
5. Run client
    ```sh
    python client/client.py
    ```
6. Select one character to talk to, then start talking


## Tech Stack
Speech to Text: Whisper

Voice Clone and Sound Synthesis: ElevenLabs
