import os
from dotenv import load_dotenv
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from realtime_ai_character.logger import get_logger

load_dotenv()
logger = get_logger(__name__)

embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
if os.getenv('OPENAI_API_TYPE') == 'azure':
    embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"), deployment=os.getenv(
        "OPENAI_API_EMBEDDING_DEPLOYMENT_NAME", "text-embedding-ada-002"), chunk_size=1)


def get_chroma():
    chroma = Chroma(
        collection_name='llm',
        embedding_function=embedding,
        persist_directory='./chroma.db'
    )
    return chroma
