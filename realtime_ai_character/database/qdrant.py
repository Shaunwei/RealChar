import os
from dotenv import load_dotenv
from langchain.embeddings import OpenAIEmbeddings
from realtime_ai_character.logger import get_logger
from .base import Database
from realtime_ai_character.singleton import Singleton
from qdrant_client.http.models import Distance, VectorParams, Batch
from qdrant_client import QdrantClient 
from realtime_ai_character.utils import Character

load_dotenv()
logger = get_logger(__name__)

embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
if os.getenv('OPENAI_API_TYPE') == 'azure':
    embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"), deployment=os.getenv(
        "OPENAI_API_EMBEDDING_DEPLOYMENT_NAME", "text-embedding-ada-002"), chunk_size=1)

class Qdrant(Singleton, Database):
    def __init__(self):
        super().__init__()
        self.db = QdrantClient(location=":memory:")
        my_collection = "llm"
        llm = self.db.recreate_collection(
            collection_name=my_collection,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )
        print(llm)
        collection_info = self.db.get_collection(collection_name="llm")
        list(collection_info)
    
    def delete_collection(self):
        return self.db.delete_collection(collection_name="llm")

    def persist(self):
        pass
    
    def add_documents(self, docs):
        batch_size = 1536
        num_batches = len(docs) // batch_size + (1 if len(docs) % batch_size != 0 else 0)
    
        for i in range(num_batches):
            # Extract the current batch of docs
            start_idx = i * batch_size
            end_idx = min((i + 1) * batch_size, len(docs))
            batch_docs = docs[start_idx:end_idx]
            
            # Extracting ids, vectors, and payloads from the batched docs
            ids = [doc.metadata['id'] for doc in batch_docs]
            
            # Convert texts to vectors using the retriever
            vectors = [embedding.embed_query(doc.page_content) for doc in batch_docs]
            
            # Extracting payloads based on the metadata
            payloads = [doc for doc in batch_docs]
            
            # Upsert the current batch to Qdrant
            self.db.upsert(
                collection_name="llm",
                points=Batch(ids=ids, vectors=vectors, payloads=payloads),
            )

    def similarity_search(self, query):
        embedded_query = embedding.embed_query(query)
        result = self.db.search(
            collection_name="llm",
            query_vector=embedded_query
        )
        return result
    
    def generate_context(self, docs, character: Character) -> str:
        docs = [d for d in docs if d.payload["metadata"]['character_name'] == character.name]
        logger.info(f'Found {len(docs)} documents')
        context = '\n'.join([d.payload["page_content"] for d in docs])
        return context