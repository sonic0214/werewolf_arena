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
import sys

from typing import Any, Optional, Dict
import google
import vertexai
# from vertexai.preview import generative_models
# from anthropic import AnthropicVertex

# 导入API配置
sys.path.append('..')
from api_config import api_config


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
    # 从配置文件获取API密钥
    base_url = api_config.get_api_base_url("glm")
    api_key = api_config.get_api_key("glm")

    # 如果配置文件中没有，回退到环境变量
    if not api_key:
        api_key = os.environ.get("GLM_API_KEY") or os.environ.get("ZHIPU_API_KEY")

    if not api_key:
        raise RuntimeError("Missing GLM API key. Please set GLM_API_KEY in api_config.json or environment variable")

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


# anthropic - 已禁用以避免Google Cloud认证问题
def generate_authropic(model: str, prompt: str, **kwargs):
    """Anthropic Claude API - 已禁用，使用GLM替代"""
    raise RuntimeError("Anthropic API is disabled. Please use GLM models instead.")


# vertexai - 已禁用以避免Google Cloud认证问题
def generate_vertexai(
    model: str,
    prompt: str,
    temperature: float = 0.7,
    json_mode: bool = True,
    json_schema: Optional[Dict[str, Any]] = None,
    **kwargs,
) -> str:
    """Google Vertex AI - 已禁用，使用GLM替代"""
    raise RuntimeError("Google Vertex AI is disabled. Please use GLM models like glmz1-flash instead.")
