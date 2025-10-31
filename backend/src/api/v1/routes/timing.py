"""
延迟配置API路由
Timing Configuration API Routes

提供前端延迟配置查询接口
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import os

from src.config.timing_loader import timing_loader

router = APIRouter()

@router.get("/timing", response_model=Dict[str, Any])
async def get_timing_config():
    """
    获取延迟配置
    Get timing configuration for frontend

    Returns:
        Dict containing all timing configuration values in milliseconds
    """
    try:
        config = timing_loader.get_config()

        # 转换为前端友好的格式（毫秒）
        timing_config = {
            # 游戏流程延迟（毫秒）
            "action_delay": int(config.action_delay * 1000),
            "debate_delay": int(config.debate_delay * 1000),
            "night_action_delay": int(config.night_action_delay * 1000),
            "summary_delay": int(config.summary_delay * 1000),

            # 前端刷新间隔（毫秒）
            "frontend_refresh_interval": config.frontend_refresh_interval,
            "game_status_refresh_interval": config.game_status_refresh_interval,

            # UI动画延迟（毫秒）
            "ui_animation_delay": config.ui_animation_delay,
            "message_display_delay": config.message_display_delay,
            "page_transition_delay": config.page_transition_delay,

            # API和网络配置（毫秒）
            "api_request_timeout": config.api_request_timeout * 1000,
            "retry_delay": int(config.retry_delay * 1000),
            "heartbeat_interval": config.heartbeat_interval * 1000,

            # 开发调试配置（毫秒）
            "dev_fast_refresh": config.dev_fast_refresh,
            "debug_info_interval": config.debug_info_interval,

            # 特殊模式倍数
            "fast_game_multiplier": config.fast_game_multiplier,
            "slow_game_multiplier": config.slow_game_multiplier,
            "demo_mode_multiplier": config.demo_mode_multiplier,
        }

        return timing_config

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get timing configuration: {str(e)}"
        )

@router.post("/timing/reload")
async def reload_timing_config():
    """
    重新加载延迟配置
    Reload timing configuration from file

    Returns:
        Success message
    """
    try:
        timing_loader.reload_config()
        return {"message": "Timing configuration reloaded successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reload timing configuration: {str(e)}"
        )

@router.get("/timing/summary")
async def get_timing_summary():
    """
    获取延迟配置摘要
    Get timing configuration summary

    Returns:
        Summary of current timing configuration
    """
    try:
        config = timing_loader.get_config()

        summary = {
            "game_flow": {
                "action_delay": f"{config.action_delay}s",
                "debate_delay": f"{config.debate_delay}s",
                "night_action_delay": f"{config.night_action_delay}s",
                "summary_delay": f"{config.summary_delay}s"
            },
            "frontend": {
                "refresh_interval": f"{config.frontend_refresh_interval}ms",
                "game_status_interval": f"{config.game_status_refresh_interval}ms",
                "ui_animation": f"{config.ui_animation_delay}ms"
            },
            "modes": {
                "fast_multiplier": f"{config.fast_game_multiplier}x",
                "slow_multiplier": f"{config.slow_game_multiplier}x",
                "demo_multiplier": f"{config.demo_mode_multiplier}x"
            }
        }

        return summary

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get timing summary: {str(e)}"
        )