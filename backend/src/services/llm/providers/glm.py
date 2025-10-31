"""
GLM (智谱AI) LLM提供商
GLM (ZhipuAI) LLM Provider
"""

from typing import Dict, Any, Optional
from openai import OpenAI

from ..base import LLMProvider


class GLMProvider(LLMProvider):
    """GLM API提供商（使用OpenAI兼容接口）"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        # GLM使用OpenAI兼容的接口
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url or "https://open.bigmodel.cn/api/paas/v4"
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
        """使用GLM API生成文本"""
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
            # GLM可能没有models.list接口，所以只检查配置
            return self.validate_config()
        except Exception as e:
            print(f"GLM health check failed: {e}")
            return False
