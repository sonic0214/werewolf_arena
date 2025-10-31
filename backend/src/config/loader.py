"""
模型配置加载器
Model Configuration Loader
"""

import yaml
from pathlib import Path
from typing import Dict, Optional, Any
from dataclasses import dataclass


@dataclass
class ModelConfig:
    """单个模型配置"""
    id: str
    provider: str
    model_name: str
    enabled: bool
    description: str

    def to_full_id(self) -> str:
        """转换为完整的模型ID，如 glm/GLM-Z1-Flash"""
        return f"{self.provider}/{self.model_name}"


class ModelRegistry:
    """模型注册表"""

    def __init__(self, config_path: Optional[Path] = None):
        if config_path is None:
            config_path = Path(__file__).parent / "models.yaml"

        self.config_path = config_path
        self.models: Dict[str, ModelConfig] = {}
        self.aliases: Dict[str, str] = {}
        self._load_config()

    def _load_config(self):
        """加载模型配置"""
        if not self.config_path.exists():
            print(f"Warning: Model config not found at {self.config_path}")
            return

        with open(self.config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)

        # 加载模型
        for model_id, model_data in config.get("models", {}).items():
            self.models[model_id] = ModelConfig(
                id=model_id,
                provider=model_data["provider"],
                model_name=model_data["model_name"],
                enabled=model_data.get("enabled", True),
                description=model_data.get("description", ""),
            )

        # 加载别名
        self.aliases = config.get("aliases", {})

    def get_model(self, model_id: str) -> Optional[ModelConfig]:
        """获取模型配置"""
        # 先检查别名
        if model_id in self.aliases:
            model_id = self.aliases[model_id]

        return self.models.get(model_id)

    def get_enabled_models(self) -> Dict[str, ModelConfig]:
        """获取所有启用的模型"""
        return {k: v for k, v in self.models.items() if v.enabled}

    def list_models(self) -> list[Dict[str, Any]]:
        """列出所有模型（用于API返回）"""
        return [
            {
                "id": model.id,
                "provider": model.provider,
                "model_name": model.model_name,
                "enabled": model.enabled,
                "description": model.description,
            }
            for model in self.models.values()
        ]

    def is_model_enabled(self, model_id: str) -> bool:
        """检查模型是否启用"""
        model = self.get_model(model_id)
        return model.enabled if model else False

    def get_full_model_id(self, model_id: str) -> str:
        """
        获取完整的模型ID
        例如: glmz1-flash -> glm/GLM-Z1-Flash
        """
        model = self.get_model(model_id)
        if model:
            return model.to_full_id()

        # 如果已经是完整格式（包含/），直接返回
        if "/" in model_id:
            return model_id

        # 兼容旧的model_to_id逻辑
        # 检查是否以特定前缀开头
        if model_id.startswith("glm"):
            return f"glm/{model_id}"
        elif model_id.startswith("openrouter/") or model_id.startswith("or-"):
            return model_id.replace("or-", "openrouter/", 1)
        elif "gpt" in model_id:
            return model_id  # OpenAI模型直接使用

        return model_id


# 全局模型注册表实例
model_registry = ModelRegistry()
