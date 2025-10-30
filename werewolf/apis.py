# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from openai import OpenAI
import os

from typing import Any, Optional, Dict
import google
import vertexai
from vertexai.preview import generative_models
from anthropic import AnthropicVertex


def generate(model, **kwargs):
    # Route OpenRouter models explicitly when prefixed with "openrouter/"
    if model.startswith("openrouter/"):
        # OpenRouter expects slugs like "anthropic/claude-3.5-sonnet"
        or_model = model.replace("openrouter/", "", 1)
        return generate_openrouter(or_model, **kwargs)

    # Route GLM (ZhipuAI) models when prefixed with "glm/"
    if model.startswith("glm/"):
        glm_model = model.replace("glm/", "", 1)
        return generate_glm(glm_model, **kwargs)

    if "gpt" in model:
        return generate_openai(model, **kwargs)
    elif "claude" in model:
        return generate_authropic(model, **kwargs)
    else:
        return generate_vertexai(model, **kwargs)


# openai
def generate_openai(model: str, prompt: str, json_mode: bool = True, **kwargs):
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    response_format = {"type": "text"}
    if json_mode:
        response_format = {"type": "json_object"}
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        response_format=response_format,
        model=model,
    )

    txt = response.choices[0].message.content
    return txt


# openrouter (OpenAI-compatible client)
def generate_openrouter(
    model: str,
    prompt: str,
    json_mode: bool = True,
    **kwargs,
):
    base_url = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY environment variable")

    default_headers = {}
    # Optional but recommended headers for OpenRouter analytics/routing
    referer = os.environ.get("OPENROUTER_REFERRER")
    app_title = os.environ.get("OPENROUTER_APP_TITLE", "Werewolf Arena")
    if referer:
        default_headers["HTTP-Referer"] = referer
    if app_title:
        default_headers["X-Title"] = app_title

    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
        default_headers=default_headers or None,
    )

    response_format = {"type": "text"}
    if json_mode:
        response_format = {"type": "json_object"}
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        response_format=response_format,
        model=model,
    )
    return response.choices[0].message.content


# zhipu/glm via OpenAI-compatible endpoint
def generate_glm(
    model: str,
    prompt: str,
    json_mode: bool = True,
    **kwargs,
):
    base_url = os.environ.get("GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
    api_key = os.environ.get("GLM_API_KEY") or os.environ.get("ZHIPU_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GLM_API_KEY (or ZHIPU_API_KEY) environment variable")

    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
    )

    response_format = {"type": "text"}
    if json_mode:
        response_format = {"type": "json_object"}
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        response_format=response_format,
        model=model,
    )
    return response.choices[0].message.content


# anthropic
def generate_authropic(model: str, prompt: str, **kwargs):
    # For local development, run `gcloud auth application-default login` first to
    # create the application default credentials, which will be picked up
    # automatically here.
    _, project_id = google.auth.default()
    client = AnthropicVertex(region="us-east5", project_id=project_id)

    response = client.messages.create(
        model=model, messages=[{"role": "user", "content": prompt}], max_tokens=1024
    )

    return response.content[0].text


# vertexai
def generate_vertexai(
    model: str,
    prompt: str,
    temperature: float = 0.7,
    json_mode: bool = True,
    json_schema: Optional[Dict[str, Any]] = None,
    **kwargs,
) -> str:
    """Generates text content using Vertex AI."""

    # For local development, run `gcloud auth application-default login` first to
    # create the application default credentials, which will be picked up
    # automatically here.
    credentials, project_id = google.auth.default()

    vertexai.init(
        project=project_id,
        location="us-central1",
        credentials=credentials,
    )
    model_endpoint = generative_models.GenerativeModel(model)

    # 1.5 flash doesn't support constrained decoding as of 6/5/2024, so we
    # disable json_schema for it. Otherwise, the library will throw an unsupported
    # error.
    if "flash" in model:
        json_schema = None

    response_mimetype = None
    if json_mode or json_schema is not None:
        response_mimetype = "application/json"
    config = generative_models.GenerationConfig(
        temperature=temperature,
        response_mime_type=response_mimetype,
        response_schema=json_schema,
    )

    # Safety config.
    safety_config = [
        generative_models.SafetySetting(
            category=generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold=generative_models.HarmBlockThreshold.BLOCK_NONE,
        ),
        generative_models.SafetySetting(
            category=generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold=generative_models.HarmBlockThreshold.BLOCK_NONE,
        ),
        generative_models.SafetySetting(
            category=generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold=generative_models.HarmBlockThreshold.BLOCK_NONE,
        ),
        generative_models.SafetySetting(
            category=generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold=generative_models.HarmBlockThreshold.BLOCK_NONE,
        ),
    ]
    response = model_endpoint.generate_content(
        prompt,
        generation_config=config,
        stream=False,
        safety_settings=safety_config,
    )
    assert isinstance(response, generative_models.GenerationResponse)

    return response.text
