import os
import datetime
import uuid
from dotenv import load_dotenv

from realtime_ai_character.utils import ConversationHistory
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.llm.memory_generator import generate_memory
from realtime_ai_character.models.memory import Memory
from langchain.embeddings import OpenAIEmbeddings

load_dotenv()
logger = get_logger(__name__)


class MemoryManager(Singleton):
    def __init__(self):
        super().__init__()
        self.sql_db = next(get_db())
        self.embedding = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))


    async def process_session(self, user_id: str, session_id: str, 
                              conversation_history: ConversationHistory):
        if user_id is None or user_id == session_id:
            return

        generated_memory = await generate_memory(conversation_history)
        if generated_memory.lower() == 'no info':
            return

        # Insert memory into database
        memory = Memory()
        memory.memory_id = str(uuid.uuid4().hex)
        memory.user_id = user_id
        memory.source_session_id = session_id
        memory.content = generated_memory
        timestamp = datetime.datetime.now()
        memory.created_at = timestamp
        memory.updated_at = timestamp
        if 'postgres' in os.environ.get('DATABASE_URL'):
            embedding_result = await self.embedding.aembed_query(generated_memory)
            memory.embedding = embedding_result
        memory.save(self.sql_db)
        logger.info(f"Memory generated for user {user_id} and session {session_id}.")


def get_memory_manager():
    return MemoryManager.get_instance()


if __name__ == '__main__':
    manager = MemoryManager.get_instance()
