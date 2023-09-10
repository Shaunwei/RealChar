import os
from dotenv import load_dotenv
from langchain.vectorstores import Qdrant as LangChainQdrant
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

class Qdrant(Singleton, Database):
    def __init__(self):
        from qdrant_client import QdrantClient  

        self.db = LangChainQdrant(
            client=QdrantClient(),  
            collection_name="llm",  
            embeddings=embedding,
        )
    
    def delete_collection(self):
        # Implement logic to delete all data from the collection
        pass

    def persist(self):
        # Implement logic to save/load the data to/from disk
        pass
    
    def add_documents(self, docs):
        pass
    
    def similarity_search(self, query):
        self.db.similarity_search(query)