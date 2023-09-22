import os
from dotenv import load_dotenv
from langchain.vectorstores import Chroma as LangChainChroma
from langchain.embeddings import OpenAIEmbeddings
from realtime_ai_character.logger import get_logger
from .base import Database
from realtime_ai_character.singleton import Singleton

load_dotenv()
logger = get_logger(__name__)

embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
if os.getenv('OPENAI_API_TYPE') == 'azure':
    embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"), deployment=os.getenv(
        "OPENAI_API_EMBEDDING_DEPLOYMENT_NAME", "text-embedding-ada-002"), chunk_size=1)

class Chroma(Singleton, Database):
    def __init__(self):
        super().__init__()
        self.db = LangChainChroma(
            collection_name='llm',
            embedding_function=embedding,
            persist_directory='./chroma.db'
        )
        print("There are", self.db._collection.count(), "in the collection")
    
    def delete_collection(self):
        self.db._client.delete_collection('llm')

    def persist(self):
        self.db.persist()
    
    def add_documents(self, docs):
        self.db.add_documents(docs)

    def similarity_search(self, query):
        return self.db.similarity_search(query)