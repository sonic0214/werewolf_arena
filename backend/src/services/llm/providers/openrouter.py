"""
OpenRouter LLM提供商
OpenRouter LLM Provider
"""

from typing import Dict, Any, Optional
from openai import OpenAI

from ..base import LLMProvider


class OpenRouterProvider(LLMProvider):
    """OpenRouter API提供商（使用OpenAI兼容接口）"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)

        # 准备额外的headers
        default_headers = {}
        referer = config.get("referrer")
        app_title = config.get("app_title", "Werewolf Arena")

        if referer:
            default_headers["HTTP-Referer"] = referer
        if app_title:
            default_headers["X-Title"] = app_title

        # OpenRouter使用OpenAI兼容的接口
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url or "https://openrouter.ai/api/v1",
            default_headers=default_headers or None
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
        """使用OpenRouter API生成文本"""
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
            # 检查配置是否有效
            return self.validate_config()
        except Exception as e:
            print(f"OpenRouter health check failed: {e}")
            return False
