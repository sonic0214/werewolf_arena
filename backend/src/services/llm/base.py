"""
LLM提供商抽象基类
LLM Provider Abstract Base Class
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class LLMProvider(ABC):
    """LLM提供商抽象基类

    所有LLM提供商（OpenAI, GLM, OpenRouter等）都需要实现这个接口
    """

    def __init__(self, config: Dict[str, Any]):
        """
        初始化LLM提供商

        Args:
            config: 配置字典，包含api_key, base_url等
        """
        self.config = config
        self.api_key = config.get("api_key")
        self.base_url = config.get("base_url")

    @abstractmethod
    def generate(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        json_mode: bool = True,
        response_schema: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        生成文本

        Args:
            model: 模型名称
            prompt: 提示词
            temperature: 温度参数（0-1）
            json_mode: 是否使用JSON模式
            response_schema: 响应schema（用于结构化输出）
            **kwargs: 其他参数

        Returns:
            生成的文本
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """
        健康检查

        Returns:
            是否健康
        """
        pass

    def validate_config(self) -> bool:
        """
        验证配置是否完整

        Returns:
            配置是否有效
        """
        return bool(self.api_key)
