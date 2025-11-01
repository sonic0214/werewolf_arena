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
            # 添加强制中文系统消息
            system_message = "你必须使用纯中文回答所有问题。你是狼人杀游戏的AI玩家，所有发言、推理和互动都必须使用中文。返回的JSON格式响应中，所有字段值都必须是中文内容，不允许使用任何英文单词。请确保你的回答完全是中文格式，包括JSON中的所有字符串值。"

            # 详细的调试日志
            print(f"[LLM调用] 第{attempt + 1}/{RETRIES}次尝试 | 模型: {model} | 温度: {temperature:.2f}")

            # 调用LLM
            raw_resp = llm_client.call(
                model=model,
                prompt=prompt,
                temperature=temperature,
                json_mode=True,
                response_schema=response_schema,
                system_message=system_message,
            )

            print(f"[LLM响应] 成功获取响应，长度: {len(raw_resp) if raw_resp else 0} 字符")

            # 完整输出LLM原始响应用于调试
            if raw_resp:
                print(f"[LLM原始响应开始]")
                print(raw_resp)
                print(f"[LLM原始响应结束]")
            else:
                print(f"[LLM警告] 原始响应为空")

            print(f"[JSON解析] 开始解析响应...")
            # 解析JSON响应
            result = parse_json(raw_resp)
            print(f"[JSON解析] 解析完成，结果类型: {type(result)}, 内容: {result}")

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
                    print(f"[LLM结果] 提取键 '{result_key}': {result}")
                else:
                    # 非字典结果无法提取键，触发重试
                    print(f"[LLM警告] 结果不是字典类型，无法提取键 '{result_key}'，将重试")
                    result = None

            # 验证结果
            if allowed_values is None or result in allowed_values:
                print(f"[LLM成功] 返回有效结果: {result}")
                return result, log

            # 结果不在允许值中，记录并重试
            print(f"[LLM警告] 结果 '{result}' 不在允许值 {allowed_values} 中，将重试...")

        except Exception as e:
            print(f"[LLM调用错误] 第{attempt + 1}/{RETRIES}次失败: {type(e).__name__}: {e}")
            print(f"[错误详情] 这是一个LLM调用异常，不是JSON解析异常")

            if raw_resp:
                print(f"[LLM错误时的完整响应开始]")
                print(raw_resp)
                print(f"[LLM错误时的完整响应结束]")
                # 截取响应的前200个字符用于调试
                resp_snippet = str(raw_resp)[:200].replace('\n', ' ')
                print(f"[LLM响应片段] {resp_snippet}")
            else:
                print(f"[LLM错误] 没有获取到任何响应内容")

            # 增加温度以获得更多样化的输出
            temperature = min(1.0, temperature + 0.2)

            # 保存响应以备后用
            raw_responses.append(raw_resp if isinstance(raw_resp, str) else "")

    # 所有重试都失败
    print(f"[LLM失败] 所有{RETRIES}次重试均失败，返回None")
    return None, LmLog(
        prompt=prompt,
        raw_resp="-------".join(raw_responses),
        result=None
    )
