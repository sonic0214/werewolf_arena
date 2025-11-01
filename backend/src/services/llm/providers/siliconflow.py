"""
硅基流动API提供商
SiliconFlow API Provider
"""

from typing import Dict, Any, Optional
from openai import OpenAI

from ..base import LLMProvider


class SiliconFlowProvider(LLMProvider):
    """硅基流动API提供商"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        # 硅基流动使用OpenAI兼容的API接口
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.siliconflow.cn/v1"
        )

    def generate(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        json_mode: bool = True,
        response_schema: Optional[Dict[str, Any]] = None,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """使用硅基流动API生成文本"""

        messages = []

        # 添加系统消息（如果有）
        if system_message:
            messages.append({"role": "system", "content": system_message})

        # 添加用户消息
        messages.append({"role": "user", "content": prompt})

        # 设置响应格式
        response_format = {"type": "text"}
        if json_mode:
            response_format = {"type": "json_object"}

        response = self.client.chat.completions.create(
            messages=messages,
            response_format=response_format,
            model=model,
            temperature=temperature,
            **kwargs
        )

        return response.choices[0].message.content

    def health_check(self) -> bool:
        """健康检查"""
        try:
            # 简单的模型列表检查
            self.client.models.list()
            return True
        except Exception as e:
            print(f"SiliconFlow health check failed: {e}")
            return False