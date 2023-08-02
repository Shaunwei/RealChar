from typing import List

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import ChatAnthropic
from langchain.schema import BaseMessage, HumanMessage

from realtime_ai_character.database.chroma import get_chroma
from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, AsyncCallbackTextHandler, LLM, SearchAgent
from realtime_ai_character.logger import get_logger
from realtime_ai_character.utils import Character

logger = get_logger(__name__)


class AnthropicLlm(LLM):
    def __init__(self, model):
        self.chat_anthropic_instant = ChatAnthropic(
            model='claude-instant-1',
            temperature=0.0,
            streaming=True
        )
        self.chat_anthropic = ChatAnthropic(
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

    def get_config(self):
        return self.config

    async def achat(self,
                    history: List[BaseMessage],
                    user_input: str,
                    user_input_template: str,
                    callback: AsyncCallbackTextHandler,
                    audioCallback: AsyncCallbackAudioHandler,
                    character: Character,
                    useSearch: bool=False,
                    useGmail: bool=False,
                    emails: List[str]=None,
                    subjects: List[str]=None,
                    quickSummarizeGmail: bool=False) -> str:
        logger.info(f'AnthropicLlm: {user_input} {useGmail} {subjects} {quickSummarizeGmail}')

        # 1. Generate context
        context = self._generate_context(user_input, character)

        input_template = user_input_template
        query=user_input

        ## subjecString is a string of all subjects, each subject is wrapped with <subject></subject> tag, e.g <subject>subject1</subject><subject>subject2</subject>
        subjectString = ''.join([f'<subject>{subject}</subject>' for subject in subjects])
        ## emailString is a string of all emails, each email is wrapped with <email></email> tag, e.g <email>email1</email><email>email2</email>
        emailString = ''.join([f'<email>{email}</email>' for email in emails])

        if 'summar' in user_input.lower() and useGmail:
            context = ""
            logger.info(f'AnthropicLlm: user_input and useGmail')
            if quickSummarizeGmail:
                logger.info(f'AnthropicLlm: user_input and useGmail quickSummarizeGmail')
                input_template = """
                {context}
                {query}

                Aim to keep responses super super concise and meaningful and try to express emotions.
                Remember to prefix your reply.
                """

                query = f"""
                Each email subject is listed below with <subject></subject> tag, e.g <subject>subject1</subject><subject>subject2</subject>

                {subjectString}

                You are provided with my unread email subjects today above, summarize that. Some criteria to consider:
                - Summarize with one sentence (less than 80 words) to highlight the general themes.
                - If your summrization is too long, you will be penalized.
                - For email subjects that are not important, you can totally ignore them in the results.
                - Do not expose personal information, e.g. email address, phone number, etc.
                - Do not expose sensitive information, e.g. password, credit card number, etc.
                - End each sentence with period ".".

                Start with "You have x unread emails", do not output the subjects directly, or your internal thought process.
                """
            else:
                logger.info(f'AnthropicLlm: user_input and useGmail !quickSummarizeGmail')
                input_template = """
                {context}
                {query}

                Aim to keep responses super super concise and meaningful and try to express emotions.
                """

                query = f"""
                Each email is listed below with <email></email> tag, e.g <email><subject>You have a meeting</subject><content>some content</content><content>some content</content></email><email>...</email>

                {emailString}

                You are provided with my unread emails today above, summarize that for me. Some criteria to consider:
                - Cluster the emails and List topics based on priority.
                    - For action items, meeting invites, work related stuff (I'm a software engineer), they are high priority.
                    - For marketing emails they are not relevant to my work or personal life, it's low priority.
                    - For other things, use your best judgement.
                - Output should be listed from high priority to low priority at the top level.
                - For each item in the priority, it can be one or two sentences.
                - End with the item with period ".".
                - Some emails are very similar topics, and you don't want to repeat them. For example, there are several emails talking about the same thing, it should only be listed as one topic in the result.
                - Do not expand each email into multiple topics. For example, if an email is talking about 3 topics, it should only be listed as one topic in the result.
                - For emails that are not important, you can totally ignore them in the result.
                - For emails that requires action item, you can list them as action items. Examples: invitation to a meeting or slack workspace.
                - Do not expose personal information, e.g. email address, phone number, etc.
                - Do not expose sensitive information, e.g. password, credit card number, etc.

                Only output the summary, do not output the emails, or your internal thought process.
                """
        elif useGmail:
            logger.info(f'AnthropicLlm: !user_input and useGmail')
            query = f"""
            "{user_input}"

            Some criteria to consider:
            - Do not expose personal information, e.g. email address, phone number, etc.
            - Do not expose sensitive information, e.g. password, credit card number, etc.
            - Make sure the answer is relevant to the emails, do not make up things that are not in the emails.

            Only output the answer, do not output the emails, or your internal thought process.
            """

        # Get search result if enabled
        if useSearch:
            context += self.search_agent.search(user_input)

        logger.info(f'>>> input_template: {input_template}')
        logger.info(f'>>> context: {context}')
        logger.info(f'>>> query: {query}')

        # 2. Add user input to history
        history.append(HumanMessage(content=input_template.format(
            context=context, query=query)))

        logger.info(f'History: {history}')

        # 3. Generate response
        if useGmail and quickSummarizeGmail:
            response = await self.chat_anthropic_instant.agenerate(
                [history], callbacks=[callback, audioCallback, StreamingStdOutCallbackHandler()])
        else:
            response = await self.chat_anthropic.agenerate(
                [history], callbacks=[callback, audioCallback, StreamingStdOutCallbackHandler()])
        logger.info(f'Response: {response}')
        return response.generations[0][0].text

    def _generate_context(self, query, character: Character) -> str:
        docs = self.db.similarity_search(query)
        docs = [d for d in docs if d.metadata['character_name'] == character.name or d.metadata['character_name'] == 'inbox_zero']
        logger.info(f'Found {len(docs)} documents')

        context = '\n'.join([d.page_content for d in docs])
        return context
