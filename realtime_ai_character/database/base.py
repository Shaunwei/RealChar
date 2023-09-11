from abc import ABC, abstractmethod
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Database(ABC):
    @abstractmethod
    def delete_collection(self):
        pass

    @abstractmethod
    def persist(self):
        pass
    
    @abstractmethod
    def add_documents(self, docs):
        pass
    
    @abstractmethod
    def similarity_search(self, query):
        pass
    