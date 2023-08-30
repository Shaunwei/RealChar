from dotenv import load_dotenv

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton
from realtime_ai_character.database.connection import get_db

load_dotenv()
logger = get_logger(__name__)


class MemoryManager(Singleton):
    def __init__(self):
        super().__init__()
        self.sql_db = next(get_db())

    async def process_session(self, session_id: str):
        # Not implemented.
        pass

    async def similarity_search(self, user_id: str, query: str):
        # Not implemented.
        pass


def get_memory_manager():
    return MemoryManager.get_instance()


if __name__ == '__main__':
    manager = MemoryManager.get_instance()
