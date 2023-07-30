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

import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import base64
# Import datetime
from datetime import datetime, timedelta

from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

import streamlit as st
import re
from bs4 import BeautifulSoup

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

        self.unread_subjects = []
        self.unread_emails = []
        self.load_unread_emails(overwrite)
        self.characters = {}
        self.load_characters_from_community(overwrite)
        self.load_characters(overwrite)
        if overwrite:
            logger.info('Persisting data in the chroma.')
            self.db.persist()
        logger.info(
            f"Total document load: {self.db._client.get_collection('llm').count()}")

    def get_unread_emails(self) -> [str]:
        return self.unread_emails

    def get_unread_subjects(self) -> [str]:
        return self.unread_subjects

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

    def beautify(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        # Get text inside all paragraph tags 
        text = ' '.join(p.text for p in soup.find_all('p'))
        # Remove extra whitespace
        text = re.sub('\s+', ' ', text)
        return text

    def cleanify(self, text):
        # Remove newlines
        text = text.replace('\\n', ' ')
        # Remove links
        text = re.sub(r'\[.*?\]', '', text)
        # Remove whitespace around periods
        text = re.sub(r'\. \.', '.', text)
        # Collapse whitespace
        text = re.sub('\s+', ' ', text)
        return text

    def remove_https_urls(self, text):
        return re.sub(r'https://\S+', '', text)

    def data_from_body(self, body):
        logger.info(f'data_from_body')
        data = []
        if 'data' in body.keys():
            logger.info(f'data_from_body: data')
            body = body['data']
            decoded_body = base64.urlsafe_b64decode(body.encode('UTF-8')).decode('UTF-8')
            logger.info('===========================')
            logger.info(f'decoded_body: {decoded_body}')
            logger.info(f'beautify: {self.remove_https_urls(self.beautify(decoded_body))}')
            response = self.remove_https_urls(self.beautify(decoded_body))
            if len(response) > 0:
                data.append(response)
            elif '<!doctype html' not in decoded_body.lower():
                data.append(self.remove_https_urls(self.cleanify(decoded_body)))
                logger.info(f'cleanify: {self.remove_https_urls(self.cleanify(decoded_body))}')
            logger.info('===========================')
        elif 'parts' in body.keys():
            logger.info(f'data_from_body: parts')
            for body in self.body_from(body['parts']):
                data.append(body)
        return data


    def body_from(self, parts):
        logger.info(f'body_from')
        body = []
        for part in parts:
            if 'body' in part.keys():
                logger.info(f'body_from: body')
                for data in self.data_from_body(part['body']):
                    if data != None:
                        body.append(data)
                        logger.info(f'append data: {data}')
            if 'parts' in part.keys():
                for result in self.body_from(part['parts']):
                    body.append(result)
        return body

    def data_from(self, payload):
        data = []
        if 'parts' in payload.keys():
            for body in self.body_from(payload['parts']):
                data.append(body)
        elif 'body' in payload.keys():
            logger.info(f'No parts in payload: {payload}')
            data.append(self.data_from_body(payload['body']))

        if len(data) == 0:
            logger.info(f'nothing added: {payload}')
        return data

    def load_unread_emails(self, overwrite):
        """
        Load unread emails. Use /data to create documents and add them to the chroma.

        :overwrite: if True, overwrite existing data in the chroma.
        """

        creds = None
        # If modifying these scopes, delete the file token.json.
        SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

        # The file token.json stores the user's access and refresh tokens, and is
        # created automatically when the authorization flow completes for the first
        # time.
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)

        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                # If modifying these scopes, delete the file token.json.
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            # Save the credentials for the next run
            with open('token.json', 'w') as token:
                token.write(creds.to_json())

        try:
            # Call the Gmail API
            service = build('gmail', 'v1', credentials=creds)
            # Get date of one week ago
            one_week_ago = datetime.now() - timedelta(days=7)
            # today = datetime.now().date()

            # Format date as YYYY/MM/DD
            # today_str = today.strftime("%Y/%m/%d")
            one_week_ago_str = one_week_ago.strftime("%Y/%m/%d")

            # Search query 
            # query = f'after:{today_str}' 
            query = f'after:{one_week_ago_str}'
            results = service.users().messages().list(userId='me', labelIds='UNREAD', q=query).execute()
            # results = service.users().messages().list(userId='me').execute()
            messages = results.get('messages', [])

            if not messages:
                logger.info('No messages found.')
                st.stop()

            logger.info(f'messages: {messages}')
            emails = []
            subjects = []
            # Iterate through each email
            for msg in messages:
                txt = service.users().messages().get(userId='me', id=msg['id']).execute()

                # Get payload and decode email body
                try:
                    payload = txt['payload']
                    # logger.info(f"Subject: {payload['headers'][0]['value']}")
                    # logger.info(f"payload: {payload['parts'][0]['body']}")

                    subject = ""
                    for data in payload['headers']:
                        if data['name'] == 'Subject':
                            subject = data['value']
                            logger.info(f"Subject: {data['value']}")

                    subjects.append(subject)
                    emails.append(f"<subject>{subject}</subject>{''.join([f'<content>{data}</content>' for data in self.data_from(payload)])}")
                except HttpError as error:
                    logger.info(f'An error occurred: {error}')

            logger.info(f'Collected {len(emails)} emails')
        except HttpError as error:
                # TODO(developer) - Handle errors from gmail API.
            logger.info(f'An error occurred: {error}')

        self.unread_emails = emails
        self.unread_subjects = subjects

        text_splitter = CharacterTextSplitter(
            separator='\n',
            chunk_size=500,
            chunk_overlap=100)
        docs = text_splitter.create_documents(
            texts=emails,
            metadatas=[{
                'character_name': 'inbox_zero',
                'subject': subject,
            } for subject in subjects])
        self.db.add_documents(docs)
        logger.info('Loaded data for unread emails')

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

            if "avatar_id" in yaml_content:
                self.characters[character_name].avatar_id = yaml_content["avatar_id"]

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
