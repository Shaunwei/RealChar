from pydantic.dataclasses import dataclass


@dataclass
class Companion:
    name: str
    llm_system_prompt: str
    llm_user_prompt: str


@dataclass
class ConversationHistory:
    system_prompt: str
    user: list[str]
    ai: list[str]

    def __iter__(self):
        yield self.system_prompt
        for user_message, ai_message in zip(self.user, self.ai):
            yield user_message
            yield ai_message


class Singleton:
    _instances = {}

    @classmethod
    def get_instance(cls, *args, **kwargs):
        """ Static access method. """
        if cls not in cls._instances:
            cls._instances[cls] = cls(*args, **kwargs)

        return cls._instances[cls]

    @classmethod
    def initialize(cls, *args, **kwargs):
        """ Static access method. """
        if cls not in cls._instances:
            cls._instances[cls] = cls(*args, **kwargs)

    def __init__(self):
        pass
