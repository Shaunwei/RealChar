# GPTinterviewer
Practice your interview skills with GPT interviewer


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
    uvicorn app.main:app --reload
    ```
5. Run client
    ```sh
    python client.py
    ```
    