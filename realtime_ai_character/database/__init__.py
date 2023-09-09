import os
from realtime_ai_character.database.base import Database

def get_database(db: str = None) -> Database:
    if not db:
        db = os.getenv('DATABASE_USE', 'CHROMA')
    
    if db == 'QDRANT':
        from .qdrant import Qdrant
        # Initialize if necessary
        return Qdrant().db  # Adjust with appropriate arguments

    elif db == 'CHROMA':
        from .chroma import Chroma
        # Initialize if necessary
        return Chroma().db  # Adjust with appropriate arguments

    else:
        raise NotImplementedError(f'Unknown database engine: {db}')
