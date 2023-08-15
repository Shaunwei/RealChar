import os
from functools import cache

from langchain.chat_models.base import BaseChatModel

from realtime_ai_character.llm.base import LLM


def get_llm(model='gpt-3.5-turbo-16k') -> LLM:
    if model.startswith('gpt'):
        from realtime_ai_character.llm.openai_llm import OpenaiLlm
        return OpenaiLlm(model=model)
    elif model.startswith('claude'):
        from realtime_ai_character.llm.anthropic_llm import AnthropicLlm
        return AnthropicLlm(model=model)
    elif "llama" in model:
        # Currently use Anyscale to support llama models
        from realtime_ai_character.llm.anyscale_llm import AnysacleLlm
        return AnysacleLlm(model=model)
    else:
        raise ValueError(f'Invalid llm model: {model}')

@cache
def get_chatmodel_from_env() -> BaseChatModel:
    """GPT-4 has the best performance while generating system prompt."""
    if os.getenv('OPENAI_API_KEY'):
        return get_llm(model='gpt-4').chat_open_ai
    elif os.getenv('ANTHROPIC_API_KEY'):
        return get_llm(model='claude-2').chat_anthropic
    elif os.getenv('ANYSCALE_API_KEY'):
        return get_llm(model='meta-llama/Llama-2-70b-chat-hf').chat_open_ai
    raise ValueError('No llm api key found in env')
