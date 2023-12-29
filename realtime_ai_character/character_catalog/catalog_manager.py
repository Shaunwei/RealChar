import os
import threading
import time
from contextlib import ExitStack
from pathlib import Path
from typing import cast, Optional

import yaml
from dotenv import load_dotenv
from firebase_admin import auth
from langchain.text_splitter import CharacterTextSplitter
from llama_index import SimpleDirectoryReader
from readerwriterlock import rwlock

from realtime_ai_character.database.chroma import get_chroma
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.logger import get_logger
from realtime_ai_character.models.character import Character as CharacterModel
from realtime_ai_character.utils import Character, Singleton


load_dotenv()
logger = get_logger(__name__)


class CatalogManager(Singleton):
    def __init__(self):
        super().__init__()
        overwrite = os.getenv("OVERWRITE_CHROMA") != "false"
        # skip Chroma if Openai API key is not set
        if os.getenv("OPENAI_API_KEY"):
            self.db = get_chroma()
        else:
            self.db = get_chroma(embedding=False)
            overwrite = False
            logger.warning("OVERWRITE_CHROMA disabled due to OPENAI_API_KEY not set")
        self.sql_db = next(get_db())
        self.sql_load_interval = 30
        self.sql_load_lock = rwlock.RWLockFair()

        if overwrite:
            logger.info("Overwriting existing data in the chroma.")
            self.db.delete_collection()
            self.db = get_chroma()

        self.characters: dict[str, Character] = {}
        self.author_name_cache: dict[str, str] = {}
        self.load_characters("default", overwrite)
        self.load_characters("community", overwrite)
        if overwrite:
            logger.info("Persisting data in the chroma.")
            self.db.persist()
        logger.info(f"Total document load: {self.db._client.get_collection('llm').count()}")
        self.run_load_sql_db_thread = True
        self.load_sql_db_thread = threading.Thread(target=self.load_sql_db_loop)
        self.load_sql_db_thread.daemon = True
        self.load_sql_db_thread.start()

    def load_sql_db_loop(self):
        while self.run_load_sql_db_thread:
            self.load_character_from_sql_database()
            time.sleep(self.sql_load_interval)

    def stop_load_sql_db_loop(self):
        self.run_load_sql_db_thread = False

    def get_character(self, name) -> Optional[Character]:
        with self.sql_load_lock.gen_rlock():
            return self.characters.get(name)

    def load_character(self, directory: Path, source: str):
        with ExitStack() as stack:
            f_yaml = stack.enter_context(open(directory / "config.yaml"))
            yaml_content = cast(dict, yaml.safe_load(f_yaml))

            character_id = yaml_content["character_id"]
            character_name = yaml_content["character_name"]
            voice_id_env = os.getenv(character_id.upper() + "_VOICE_ID")
            voice_id = voice_id_env or str(yaml_content["voice_id"])
            order = yaml_content.get("order", 10**6)
            self.characters[character_id] = Character(
                character_id=character_id,
                name=character_name,
                llm_system_prompt=yaml_content["system"],
                llm_user_prompt=yaml_content["user"],
                source=source,
                location="repo",
                voice_id=voice_id,
                author_name=yaml_content.get("author_name", ""),
                visibility="public" if source == "default" else yaml_content["visibility"],
                tts=yaml_content["text_to_speech_use"],
                order=order,
                # rebyte config
                rebyte_api_project_id=yaml_content["rebyte_api_project_id"],
                rebyte_api_agent_id=yaml_content["rebyte_api_agent_id"],
                rebyte_api_version=yaml_content.get("rebyte_api_version"),
            )

            return character_name

    def load_data(self, character_name: str, data_path: Path):
        loader = SimpleDirectoryReader(data_path.absolute().as_posix())
        documents = loader.load_data()
        text_splitter = CharacterTextSplitter(separator="\n", chunk_size=500, chunk_overlap=100)
        docs = text_splitter.create_documents(
            texts=[d.text for d in documents],
            metadatas=[
                {
                    "character_name": character_name,
                    "id": d.id_,
                }
                for d in documents
            ],
        )
        self.db.add_documents(docs)

    def load_characters(self, source: str, overwrite: bool):
        """
        Load characters from the character_catalog directory. Use /data to create
        documents and add them to the chroma.

        :param source: 'default' or 'community'

        :param overwrite: if True, overwrite existing data in the chroma.
        """
        if source == "default":
            path = Path(__file__).parent
            excluded_dirs = {"__pycache__", "archive", "community"}
        elif source == "community":
            path = Path(__file__).parent / "community"
            excluded_dirs = {"__pycache__", "archive"}
        else:
            raise ValueError(f"Invalid source: {source}")

        directories = [d for d in path.iterdir() if d.is_dir() and d.name not in excluded_dirs]

        for directory in directories:
            character_name = self.load_character(directory, source)
            if character_name and overwrite:
                logger.info("Overwriting data for character: " + character_name)
                self.load_data(character_name, directory / "data")

        logger.info(f"Loaded {len(self.characters)} characters: IDs {list(self.characters.keys())}")

    def load_character_from_sql_database(self):
        logger.info("Started loading characters from SQL database")
        character_models = self.sql_db.query(CharacterModel).all()

        with self.sql_load_lock.gen_wlock():
            # delete all characters with location == 'database'
            keys_to_delete = []
            for character_id in self.characters.keys():
                if self.characters[character_id].location == "database":
                    keys_to_delete.append(character_id)
            for key in keys_to_delete:
                del self.characters[key]

            # add all characters from sql database
            for character_model in character_models:
                if character_model.author_id not in self.author_name_cache:
                    author_name = (
                        auth.get_user(character_model.author_id).display_name
                        if os.getenv("USE_AUTH") == "true"
                        else "anonymous author"
                    )
                    self.author_name_cache[character_model.author_id] = author_name  # type: ignore
                else:
                    author_name = self.author_name_cache[character_model.author_id]
                character = Character(
                    character_id=character_model.id,  # type: ignore
                    name=character_model.name,  # type: ignore
                    llm_system_prompt=character_model.system_prompt,  # type: ignore
                    llm_user_prompt=character_model.user_prompt,  # type: ignore
                    source="community",
                    location="database",
                    voice_id=character_model.voice_id,  # type: ignore
                    author_name=author_name,
                    author_id=character_model.author_id,  # type: ignore
                    visibility=character_model.visibility,  # type: ignore
                    tts=character_model.tts,  # type: ignore
                    data=character_model.data,  # type: ignore
                    # rebyte config
                    rebyte_api_project_id=character_model.rebyte_api_project_id,  # type: ignore
                    rebyte_api_agent_id=character_model.rebyte_api_agent_id,  # type: ignore
                    rebyte_api_version=character_model.rebyte_api_version,  # type: ignore
                )
                self.characters[character_model.id] = character  # type: ignore
                # TODO: load context data from storage
        logger.info(f"Loaded {len(character_models)} characters from sql database")


def get_catalog_manager() -> CatalogManager:
    return CatalogManager.get_instance()


if __name__ == "__main__":
    manager = CatalogManager.get_instance()
