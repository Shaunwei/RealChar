import os
from dotenv import load_dotenv
from bentoml.client import Client
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.embeddings.base import Embeddings
from realtime_ai_character.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


class BentoEmbeddings(Embeddings):
    def __init__(self, embedding_svc_client: Client):
        self.client = embedding_svc_client

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.client.encode(texts).tolist()

    def embed_query(self, text: str) -> list[float]:
        return self.client.encode([text]).tolist()[0]


embedding_endpoint = os.getenv("BENTOML_EMBEDDING_ENDPOINT")

if embedding_endpoint:
    # Use self-hosted embedding model via BentoML API endpoint
    client = Client.from_url(embedding_endpoint)
    embedding_func = BentoEmbeddings(client)
else:
    embedding_func = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
    if os.getenv('OPENAI_API_TYPE') == 'azure':
        embedding_func = OpenAIEmbeddings(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            deployment=os.getenv(
                "OPENAI_API_EMBEDDING_DEPLOYMENT_NAME", "text-embedding-ada-002"
            ),
            chunk_size=1)


def get_chroma():
    chroma = Chroma(
        collection_name='llm',
        embedding_function=embedding_func,
        persist_directory='./chroma.db'
    )
    return chroma
