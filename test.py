import os
import openai

openai.api_key = "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"

messages = [{"role": "user", "content": "hey can you say good night to me? "}]

response = openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=messages, 
  temperature=1,
  max_tokens=256,
  top_p=1,
  frequency_penalty=0,
  presence_penalty=0
)

print(response)