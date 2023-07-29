import os
import yaml
from dotenv import load_dotenv
from pathlib import Path
from contextlib import ExitStack
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton, Character
from realtime_ai_character.database.chroma import get_chroma
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

        self.characters = {}
        self.load_characters_from_community(overwrite)
        self.load_characters(overwrite)
        if overwrite:
            logger.info('Persisting data in the chroma.')
            self.db.persist()
        logger.info(
            f"Total document load: {self.db._client.get_collection('llm').count()}")

    def get_character(self, name) -> Character:
        return self.characters.get(name)

    def load_character(self, directory):
        with ExitStack() as stack:
            f_system = stack.enter_context(open(directory / 'system'))
            f_user = stack.enter_context(open(directory / 'user'))
            system_prompt = f_system.read()
            user_prompt = f_user.read()

        name = directory.stem.replace('_', ' ').title()
        voice_id = os.environ.get(name.split(' ')[0].upper() + '_VOICE', '')
        self.characters[name] = Character(
            character_id=directory.stem,
            name=name,
            llm_system_prompt=system_prompt,
            llm_user_prompt=user_prompt,
            voice_id=voice_id,
            source='default'
        )
        return name

    def load_characters(self, overwrite):
        """
        Load characters from the character_catalog directory. Use /data to create
        documents and add them to the chroma.

        :overwrite: if True, overwrite existing data in the chroma.
        """
        path = Path(__file__).parent
        excluded_dirs = {'__pycache__', 'archive', 'community'}

        directories = [d for d in path.iterdir() if d.is_dir()
                       and d.name not in excluded_dirs]

        for directory in directories:
            character_name = self.load_character(directory)
            if overwrite:
                self.load_data(character_name, directory / 'data')
                logger.info('Loaded data for character: ' + character_name)
        logger.info(
            f'Loaded {len(self.characters)} characters: names {list(self.characters.keys())}')

    def load_characters_from_community(self, overwrite):
        path = Path(__file__).parent / 'community'
        excluded_dirs = {'__pycache__', 'archive'}

        directories = [d for d in path.iterdir() if d.is_dir()
                       and d.name not in excluded_dirs]
        for directory in directories:
            with ExitStack() as stack:
                f_yaml = stack.enter_context(open(directory / 'config.yaml'))
                yaml_content = yaml.safe_load(f_yaml)
            character_id = yaml_content['character_id']
            character_name = yaml_content['character_name']
            self.characters[character_name] = Character(
                character_id=character_id,
                name=character_name,
                llm_system_prompt=yaml_content["system"],
                llm_user_prompt=yaml_content["user"],
                voice_id=yaml_content["voice_id"],
                source='community',
                author_name=yaml_content["author_name"],
            )
            if overwrite:
                self.load_data(character_name, directory / 'data')
                logger.info('Loaded data for character: ' + character_name)

    def load_data(self, character_name: str, data_path: str):
        loader = SimpleDirectoryReader(Path(data_path))
        documents = loader.load_data()
        text_splitter = CharacterTextSplitter(
            separator='\n',
            chunk_size=500,
            chunk_overlap=100)
        docs = text_splitter.create_documents(
            texts=[d.text for d in documents],
            metadatas=[{
                'character_name': character_name,
                'id': d.id_,
            } for d in documents])
        self.db.add_documents(docs)


def get_catalog_manager():
    return CatalogManager.get_instance()


if __name__ == '__main__':
    manager = CatalogManager.get_instance()
