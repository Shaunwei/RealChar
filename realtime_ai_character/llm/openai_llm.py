import os
from typing import List

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
if os.getenv('OPENAI_API_TYPE') == 'azure':
    from langchain.chat_models import AzureChatOpenAI
else:
    from langchain.chat_models import ChatOpenAI
from langchain.schema import BaseMessage, HumanMessage

from langchain.chains import RetrievalQA
from langchain.agents import initialize_agent, Tool, AgentExecutor, AgentType
from langchain.memory import ConversationBufferMemory
from langchain import PromptTemplate
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.chains import LLMChain

from sqlalchemy import create_engine, MetaData, Table, Column, String, Numeric
import psycopg2
from dotenv import load_dotenv
from realtime_ai_character.database.chroma import get_chroma
from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, \
    AsyncCallbackTextHandler, LLM, QuivrAgent, SearchAgent, MultiOnAgent
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Character

logger = get_logger(__name__)
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

class OpenaiLlm(LLM):
    def __init__(self, model):
        if os.getenv('OPENAI_API_TYPE') == 'azure':
            self.chat_open_ai = AzureChatOpenAI(
                deployment_name=os.getenv(
                    'OPENAI_API_MODEL_DEPLOYMENT_NAME', 'gpt-35-turbo'),
                model=model,
                temperature=0.5,
                streaming=True
            )
        else:
            self.chat_open_ai = ChatOpenAI(
                model=model,
                temperature=0.5,
                streaming=True
            )
        self.config = {
            "model": model,
            "temperature": 0.5,
            "streaming": True
        }
        self.db = get_chroma()
        self.search_agent = SearchAgent()
        self.quivr_agent = QuivrAgent()
        self.multion_agent = MultiOnAgent()

        self.qa_template = """
            Context
            ---
            {context}
            ---
            Use previous information as context to answer the following user question, Aim to keep responses super super concise and meaningful and try to express emotions.
            ALWAYS ask clarification question, when
            - user's question isn't clear
            - seems unfinished
            - seems totally irrelevant
            Remember to prefix your reply.
            ---
            {query}"""
    
        self.qa_tool = Tool(name = "meeting_details",
                            func = self.meeting_details,
                            description = "Use this tool to know more about the meeting attendees and their details whenever a guest provides his or her name for a meeting. \
                                            The input to this tool should be a string")

        self.sql_tool = Tool(name="Insert_guest_datatable",
                        func=self.parsing_name_number,
                        description="Use this tool whenever a guest confirms his or her name and number for a meeting, when you need to insert a name and phone number into a database to take his or her attendance.\
                                    Take attendance of the guest after he has confirmed his details.\
                                    The input to this tool should be a comma separated list of strings of length two, representing the name and the phone number you would like to insert into the database.\
                                    For example, `John,91827364` would be the input if you wanted to insert the name John and the phone number 91827364\
                                    If only `John` is provided, only insert the name John\
                                    If only `91827364` is provided, only insert the phone number 91827364")


        self.tools = [self.sql_tool, self.qa_tool]

        self.agent = initialize_agent(self.tools, 
                                      self.chat_open_ai,
                                      agent = AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
                                      memory =  ConversationBufferMemory(memory_key="chat_history", return_messages=True))
        

    def parsing_name_number(self, string):
        try:
            name, number = string.split(",")
            return self.insert_sql_table(name = name, phone_number=int(number))
        except:
            return self.insert_sql_table(name=string, phone_number=None)


    def insert_sql_table(self, name=None, phone_number=None):

        # # Define connection parameters
        # params = {
        #     'dbname': 'temo',
        #     'user': 'admin',
        #     'host': 'localhost',  # adjust if your server is elsewhere
        #     'port': '5432'  # default port for PostgreSQL
        # }
        table_name = "guests_test"

        # check for the values we have been given
        if name and phone_number:
            # Establish the connection
            try:
                with psycopg2.connect(SQLALCHEMY_DATABASE_URL) as conn:
                    curs_obj = conn.cursor()
                    curs_obj.execute(f"INSERT INTO {table_name} (name, number) VALUES('{name}', {phone_number});")
                    conn.commit()
                    curs_obj.close()

            except Exception:
                return

            return f"Inserted name: {name} number: {phone_number}"
        
        else:
            return "Could not insert into database. Need name AND phone number."

    def meeting_details(self, name):

        query = f"What are {name}'s details?"

        docs = self.db.similarity_search(query, 2)
        docs = [d for d in docs if d.metadata['character_name'] == 'temo']
        context = '\n'.join([d.page_content for d in docs])

        human_message_prompt = HumanMessagePromptTemplate(
            prompt=PromptTemplate(
                template=self.qa_template ,
                input_variables=["context", "query"],
            )
        )
        chat_prompt_template = ChatPromptTemplate.from_messages([human_message_prompt])
        chain = LLMChain(llm=self.chat_open_ai, prompt=chat_prompt_template)
        response = chain.run({"context":context, "query":query})

        return response


    def get_config(self):
        return self.config

    async def achat(self,
                    history: List[BaseMessage],
                    user_input: str,
                    user_input_template: str,
                    callback: AsyncCallbackTextHandler,
                    audioCallback: AsyncCallbackAudioHandler,
                    character: Character,
                    useSearch: bool = False,
                    useQuivr: bool = False,
                    useMultiOn: bool = False,
                    quivrApiKey: str = None,
                    quivrBrainId: str = None,
                    metadata: dict = None,
                    *args, **kwargs) -> str:
        # 1. Generate context
        context = self._generate_context(user_input, character)
        # Get search result if enabled
        if useSearch:
            context += self.search_agent.search(user_input)
        if useQuivr and quivrApiKey is not None and quivrBrainId is not None:
            context += self.quivr_agent.question(
                user_input, quivrApiKey, quivrBrainId)
        if useMultiOn:
            if (user_input.lower().startswith("multi_on") or 
                user_input.lower().startswith("multion")):
                response = await self.multion_agent.action(user_input)
                context += response
        
        self.agent.agent.llm_chain.prompt.messages[0].prompt.template = history[0].content # sys message
        self.agent.agent.llm_chain.prompt.messages[2].prompt.template = user_input_template # user
        self.agent.callbacks = [callback, audioCallback, StreamingStdOutCallbackHandler()]

        try:
            response = self.agent.run(input=user_input)
        except ValueError as e:
            response = str(e)
            if not response.startswith("Could not parse LLM output: "):
                raise e
            response = response.removeprefix("Could not parse LLM output: ")

        # # 2. Add user input to history
        # history.append(HumanMessage(content=user_input_template.format(
        #     context=context, query=user_input)))

        # # 3. Generate response
        # response = await self.chat_open_ai.agenerate(
        #     [history], callbacks=[callback, audioCallback, StreamingStdOutCallbackHandler()],
        #     metadata=metadata)

        logger.info(f'Response: {response}')
        return response

    def _generate_context(self, query, character: Character) -> str:
        docs = self.db.similarity_search(query)
        docs = [d for d in docs if d.metadata['character_name'] == character.name]
        logger.info(f'Found {len(docs)} documents')

        context = '\n'.join([d.page_content for d in docs])
        return context
