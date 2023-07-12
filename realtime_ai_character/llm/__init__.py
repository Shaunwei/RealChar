import os

from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, AsyncCallbackTextHandler, LLM


def get_llm() -> LLM:
    use = os.getenv('LLM_USE', 'OPENAI')
    if use == 'OPENAI':
        from realtime_ai_character.llm.openai_llm import OpenaiLlm
        return OpenaiLlm.get_instance()
    elif use == 'ANTHROPIC':
        from realtime_ai_character.llm.anthropic_llm import AnthropicLlm
        return AnthropicLlm.get_instance()
    else:
        raise ValueError(f'Invalid LLM_USE: {use}')
