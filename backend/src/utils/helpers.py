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

"""utility functions."""

from typing import Any, Dict, Optional
import yaml
from abc import ABC
from abc import abstractmethod
import marko
import re


def clean_mixed_language_response(text: str) -> str:
    """
    清理混合中英文的响应，尝试提取纯JSON部分

    Args:
        text: 原始文本

    Returns:
        清理后的文本
    """
    print(f"[语言清理] 开始清理混合语言响应...")

    if not text:
        return text

    # 尝试多种策略提取JSON内容

    # 策略1: 查找被```json和```包围的内容
    json_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
    match = re.search(json_pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        json_content = match.group(1).strip()
        print(f"[语言清理] 策略1成功：提取到JSON代码块内容")
        return json_content

    # 策略2: 查找第一个完整的JSON对象（从{到最后一个}）
    brace_count = 0
    start_idx = None
    for i, char in enumerate(text):
        if char == '{':
            if brace_count == 0:
                start_idx = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and start_idx is not None:
                json_content = text[start_idx:i+1].strip()
                # 验证是否看起来像有效的JSON
                if json_content.count('{') == json_content.count('}'):
                    print(f"[语言清理] 策略2成功：提取到完整JSON对象")
                    return json_content

    # 策略3: 如果没有找到JSON，返回原文本但清理明显的非JSON前缀/后缀
    lines = text.split('\n')
    json_lines = []
    in_json = False

    for line in lines:
        line = line.strip()
        # 跳过明显的非JSON行
        if line.startswith(('我认为', '我认为', 'I think', 'As an AI', '作为一个', '以下是', '以下是', 'Here is')):
            continue
        # 检查是否包含JSON结构
        if ('{' in line and '}' in line) or in_json:
            in_json = True
            json_lines.append(line)
        # 如果看起来已经结束了JSON，继续收集后续行以防换行

    if json_lines:
        cleaned = '\n'.join(json_lines)
        print(f"[语言清理] 策略3：提取到可能的JSON内容")
        return cleaned

    print(f"[语言清理] 所有清理策略都失败，返回原文本")
    return text


def parse_json(text: str) -> Optional[Any]:
    print(f"[JSON解析] 开始解析，输入文本长度: {len(text)} 字符")
    print(f"[JSON解析] 输入文本预览: {text[:100]}..." if len(text) > 100 else f"[JSON解析] 输入文本: {text}")

    # 预处理：清理混合中英文内容，尝试提取纯JSON部分
    cleaned_text = clean_mixed_language_response(text)
    if cleaned_text != text:
        print(f"[JSON解析] 检测到混合语言内容，已清理")
        print(f"[JSON解析] 清理后文本预览: {cleaned_text[:100]}..." if len(cleaned_text) > 100 else f"[JSON解析] 清理后文本: {cleaned_text}")

    # 首先尝试解析markdown中的JSON
    print(f"[JSON解析] 尝试从markdown中解析JSON...")
    result_json = parse_json_markdown(cleaned_text)
    print(f"[JSON解析] markdown解析结果: {result_json}")

    if not result_json:
        print(f"[JSON解析] markdown解析失败，尝试直接解析JSON字符串...")
        result_json = parse_json_str(cleaned_text)
        print(f"[JSON解析] 直接解析结果: {result_json}")

    print(f"[JSON解析] 最终结果: {result_json}")
    return result_json


def parse_json_markdown(text: str) -> Optional[Any]:
    print(f"[Markdown解析] 开始解析markdown文本...")

    try:
        ast = marko.parse(text)
        print(f"[Markdown解析] AST解析成功，子元素数量: {len(ast.children) if ast.children else 0}")
    except Exception as e:
        print(f"[Markdown解析] AST解析失败: {e}")
        return None

    # 检查AST结构
    if not ast.children:
        print(f"[Markdown解析] AST没有子元素")
        return None

    print(f"[Markdown解析] 开始遍历AST子元素...")
    for i, c in enumerate(ast.children):
        print(f"[Markdown解析] 处理第{i}个子元素，类型: {type(c)}")

        # 检查是否是代码块
        if hasattr(c, "lang"):
            print(f"[Markdown解析] 找到代码块，语言: {c.lang}")
            if c.lang.lower() == "json":
                print(f"[Markdown解析] 找到JSON代码块")

                # 详细调试c.children的状态
                print(f"[Markdown调试] c.children 类型: {type(c.children)}")
                print(f"[Markdown调试] c.children 值: {c.children}")

                # 安全检查c.children
                try:
                    children_list = list(c.children) if c.children is not None else []
                    print(f"[Markdown调试] 转换为列表成功，长度: {len(children_list)}")
                except Exception as e:
                    print(f"[Markdown调试] 转换c.children为列表失败: {e}")
                    print(f"[Markdown调试] c.children详细属性: {dir(c)}")
                    continue

                # Check if c.children exists and has at least one element
                if children_list and len(children_list) > 0:
                    print(f"[Markdown解析] JSON代码块有 {len(children_list)} 个子元素")

                    # 安全访问第一个子元素
                    try:
                        first_child = children_list[0]
                        print(f"[Markdown解析] 第一个子元素类型: {type(first_child)}")
                        print(f"[Markdown调试] 第一个子元素: {first_child}")
                    except Exception as e:
                        print(f"[Markdown错误] 访问第一个子元素失败: {e}")
                        continue

                    if hasattr(first_child, "children") and first_child.children:
                        try:
                            json_str = first_child.children
                            print(f"[Markdown解析] 提取到JSON字符串: {json_str}")
                            result = parse_json_str(json_str)
                            print(f"[Markdown解析] JSON字符串解析结果: {result}")
                            return result
                        except Exception as e:
                            print(f"[Markdown错误] 处理first_child.children失败: {e}")
                    else:
                        print(f"[Markdown解析] 第一个子元素没有children属性或children为空")
                        # 尝试直接使用子元素作为字符串
                        if hasattr(first_child, '__str__'):
                            try:
                                json_str = str(first_child)
                                print(f"[Markdown解析] 尝试将第一个子元素转换为字符串: {json_str}")
                                result = parse_json_str(json_str)
                                print(f"[Markdown解析] 转换后JSON解析结果: {result}")
                                return result
                            except Exception as e:
                                print(f"[Markdown错误] 转换first_child为字符串失败: {e}")
                        else:
                            print(f"[Markdown错误] 第一个子元素没有__str__方法")
                else:
                    print(f"[Markdown解析] JSON代码块没有子元素")
            else:
                print(f"[Markdown解析] 代码块语言不是JSON: {c.lang}")
        else:
            print(f"[Markdown解析] 子元素不是代码块，类型: {type(c)}")
            print(f"[Markdown调试] 子元素属性: {dir(c)}")

    print(f"[Markdown解析] 没有找到有效的JSON代码块")
    return None


def parse_json_str(text: str) -> Optional[Any]:
    print(f"[JSON字符串解析] 开始解析，输入文本: '{text}'")
    print(f"[JSON字符串解析] 文本长度: {len(text)} 字符")

    if not text:
        print(f"[JSON字符串解析] 输入文本为空")
        return None

    try:
        print(f"[JSON字符串解析] 使用yaml.safe_load解析...")
        # use yaml.safe_load which handles missing quotes around field names.
        result_json = yaml.safe_load(text)
        print(f"[JSON字符串解析] yaml.safe_load成功，结果类型: {type(result_json)}, 内容: {result_json}")
    except yaml.parser.ParserError as e:
        print(f"[JSON字符串解析] YAML解析器错误: {e}")
        print(f"[JSON字符串解析] 详细错误位置信息 - 这通常是因为JSON格式不正确")
        return None
    except Exception as e:
        # Log any other parsing errors
        print(f"[JSON字符串解析] 其他解析错误: {type(e).__name__}: {e}")
        print(f"[JSON字符串解析] 错误详情，这可能是由于JSON格式问题或内容不符合预期")
        return None

    print(f"[JSON字符串解析] 解析完成，返回: {result_json}")
    return result_json


class Deserializable(ABC):
    @classmethod
    @abstractmethod
    def from_json(cls, data: dict[Any, Any]):
        pass
