from abc import ABC, abstractmethod
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Database(ABC):
    pass
    
    