"""
配置模块导出
Configuration Module Exports
"""

from .settings import (
    Settings,
    GameSettings,
    LLMSettings,
    ServerSettings,
    CORSSettings,
    PathSettings,
    settings,
    # 向后兼容的常量
    NUM_PLAYERS,
    MAX_DEBATE_TURNS,
    DEFAULT_THREADS,
    RETRIES,
    RUN_SYNTHETIC_VOTES,
)

from .loader import ModelRegistry, ModelConfig, model_registry

__all__ = [
    # Settings类
    "Settings",
    "GameSettings",
    "LLMSettings",
    "ServerSettings",
    "CORSSettings",
    "PathSettings",
    # 全局实例
    "settings",
    # 向后兼容常量
    "NUM_PLAYERS",
    "MAX_DEBATE_TURNS",
    "DEFAULT_THREADS",
    "RETRIES",
    "RUN_SYNTHETIC_VOTES",
    # 模型注册表
    "ModelRegistry",
    "ModelConfig",
    "model_registry",
]
