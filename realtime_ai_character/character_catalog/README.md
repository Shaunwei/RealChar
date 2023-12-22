# How to use character catalog

### Folder structure

```
character_catalog
├── character
│   ├── data
│   │   ├── background.txt
│   │   ├── messages.csv
│   │   └── xxx.md
│   └── config.yaml
├── ...
```

- Each `character` folder is an AI character
- Rename the `character` folder to your character's name
- `config.yaml` file

    Must Have:
    - `character_id`: the unique identifier for the character
    - `character_name`: your character's name
    - `system`: the system prompt used to define the AI character
    - `user`: the user prompt template used to organize user input and provide context for the conversation

    Optional:
    - `text_to_speech_use`: the text to speech engine used to generate the character's voice
    - `voice_id`: the voice used by the selected text-to-speech engine
    - `order`: display order on the website
    - `rebyte_api_project_id`: the Project ID if using characters on ReByte.ai
    - `rebyte_api_agent_id`: the Agent ID if using characters on ReByte.ai
- `data` folder
    - Can be the character's background information, biography, conversation history, etc.
    - Information will be pulled from these documents during conversation
    - Automatically converted into vector database (knowledge base) for fast retrieval
    - supports plain text, markdown, csv, pdf, docx, pptx, png, epub, mbox, ipynb

### Character checklist

- [ ] think about the character and choose a character name
- [ ] duplicate a `character` folder and rename it to your character's name
- [ ] update your character name and id in `config.yaml`
- [ ] update the system prompt in `config.yaml` to define the character
- [ ] add documents to `data` to enhance the character's knowledge
- [ ] (optional) customize the character's voice
- [ ] (optional) customize the character's avatar
- [ ] (optional) customize the user prompt in `config.yaml` file for advanced context control (in general you don't need to)
