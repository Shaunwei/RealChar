How to use character catalog
---


### Folder structure
```
character_catalog
├── ai_character_helper
│   ├── data
│   │   ├── background
│   │   ├── xxx.md
│   ├── system
│   └── user
├── loki
...
```
- Each folder is an AI character
- Just copy paste `ai_character_helper` folder and rename it to your character's name
- In `ai_character_helper` folder, there are two files and one folder

- system file
    - the system prompt used to define the AI character
- user file
    - the user template used for user input
    - used to provide context for the AI character conversation
- /data folder
    - used to pull relevant information during conversation
    - automatically stored in memory vector database(Chroma) for fast retrieval
    - supports following file types
        - plain text file, i.e. `background`
        - `.pdf`
        - `.docx`
        - `.pptx`
        - `.png`
        - `.csv`
        - `.epub`
        - `.md`
        - `.mbox`
        - `.ipynb`

### new Character PR template

- This PR added a new character `Reflection Pi`, Please use [PR#30](https://github.com/Shaunwei/RealChar/pull/30) as a template


### Character checklist

- [ ] think about the character and choose a character name
- [ ] copy paste `ai_character_helper` folder and rename it to your character's name
- [ ] update `system` file to define the character
- [ ] add `data` files to enhance the character's knowledge
- [ ] (optional) customize the character's voice
- [ ] (optional) customize the character's avatar
- [ ] (optional) update `user` file define custom user input



