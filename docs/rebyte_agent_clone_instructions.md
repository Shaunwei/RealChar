# Step-by-Step Tutorial for Agent Cloning on ReByte

In this tutorial, you'll learn how to replicate a ReByte community agent into your project space, giving you the flexibility to tailor its configuration to meet your project's demands.

## Process Overview

### Step 1: Setting up Your ReByte Account
To start, establish your presence on ReByte by registering an account at their official site: [ReByte](https://rebyte.ai/).

### Step 2: Choosing a Pre-built Community Agent
Within the platform, visit the [Public RealChar Characters's Agents](https://rebyte.ai/p/d4e521a67bb8189c2189/callable). Scan through the available public agents and pick one that aligns with your interests, such as the 'chat_with_elon_musk_with_knowledge_memory'. Or you can choose one Character on the [RealChar.ai](https://realchar.ai/) and visit its Agent link.

### Step 3: Cloning the Selected Agent
Employ the `Clone` function to replicate the chosen agent into your project workspace or an alternative project if preferred.

### Step 4: Bringing Your Agent to Life
In your project dashboard, select the cloned agent and start `Run Testcases`. Upon completion, engage the `Deploy` button. This operation will generate a command looking something like this:

```shell
curl -L https://rebyte.ai/api/sdk/p/{project_id}/a/{agent_id}/r \
    -H "Authorization: Bearer {rebyte_api_key}" \
    ...
```

Take note of the `project_id`, `agent_id`, and `rebyte_api_key`.

> Important: Upgrading to a Pro account may be necessary to acquire your API keys.

### Step 5: Personalizing the Character Configuration
In your project files, navigate to the `realchar-private/realtime_ai_character/character_catalog` directory. Here, amend the `config.yaml` file with the correct `project_id` and `agent_id` that you have noted.

Ensure to set your `rebyte_api_key` in the `.env` file located at the root of your project directory.

### Step 6: Implementing the Agent with RealChar
For the final step, consult the `README.md` document in the base code repository for guidance on correctly running the RealChar software with your newly cloned agent.
