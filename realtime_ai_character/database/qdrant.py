import os
from dotenv import load_dotenv
from langchain.embeddings import OpenAIEmbeddings
from realtime_ai_character.logger import get_logger
from .base import Database
from realtime_ai_character.singleton import Singleton
from qdrant_client.http.models import Distance, VectorParams, Batch
from qdrant_client import QdrantClient 
from realtime_ai_character.utils import Character
from itertools import islice
import uuid

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
        texts = [doc.page_content for doc in docs]
        metadatas = [doc.metadata for doc in docs]
        return self._add_texts(texts, metadatas)
    
    def _add_texts(self, texts, metadatas=None, ids=None, batch_size=64, **kwargs):
        added_ids = []
        for batch_ids, points in self._generate_rest_batches(texts, metadatas, ids, batch_size):
            self.db.upsert(collection_name="llm", points=Batch(ids=batch_ids, vectors=[p.vector for p in points], payloads=[p.payload for p in points]), **kwargs)
            added_ids.extend(batch_ids)
        return added_ids

    def _generate_rest_batches(self, texts, metadatas=None, ids=None, batch_size=64):
        from qdrant_client.http import models as rest

        texts_iterator = iter(texts)
        metadatas_iterator = iter(metadatas or [])
        ids_iterator = iter(ids or [uuid.uuid4().hex for _ in iter(texts)])
        while (batch_texts := list(islice(texts_iterator, batch_size))):
            batch_metadatas = list(islice(metadatas_iterator, batch_size)) or None
            batch_ids = list(islice(ids_iterator, batch_size))
            batch_embeddings = [embedding.embed_query(text) for text in batch_texts]
            points = [
                rest.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=self._build_payloads(text, metadata)
                )
                for point_id, vector, text, metadata in zip(batch_ids, batch_embeddings, batch_texts, batch_metadatas or [None] * len(batch_texts))
            ]
            yield batch_ids, points

    def _build_payloads(self, text, metadata):
        if text is None:
            raise ValueError("Text is None. Please ensure all texts are valid.")
        return {
            "page_content": text,
            "metadata": metadata
        }

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