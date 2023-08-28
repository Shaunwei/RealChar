# Experimental Features

## Multi-On
We have integrated [Multi-On](https://www.multion.ai/), a popular AI Agent framework into RealChar. During your conversation with RealChar characters, if you start your input with "multion" or "multi-on" (in any capitalized form), we will relay your request to Multi-On, which can help you complete the task.

To enable this feature, please set this environment variable in your command-line or in the .env file:
```
REACT_APP_ENABLE_MULTION=true
```

In addition, please start the uvicorn server with port 8001, e.g.
```
uvicorn realtime_ai_character.main:app --port 8001
```
Or using the CLI:
```
python cli.py run-uvicorn --port 8001
```

This is to avoid conflict with MultiOn local server, which is hardcoded to run on 8000, the default port of RealChar backend service. When MultiOn supports customizing the port in the future, this will not be necessary.

You can then toggle the "Enable MultiOn Agent" option in the Advanced Options before starting the conversation.

If you have encounter any issue with MultiOn, please feel free to seek help in our #issue-support channel, or in MultiOn's [discord server](https://discord.gg/ukxkYQzh) directly.
