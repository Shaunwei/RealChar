import os
from realtime_ai_character.database.base import Database

def get_database(db: str = None) -> Database:
    if not db:
        db = os.getenv('DATABASE_USE', 'QDRANT')
    
    if db == 'QDRANT':
        from realtime_ai_character.database.qdrant import Qdrant
        Qdrant.initialize()  # Adjust with appropriate arguments if necessary
        return Qdrant.get_instance()

    elif db == 'CHROMA':  
        from realtime_ai_character.database.chroma import Chroma
        Chroma.initialize()  # Adjust with appropriate arguments if necessary
        return Chroma.get_instance()

    else:
        raise NotImplementedError(f'Unknown database engine: {db}')
