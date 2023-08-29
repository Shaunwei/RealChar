# flake8: noqa
from langchain.schema import HumanMessage, SystemMessage
from realtime_ai_character.llm import get_chatmodel_from_env
from realtime_ai_character.utils import ConversationHistory

prompt_to_generate_memory = '''
You are an excellent information analyst. Below is a conversation between a human user and an AI. The AI is a chatbot that is designed to be able to talk about anything.
The human user's words are lines started with "User: ", and the AI's responses are lines started with "AI: ".

Your task: Extract facts of the user from the conversation. If there is not sufficient info to extract information about the user themselves, return "No info" only, do not make up things or speculate.
Do not respond to this request. Instead, start your analysis right away.

Example:
User: Hi, my name is Paul. I live in New York City.
AI: Hi Paul, nice to meet you. What can I do for you?

Expected Response:
Name: Paul
Location: New York City

Now start your analysis.
'''

async def generate_memory(conversation_history: ConversationHistory):
    if conversation_history is None or len(conversation_history.user) == 0:
        return None
    chat_model = get_chatmodel_from_env()
    conversation_summary = []
    conversation_summary.append(SystemMessage(content=prompt_to_generate_memory))
    conversation_text = ''
    for user_message, ai_message in zip(conversation_history.user, conversation_history.ai):
        conversation_text += f'User: {user_message}\n'
        conversation_text += f'AI: {ai_message}\n'
    conversation_summary.append(HumanMessage(content=conversation_text))
    response = await chat_model.agenerate([conversation_summary])
    return response.generations[0][0].text
