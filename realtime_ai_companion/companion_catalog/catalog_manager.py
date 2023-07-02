import os
from dotenv import load_dotenv
from pathlib import Path
from contextlib import ExitStack
from realtime_ai_companion.logger import get_logger
from realtime_ai_companion.utils import Singleton, Companion
from realtime_ai_companion.database.chroma import get_chroma
from llama_index import SimpleDirectoryReader
from langchain.text_splitter import CharacterTextSplitter

load_dotenv()
logger = get_logger(__name__)


class CatalogManager(Singleton):
    def __init__(self, overwrite=True):
        super().__init__()
        self.db = get_chroma()
        if overwrite:
            logger.info('Overwriting existing data in the chroma.')
            self.db.delete_collection()
            self.db = get_chroma()

        self.companions = {}
        self.load_companions(overwrite)
        if overwrite:
            logger.info('Persisting data in the chroma.')
            self.db.persist()
        logger.info(
            f"Total document load: {self.db._client.get_collection('llm').count()}")

    def get_companion(self, name) -> Companion:
        return self.companions.get(name)

    def load_companion(self, directory):
        with ExitStack() as stack:
            f_system = stack.enter_context(open(directory / 'system'))
            f_user = stack.enter_context(open(directory / 'user'))
            system_prompt = f_system.read()
            user_prompt = f_user.read()

        name = directory.stem.replace('_', ' ').title()

        self.companions[name] = Companion(
            name=name,
            llm_system_prompt=system_prompt,
            llm_user_prompt=user_prompt
        )
        return name

    def load_companions(self, overwrite):
        """
        Load companions from the companion_catalog directory. Use /data to create
        documents and add them to the chroma.

        :overwrite: if True, overwrite existing data in the chroma.
        """
        path = Path(__file__).parent
        excluded_dirs = {'__pycache__'}

        directories = [d for d in path.iterdir() if d.is_dir()
                       and d.name not in excluded_dirs]

        for directory in directories:
            companion_name = self.load_companion(directory)
            if overwrite:
                self.load_data(companion_name, directory / 'data')
                logger.info('Loaded data for companion: ' + companion_name)
        logger.info(
            f'Loaded {len(self.companions)} companions: names {list(self.companions.keys())}')

    def load_data(self, companion_name: str, data_path: str):
        loader = SimpleDirectoryReader(Path(data_path))
        documents = loader.load_data()
        text_splitter = CharacterTextSplitter(
            separator='\n',
            chunk_size=500,
            chunk_overlap=100)
        docs = text_splitter.create_documents(
            texts=[d.text for d in documents],
            metadatas=[{
                'companion_name': companion_name,
                'id': d.id_,
            } for d in documents])
        self.db.add_documents(docs)


def get_catalog_manager():
    return CatalogManager.get_instance()


if __name__ == '__main__':
    manager = CatalogManager.get_instance()
