"""
OpenAI LLM提供商
OpenAI LLM Provider
"""

from typing import Dict, Any, Optional
from openai import OpenAI

from ..base import LLMProvider


class OpenAIProvider(LLMProvider):
    """OpenAI API提供商"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    def generate(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        json_mode: bool = True,
        response_schema: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """使用OpenAI API生成文本"""
        response_format = {"type": "text"}
        if json_mode:
            response_format = {"type": "json_object"}

        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            response_format=response_format,
            model=model,
            temperature=temperature,
            **kwargs
        )

        return response.choices[0].message.content

    def health_check(self) -> bool:
        """健康检查"""
        try:
            # 简单的API调用测试
            self.client.models.list()
            return True
        except Exception as e:
            print(f"OpenAI health check failed: {e}")
            return False
