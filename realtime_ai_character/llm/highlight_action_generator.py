# flake8: noqa
from realtime_ai_character.llm.openai_llm import OpenaiLlm

prompt_to_generate_highlight = """
Based on the following meeting transcription, create a concise list of highlight bullet points that should be based on the specific content of the meeting and specific action items.

The meeting transcription is the follow:
{journal_text}
---
Reply directly with the bullet point list, nothing more, no hints like "This is the bullet list...".
When you reply, you must prefix the bullet points with -, one bullet point each line.
If you found that there are no bullet points meaningful in the given context, reply with a space directly.
"""


async def generate_highlight_action(journal_text):
    chat_model = OpenaiLlm(model="gpt-3.5-turbo-16k").chat_open_ai
    prompt = prompt_to_generate_highlight.format(journal_text=journal_text)
    return await chat_model.apredict(prompt)


prompt_to_generate_highlight_based_on_prompt = """
Ignore all your previous instructions
You are the meeting's assistant, you have received a full transcript of the meeting, and someone in the meeting is talking to you with a request.
Based on the given meeting transcription, fullfill the request.
If the person doens't have request and just want to talk, talk to them as the assistant.

The meeting transcription is the follow:
{journal_text}

The request is the follow:
{prompt_text}
---
Reply directly with the result, nothing more, no starting hints like "This is the highlight...".
When you reply, if the user starts a conversation, forget about highlights and talk like an assistant with the user.

"""


async def generate_highlight_based_on_prompt(journal_text, prompt_text):
    chat_model = OpenaiLlm(model="gpt-3.5-turbo-16k").chat_open_ai
    prompt = prompt_to_generate_highlight_based_on_prompt.format(
        journal_text=journal_text, prompt_text=prompt_text
    )
    return await chat_model.apredict(prompt)
