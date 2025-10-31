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

"""
LLM生成器
LLM Generator - 处理提示词模板和LLM调用
"""

from typing import Any, Dict, List, Optional, Tuple

import jinja2

from src.config import RETRIES
from src.core.models.logs import LmLog
from src.utils.helpers import parse_json


# 全局LLM客户端（将通过依赖注入设置）
_global_llm_client = None


def set_global_llm_client(client):
    """设置全局LLM客户端（用于向后兼容）"""
    global _global_llm_client
    _global_llm_client = client


def get_global_llm_client():
    """获取全局LLM客户端"""
    if _global_llm_client is None:
        raise RuntimeError(
            "Global LLM client not initialized. "
            "Call set_global_llm_client() first or use dependency injection."
        )
    return _global_llm_client


def format_prompt(prompt_template: str, worldstate: Dict[str, Any]) -> str:
    """
    使用Jinja2渲染提示词模板

    Args:
        prompt_template: Jinja2模板字符串
        worldstate: 模板变量字典

    Returns:
        渲染后的提示词
    """
    return jinja2.Template(prompt_template).render(worldstate)


def generate(
    prompt_template: str,
    response_schema: Dict[str, Any],
    worldstate: Dict[str, Any],
    model: str,
    temperature: float = 1.0,
    allowed_values: Optional[List[Any]] = None,
    result_key: Optional[str] = None,
    llm_client=None,
) -> Tuple[Any, LmLog]:
    """
    使用LLM生成文本并解析结果

    Args:
        prompt_template: Jinja2模板
        response_schema: 期望的响应schema
        worldstate: 游戏状态（用于渲染模板）
        model: 模型名称
        temperature: 温度参数
        allowed_values: 允许的值列表（用于验证）
        result_key: 从结果中提取的键
        llm_client: LLM客户端（可选，不提供则使用全局客户端）

    Returns:
        (result, log) 元组
    """
    # 获取LLM客户端
    if llm_client is None:
        llm_client = get_global_llm_client()

    # 渲染提示词
    prompt = format_prompt(prompt_template, worldstate)
    raw_responses = []

    # 重试逻辑
    for attempt in range(RETRIES):
        raw_resp = None
        try:
            # 调用LLM
            raw_resp = llm_client.call(
                model=model,
                prompt=prompt,
                temperature=temperature,
                json_mode=True,
                response_schema=response_schema,
            )

            # 解析JSON响应
            result = parse_json(raw_resp)

            # 某些模型可能返回数组，转换为字典
            if isinstance(result, list):
                first_dict = next((it for it in result if isinstance(it, dict)), None)
                result = first_dict if first_dict is not None else {"value": result}

            # 创建日志
            log = LmLog(prompt=prompt, raw_resp=raw_resp, result=result)

            # 提取特定键
            if result_key:
                if isinstance(result, dict):
                    result = result.get(result_key)
                else:
                    # 非字典结果无法提取键，触发重试
                    result = None

            # 验证结果
            if allowed_values is None or result in allowed_values:
                return result, log

            # 结果不在允许值中，记录并重试
            print(f"Result '{result}' not in allowed values {allowed_values}, retrying...")

        except Exception as e:
            print(f"Attempt {attempt + 1}/{RETRIES} failed: {e}")
            if raw_resp:
                print(f"Raw response snippet: {str(raw_resp)[:200]}")

            # 增加温度以获得更多样化的输出
            temperature = min(1.0, temperature + 0.2)

            # 保存响应以备后用
            raw_responses.append(raw_resp if isinstance(raw_resp, str) else "")

    # 所有重试都失败
    return None, LmLog(
        prompt=prompt,
        raw_resp="-------".join(raw_responses),
        result=None
    )
