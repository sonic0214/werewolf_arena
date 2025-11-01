"""
MiniMax LLM提供商
MiniMax LLM Provider (Anthropic Compatible API)
"""

from typing import Dict, Any, Optional
from openai import OpenAI

from ..base import LLMProvider


class MiniMaxProvider(LLMProvider):
    """MiniMax API提供商（使用Anthropic兼容接口）"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        # MiniMax使用Anthropic兼容的接口
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url or "https://api.minimaxi.com/anthropic"
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
        """使用MiniMax API生成文本"""
        response_format = {"type": "text"}
        if json_mode:
            response_format = {"type": "json_object"}

        # 构建消息数组
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

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
            # 简单的API调用测试
            return self.validate_config()
        except Exception as e:
            print(f"MiniMax health check failed: {e}")
            return False
