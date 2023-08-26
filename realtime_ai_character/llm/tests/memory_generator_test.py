import pytest

from realtime_ai_character.llm.memory_generator import generate_memory
from realtime_ai_character.models.interaction import Interaction


@pytest.mark.asyncio
async def test_generate_memory_none():
    # Test case when interactions is None
    result = await generate_memory(None)
    assert result is None

    # Test case when interactions is an empty list
    result = await generate_memory([])
    assert result is None


@pytest.mark.asyncio
async def test_generate_memory_no_info():
    # Test case with actual interactions
    interactions = [
        Interaction(id=1,
                    client_message_unicode="Hello",
                    server_message_unicode="Hi there!"),
        Interaction(id=2,
                    client_message_unicode="How are you?",
                    server_message_unicode="I'm doing well, thank you!")
    ]

    result = (await generate_memory(interactions)).generations[0][0].text

    # Check if function returns correct value
    assert result == "No info"


@pytest.mark.asyncio
async def test_generate_memory_basic_info():
    # Test case with actual interactions
    interactions = [
        Interaction(
            id=1,
            client_message_unicode="My name is Paul. How are you?",
            server_message_unicode=
            ("Hi Paul! Nice to meet you. As an entrepreneur, I'm always curious about people's "
            "aspirations. So, what's something you've always wanted to achieve?")
        ),
    ]

    result = (await generate_memory(interactions)).generations[0][0].text

    # Check if function returns correct value
    assert result == "Name: Paul"


@pytest.mark.asyncio
async def test_generate_memory_multiple_info():
    # Test case with actual interactions
    interactions = [
        Interaction(
            id=1,
            client_message_unicode="My name is Paul. How are you?",
            server_message_unicode=
            ("Hi Paul! Nice to meet you. As an entrepreneur, I'm always curious about people's "
              "aspirations. So, what's something you've always wanted to achieve?")
        ),
        Interaction(
            id=2,
            client_message_unicode=
            "I want to visit all continents. I'm from Canada and have not travel abroad yet.",
            server_message_unicode=
            ("That's a fantastic goal, Paul! Exploring different continents can be an incredible "
            "experience. If you could choose one continent to visit first, which one would it be "
             "and why?")
        ),
    ]

    result = (await generate_memory(interactions)).generations[0][0].text

    # Check if function returns correct value
    assert result == """Name: Paul
Aspiration: Wants to visit all continents
Location: Canada
Travel History: Has not traveled abroad yet""".strip()
