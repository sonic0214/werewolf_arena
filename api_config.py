#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
API配置文件
API Configuration File
"""

import os
import json
from typing import Dict, Optional

class APIConfig:
    """API配置管理类"""

    def __init__(self, config_file: str = "api_config.json"):
        self.config_file = config_file
        self.config = self._load_config()

    def _load_config(self) -> Dict:
        """加载配置文件"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ 配置文件读取失败: {e}")
                return self._get_default_config()
        else:
            print(f"📝 创建默认配置文件: {self.config_file}")
            default_config = self._get_default_config()
            self._save_config(default_config)
            return default_config

    def _get_default_config(self) -> Dict:
        """获取默认配置"""
        return {
            "apis": {
                "glm": {
                    "api_key": os.environ.get("GLM_API_KEY") or os.environ.get("ZHIPU_API_KEY") or "",
                    "base_url": "https://open.bigmodel.cn/api/paas/v4",
                    "description": "智谱AI GLM API"
                },
                "openai": {
                    "api_key": os.environ.get("OPENAI_API_KEY") or "",
                    "base_url": "https://api.openai.com/v1",
                    "description": "OpenAI API"
                },
                "openrouter": {
                    "api_key": os.environ.get("OPENROUTER_API_KEY") or "",
                    "base_url": os.environ.get("OPENROUTER_BASE_URL") or "https://openrouter.ai/api/v1",
                    "description": "OpenRouter API"
                }
            },
            "models": {
                "glmz1-flash": {
                    "api_type": "glm",
                    "model_name": "GLM-Z1-Flash",
                    "enabled": True
                },
                "glm45-flash": {
                    "api_type": "glm",
                    "model_name": "GLM-4.5-Flash",
                    "enabled": True
                },
                "gpt4o": {
                    "api_type": "openai",
                    "model_name": "gpt-4o",
                    "enabled": False
                },
                "flash": {
                    "api_type": "google_cloud",
                    "model_name": "gemini-1.5-flash-001",
                    "enabled": False
                }
            },
            "google_cloud": {
                "enabled": False,
                "project_id": "",
                "description": "Google Cloud API (已禁用，优先使用GLM)"
            }
        }

    def _save_config(self, config: Dict):
        """保存配置文件"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            print(f"✅ 配置已保存到: {self.config_file}")
        except Exception as e:
            print(f"❌ 配置文件保存失败: {e}")

    def get_api_key(self, api_type: str) -> str:
        """获取API密钥"""
        return self.config.get("apis", {}).get(api_type, {}).get("api_key", "")

    def get_api_base_url(self, api_type: str) -> str:
        """获取API基础URL"""
        return self.config.get("apis", {}).get(api_type, {}).get("base_url", "")

    def get_model_config(self, model_name: str) -> Dict:
        """获取模型配置"""
        return self.config.get("models", {}).get(model_name, {})

    def is_model_enabled(self, model_name: str) -> bool:
        """检查模型是否启用"""
        model_config = self.get_model_config(model_name)
        if not model_config:
            return False
        return model_config.get("enabled", False)

    def get_model_api_type(self, model_name: str) -> str:
        """获取模型API类型"""
        model_config = self.get_model_config(model_name)
        if not model_config:
            return ""
        return model_config.get("api_type", "")

    def is_google_cloud_enabled(self) -> bool:
        """检查Google Cloud是否启用"""
        return self.config.get("google_cloud", {}).get("enabled", False)

    def update_api_key(self, api_type: str, api_key: str):
        """更新API密钥"""
        if "apis" not in self.config:
            self.config["apis"] = {}
        if api_type not in self.config["apis"]:
            self.config["apis"][api_type] = {}

        self.config["apis"][api_type]["api_key"] = api_key
        self._save_config(self.config)
        print(f"✅ {api_type} API密钥已更新")

    def enable_model(self, model_name: str, enabled: bool = True):
        """启用/禁用模型"""
        if "models" not in self.config:
            self.config["models"] = {}
        if model_name not in self.config["models"]:
            self.config["models"][model_name] = {}

        self.config["models"][model_name]["enabled"] = enabled
        self._save_config(self.config)
        print(f"✅ 模型 {model_name} {'已启用' if enabled else '已禁用'}")

    def get_status(self) -> Dict:
        """获取配置状态"""
        status = {
            "config_file": self.config_file,
            "apis": {},
            "models": {},
            "google_cloud": self.config.get("google_cloud", {})
        }

        # API状态
        for api_type, api_config in self.config.get("apis", {}).items():
            api_key = api_config.get("api_key", "")
            status["apis"][api_type] = {
                "configured": bool(api_key),
                "key_preview": api_key[:10] + "..." if len(api_key) > 10 else "",
                "base_url": api_config.get("base_url", "")
            }

        # 模型状态
        for model_name, model_config in self.config.get("models", {}).items():
            status["models"][model_name] = {
                "enabled": model_config.get("enabled", False),
                "api_type": model_config.get("api_type", ""),
                "model_name": model_config.get("model_name", "")
            }

        return status

# 全局配置实例
api_config = APIConfig()