"""
延迟配置加载器
Timing Configuration Loader

从YAML文件加载游戏延迟配置，并支持运行时调整
"""

import yaml
from pathlib import Path
from typing import Dict, Any
from dataclasses import dataclass
import os


@dataclass
class TimingConfig:
    """延迟配置数据类"""
    # 游戏流程延迟
    action_delay: float = 2.0
    debate_delay: float = 3.0
    night_action_delay: float = 5.0
    summary_delay: float = 3.0

    # 前端刷新
    frontend_refresh_interval: int = 5000
    game_status_refresh_interval: int = 2000

    # UI动画
    ui_animation_delay: int = 300
    message_display_delay: int = 1000
    page_transition_delay: int = 500

    # API和网络
    api_request_timeout: int = 30
    retry_delay: float = 2.0
    heartbeat_interval: int = 30

    # 开发调试
    dev_fast_refresh: int = 1000
    debug_info_interval: int = 500

    # 特殊模式
    fast_game_multiplier: float = 0.5
    slow_game_multiplier: float = 2.0
    demo_mode_multiplier: float = 1.5


class TimingConfigLoader:
    """延迟配置加载器"""

    def __init__(self, config_file: str = None):
        """
        初始化配置加载器

        Args:
            config_file: 配置文件路径，默认为 timing_config.yaml
        """
        if config_file is None:
            # 默认配置文件路径
            config_dir = Path(__file__).parent
            config_file = config_dir / "timing_config.yaml"

        self.config_file = Path(config_file)
        self._config: TimingConfig = None
        self._load_config()

    def _load_config(self):
        """加载配置文件"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config_data = yaml.safe_load(f)

                # 转换为TimingConfig对象
                self._config = TimingConfig(**config_data)
                print(f"✅ 已加载延迟配置: {self.config_file}")
            else:
                print(f"⚠️ 配置文件不存在，使用默认配置: {self.config_file}")
                self._config = TimingConfig()
        except Exception as e:
            print(f"❌ 加载延迟配置失败: {e}")
            self._config = TimingConfig()

    def get_config(self) -> TimingConfig:
        """获取配置对象"""
        return self._config

    def get_delay(self, delay_type: str, multiplier: float = 1.0) -> float:
        """
        获取指定类型的延迟值

        Args:
            delay_type: 延迟类型 (action, debate, night_action, summary等)
            multiplier: 延迟倍数，用于快速/慢速游戏模式

        Returns:
            延迟时间（秒或毫秒，根据类型决定）
        """
        delay_attr = f"{delay_type}_delay"
        if hasattr(self._config, delay_attr):
            base_delay = getattr(self._config, delay_attr)
            return base_delay * multiplier
        else:
            print(f"⚠️ 未知的延迟类型: {delay_type}")
            return 1.0  # 默认延迟

    def get_interval(self, interval_type: str) -> int:
        """
        获取指定类型的间隔时间

        Args:
            interval_type: 间隔类型 (frontend_refresh, game_status_refresh等)

        Returns:
            间隔时间（毫秒）
        """
        interval_attr = f"{interval_type}_interval"
        if hasattr(self._config, interval_attr):
            return getattr(self._config, interval_attr)
        else:
            print(f"⚠️ 未知的间隔类型: {interval_type}")
            return 1000  # 默认间隔

    def apply_game_mode(self, game_mode: str = "normal"):
        """
        应用游戏模式延迟倍数

        Args:
            game_mode: 游戏模式 (normal, fast, slow, demo)
        """
        multipliers = {
            "normal": 1.0,
            "fast": self._config.fast_game_multiplier,
            "slow": self._config.slow_game_multiplier,
            "demo": self._config.demo_mode_multiplier
        }

        multiplier = multipliers.get(game_mode, 1.0)
        print(f"🎮 应用游戏模式 {game_mode}，延迟倍数: {multiplier}x")

        return multiplier

    def reload_config(self):
        """重新加载配置文件"""
        print("🔄 重新加载延迟配置...")
        self._load_config()

    def export_to_dict(self) -> Dict[str, Any]:
        """导出配置为字典"""
        return {
            "action_delay": self._config.action_delay,
            "debate_delay": self._config.debate_delay,
            "night_action_delay": self._config.night_action_delay,
            "summary_delay": self._config.summary_delay,
            "frontend_refresh_interval": self._config.frontend_refresh_interval,
            "game_status_refresh_interval": self._config.game_status_refresh_interval,
            "ui_animation_delay": self._config.ui_animation_delay,
            "message_display_delay": self._config.message_display_delay,
            "page_transition_delay": self._config.page_transition_delay,
            "api_request_timeout": self._config.api_request_timeout,
            "retry_delay": self._config.retry_delay,
            "heartbeat_interval": self._config.heartbeat_interval,
            "dev_fast_refresh": self._config.dev_fast_refresh,
            "debug_info_interval": self._config.debug_info_interval,
            "fast_game_multiplier": self._config.fast_game_multiplier,
            "slow_game_multiplier": self._config.slow_game_multiplier,
            "demo_mode_multiplier": self._config.demo_mode_multiplier,
        }


# 全局配置加载器实例
timing_loader = TimingConfigLoader()

# 提供便捷访问函数
def get_timing_config() -> TimingConfig:
    """获取延迟配置"""
    return timing_loader.get_config()

def get_delay(delay_type: str, multiplier: float = 1.0) -> float:
    """获取延迟时间"""
    return timing_loader.get_delay(delay_type, multiplier)

def get_interval(interval_type: str) -> int:
    """获取间隔时间"""
    return timing_loader.get_interval(interval_type)

def apply_game_mode(game_mode: str = "normal") -> float:
    """应用游戏模式"""
    return timing_loader.apply_game_mode(game_mode)