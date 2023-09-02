from realtime_ai_character.llm.base import AsyncCallbackAudioHandler, AsyncCallbackTextHandler, LLM
import litellm

def get_llm(model='gpt-3.5-turbo-16k') -> LLM:
    if model.startswith('gpt') or model in litellm.model_list or model.split("/")[0] in litellm.provider_list:
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
