"""
LLM统一客户端
Unified LLM Client
"""

from typing import Dict, Optional, Any

from .base import LLMProvider
from .factory import LLMFactory


class LLMClient:
    """LLM统一客户端

    管理多个LLM提供商，根据模型名称自动路由到对应的提供商
    """

    def __init__(self, providers: Dict[str, LLMProvider]):
        """
        初始化LLM客户端

        Args:
            providers: 提供商字典 {provider_name: provider_instance}
        """
        self.providers = providers

    def call(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        json_mode: bool = True,
        response_schema: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        调用LLM生成文本

        Args:
            model: 模型ID，格式如 "glm/GLM-Z1-Flash" 或 "gpt-4o"
            prompt: 提示词
            temperature: 温度参数
            json_mode: 是否使用JSON模式
            response_schema: 响应schema
            **kwargs: 其他参数

        Returns:
            生成的文本

        Raises:
            ValueError: 找不到对应的提供商
        """
        provider = self._get_provider_for_model(model)

        # 如果model包含提供商前缀（如 glm/），去掉前缀
        if "/" in model:
            model = model.split("/", 1)[1]

        return provider.generate(
            model=model,
            prompt=prompt,
            temperature=temperature,
            json_mode=json_mode,
            response_schema=response_schema,
            **kwargs
        )

    def _get_provider_for_model(self, model: str) -> LLMProvider:
        """
        根据模型名称获取对应的提供商

        Args:
            model: 模型ID

        Returns:
            LLM提供商实例

        Raises:
            ValueError: 找不到对应的提供商
        """
        # 检查是否有显式的提供商前缀
        if model.startswith("glm/"):
            return self._get_provider("glm")
        elif model.startswith("openrouter/"):
            return self._get_provider("openrouter")
        elif "gpt" in model.lower():
            return self._get_provider("openai")
        elif "claude" in model.lower():
            # Claude模型可能通过OpenRouter访问
            if "openrouter" in self.providers:
                return self._get_provider("openrouter")
            raise ValueError(
                f"No provider available for model: {model}. "
                "Claude models require OpenRouter provider."
            )
        else:
            # 默认尝试GLM
            if "glm" in self.providers:
                return self._get_provider("glm")
            raise ValueError(f"No provider available for model: {model}")

    def _get_provider(self, provider_name: str) -> LLMProvider:
        """
        获取指定的提供商

        Args:
            provider_name: 提供商名称

        Returns:
            LLM提供商实例

        Raises:
            ValueError: 提供商未配置
        """
        provider = self.providers.get(provider_name)
        if not provider:
            raise ValueError(
                f"Provider '{provider_name}' not configured. "
                f"Available providers: {', '.join(self.providers.keys())}"
            )
        return provider

    def health_check(self) -> Dict[str, bool]:
        """
        检查所有提供商的健康状态

        Returns:
            {provider_name: is_healthy}
        """
        return {
            name: provider.health_check()
            for name, provider in self.providers.items()
        }

    @classmethod
    def from_settings(cls, settings):
        """
        从配置创建LLM客户端

        Args:
            settings: Settings对象

        Returns:
            LLMClient实例
        """
        providers = {}

        # 配置GLM
        if settings.llm.glm_api_key:
            providers["glm"] = LLMFactory.create("glm", {
                "api_key": settings.llm.glm_api_key,
                "base_url": settings.llm.glm_base_url,
            })

        # 配置OpenAI
        if settings.llm.openai_api_key:
            providers["openai"] = LLMFactory.create("openai", {
                "api_key": settings.llm.openai_api_key,
                "base_url": settings.llm.openai_base_url,
            })

        # 配置OpenRouter
        if settings.llm.openrouter_api_key:
            providers["openrouter"] = LLMFactory.create("openrouter", {
                "api_key": settings.llm.openrouter_api_key,
                "base_url": settings.llm.openrouter_base_url,
                "referrer": settings.llm.openrouter_referrer,
                "app_title": settings.llm.openrouter_app_title,
            })

        if not providers:
            raise RuntimeError(
                "No LLM providers configured. "
                "Please set at least one API key in configuration."
            )

        return cls(providers)
