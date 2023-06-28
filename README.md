# Realtime AI Companion
Realtime AI Companion is a revolutionary project enabling dynamic audio-visual interactions between humans and AI. Powered by Language Learning Model (LLM), it offers instant, natural, and context-aware responses, paving the way for a new era of interactive AI experiences.

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
    uvicorn gpt_interviewer.main:app --reload
    ```
5. Run client
    ```sh
    python client.py
    ```
