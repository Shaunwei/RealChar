import os
import threading
import yaml
from pathlib import Path
from contextlib import ExitStack

from dotenv import load_dotenv
from firebase_admin import auth
from llama_index import SimpleDirectoryReader
from langchain.text_splitter import CharacterTextSplitter

from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Singleton, Character
from realtime_ai_character.database.chroma import get_chroma
from readerwriterlock import rwlock
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.models.character import Character as CharacterModel

load_dotenv()
logger = get_logger(__name__)


class CatalogManager(Singleton):
    def __init__(self, overwrite=True):
        super().__init__()
        self.db = get_chroma()
        self.sql_db = next(get_db())
        self.sql_load_interval = 30
        self.sql_load_lock = rwlock.RWLockFair()

        if overwrite:
            logger.info('Overwriting existing data in the chroma.')
            self.db.delete_collection()
            self.db = get_chroma()

        self.characters = {}
        self.load_characters_from_community(overwrite)
        self.load_characters(overwrite)
        self.load_character_from_sql_database()
        if overwrite:
            logger.info('Persisting data in the chroma.')
            self.db.persist()
        logger.info(
            f"Total document load: {self.db._client.get_collection('llm').count()}")
        self.load_sql_db_lopp()

    def load_sql_db_lopp(self):
        self.load_sql_db_thread = threading.Timer(self.sql_load_interval, self.load_sql_db_lopp)
        self.load_sql_db_thread.daemon = True
        self.load_sql_db_thread.start()
        self.load_character_from_sql_database()

    def get_character(self, name) -> Character:
        with self.sql_load_lock.gen_rlock():
            return self.characters.get(name)

    def load_character(self, directory):
        with ExitStack() as stack:
            f_yaml = stack.enter_context(open(directory / 'config.yaml'))
            yaml_content = yaml.safe_load(f_yaml)

        character_id = yaml_content['character_id']
        character_name = yaml_content['character_name']
        voice_id = yaml_content['voice_id']
        if (os.getenv(character_id.upper() + "_VOICE_ID", "")):
            voice_id = os.getenv(character_id.upper() + "_VOICE_ID")
        self.characters[character_id] = Character(
            character_id=character_id,
            name=character_name,
            llm_system_prompt=yaml_content["system"],
            llm_user_prompt=yaml_content["user"],
            voice_id=voice_id,
            source='default',
            location='repo',
            visibility='public',
            tts=yaml_content["text_to_speech_use"]
        )

        if "avatar_id" in yaml_content:
            self.characters[character_id].avatar_id = yaml_content["avatar_id"]
        if "author_name" in yaml_content:
            self.characters[character_id].author_name = yaml_content["author_name"],

        return character_name

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
            f'Loaded {len(self.characters)} characters: IDs {list(self.characters.keys())}')

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
            self.characters[character_id] = Character(
                character_id=character_id,
                name=character_name,
                llm_system_prompt=yaml_content["system"],
                llm_user_prompt=yaml_content["user"],
                voice_id=yaml_content["voice_id"],
                source='community',
                location='repo',
                author_name=yaml_content["author_name"],
                visibility=yaml_content["visibility"],
                tts=yaml_content["text_to_speech_use"]
            )

            if "avatar_id" in yaml_content:
                self.characters[character_id].avatar_id = yaml_content["avatar_id"]

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


    def load_character_from_sql_database(self):
        character_models = self.sql_db.query(CharacterModel).all()
        with self.sql_load_lock.gen_wlock():
            # delete all characters with location == 'database'
            keys_to_delete = []
            for character_id in self.characters.keys():
                if self.characters[character_id].location == 'database':
                    keys_to_delete.append(character_id)
            for key in keys_to_delete:
                del self.characters[key]

            # add all characters from sql database
            for character_model in character_models:
                author_name = auth.get_user(
                    character_model.author_id).display_name if os.getenv(
                        'USE_AUTH', '') else "anonymous author"
                character = Character(
                    character_id=character_model.id,
                    name=character_model.name,
                    llm_system_prompt=character_model.system_prompt,
                    llm_user_prompt=character_model.user_prompt,
                    voice_id=character_model.voice_id,
                    source='community',
                    location='database',
                    author_id=character_model.author_id,
                    author_name=author_name,
                    visibility=character_model.visibility,
                    tts=character_model.tts,
                    data=character_model.data,
                    avatar_id=character_model.avatar_id if character_model.avatar_id else None
                )
                self.characters[character_model.id] = character
                # TODO: load context data from storage
        logger.info(
            f'Loaded {len(character_models)} characters from sql database')


def get_catalog_manager():
    return CatalogManager.get_instance()


if __name__ == '__main__':
    manager = CatalogManager.get_instance()
