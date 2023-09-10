import os
from realtime_ai_character.database.base import Database
from .qdrant import Qdrant
from .chroma import Chroma
def get_database(db: str = None) -> Database:
    if not db:
        db = os.getenv('DATABASE_USE', 'CHROMA')
    
    if db == 'QDRANT':
        # Initialize if necessary
        return Qdrant()  # Adjust with appropriate arguments

    elif db == 'CHROMA':  
        # Initialize if necessary
        return Chroma()  # Adjust with appropriate arguments

    else:
        raise NotImplementedError(f'Unknown database engine: {db}')

