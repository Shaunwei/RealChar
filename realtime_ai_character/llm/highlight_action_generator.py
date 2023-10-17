# flake8: noqa
from realtime_ai_character.llm import get_llm

prompt_to_generate_highlight = '''
Based on the following meeting transcription, create a concise highlight that should be based on the specific content of the meeting and specific action items.

The meeting transcription is the follow:
{journal_text}
---
Reply directly with the result, nothing more.
'''

async def generate_highlight_action(journal_text):
    chat_model = get_llm("gpt-3.5-turbo-16k").chat_open_ai
    prompt = prompt_to_generate_highlight.format(journal_text=journal_text)
    return await chat_model.apredict(prompt)

prompt_to_generate_highlight_based_on_prompt = '''
Based on the following meeting transcription and the request, create a concise highlight that should be based on the specific content of the meeting and specific action items.

The meeting transcription is the follow:
{journal_text}

The request is the follow:
{prompt_text}
---
Reply directly with the result, nothing more.
'''
async def generate_highlight_based_on_prompt(journal_text, prompt_text):
    chat_model = get_llm("gpt-3.5-turbo-16k").chat_open_ai
    prompt = prompt_to_generate_highlight_based_on_prompt.format(journal_text=journal_text, prompt_text=prompt_text)
    return await chat_model.apredict(prompt)
