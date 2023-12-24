import os
from dotenv import load_dotenv
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from realtime_ai_character.logger import get_logger

load_dotenv()
logger = get_logger(__name__)

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    embedding = None
elif os.getenv("OPENAI_API_TYPE") == 'azure':
    embedding = OpenAIEmbeddings(openai_api_key=openai_api_key, deployment=os.getenv(
        "OPENAI_API_EMBEDDING_DEPLOYMENT_NAME", "text-embedding-ada-002"), chunk_size=1)
else:
    embedding = OpenAIEmbeddings(openai_api_key=openai_api_key)


def get_chroma():
    if not embedding:
        raise Exception("OPENAI_API_KEY is required to generate embeddings")

    chroma = Chroma(
        collection_name='llm',
        embedding_function=embedding,
        persist_directory='./chroma.db'
    )
    return chroma
