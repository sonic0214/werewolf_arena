# Werewolf The Social Deduction Game
This repository provides code for [Werewolf Arena](https://arxiv.org/abs/2407.13943) - a framework for evaluating the social reasoning skills of large language models (LLMs) through the game of Werewolf.

## Set up the environment

### Create a Python Virtual Environment
You only need to do this once.
```
python3 -m venv ./venv
```

### Activate the Virtual Environment
```
source ./venv/bin/activate
```

### Install Dependencies
```
pip install -r requirements.txt
```

### Set OpenAI API Key for using GPTs
```
export OPENAI_API_KEY=<your api key>
```
The program will read from this environment variable.

### (Optional) Use OpenRouter for multiple vendors via OpenAI-compatible API
Set these to route any model whose id starts with `openrouter/` through OpenRouter:
```
export OPENROUTER_API_KEY=<your openrouter api key>
# Optional but recommended for analytics/routing on OpenRouter
export OPENROUTER_REFERRER=https://your.site.or.repo
export OPENROUTER_APP_TITLE="Werewolf Arena"
```
Example CLI (villagers use Claude 3.5 Sonnet via OpenRouter, werewolves use GPT-4o via OpenRouter):
```
python3 main.py --run --v_models=or-sonnet --w_models=or-gpt4o
```
You can add more aliases in `werewolf/runner.py` `model_to_id` mapping, pointing to
OpenRouter slugs like `openrouter/anthropic/claude-3.5-sonnet` or `openrouter/openai/gpt-4o-2024-08-06`.

### (Optional) Use ZhipuAI GLM API (native)
Set these to route any model whose id starts with `glm/` through GLM's OpenAI-compatible API:
```
export GLM_API_KEY=<your zhipu/glm api key>
# Optional: override base url if needed
export GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```
Example CLI:
```
python3 main.py --run --v_models=glm4-air --w_models=glm4
```

### Set up GCP for using Gemini
 - [Install the gcloud cli](https://cloud.google.com/sdk/docs/install)
 - Authenticate and set your GCP project
 - Create the application default credentials by running 
 ```
 gcloud auth application-default login
 ```

## Run a single game

`python3 main.py --run --v_models=pro1.5 --w_models=gpt4`


## Run games between all model combinations

`python3 main.py --eval --num_games=5 --v_models=pro1.5,flash --w_models=gpt4,gpt4o`

## Bulk resume failed games

`python3 main.py --resume`

The games to be resumed are currently hardcoded in `runner.py`, and
is defined as a list of directories where their states are saved.

## Launch the Interactive Viewer
![alt text](viewer.png)

Once a game is completed, you can use the interactive viewer to explore the gamelog. You can see players' private reasoning, bids, votes and prompts. 

 - `npm i`
 - `npm run start`
 - Open the browser, e.g. `http://localhost:8080/?session_id=session_20240610_084702`
