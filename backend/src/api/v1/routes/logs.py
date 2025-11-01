"""
日志 API 路由
Logs API Routes for retrieving game logs
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from src.services.logger.realtime_logger import realtime_logger, LogLevel

router = APIRouter()


@router.get("/{session_id}/logs")
async def get_logs(
    session_id: str,
    limit: Optional[int] = Query(None, description="限制返回的日志数量"),
    level: Optional[List[str]] = Query(None, description="日志级别过滤"),
    player_id: Optional[int] = Query(None, description="玩家ID过滤"),
):
    """
    获取实时游戏日志
    Get realtime game logs with optional filters
    """
    # 日志级别过滤
    level_filter = None
    if level:
        try:
            level_filter = [LogLevel(lv) for lv in level]
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid log level: {e}"
            )

    # 获取日志
    logs = realtime_logger.get_logs(
        session_id=session_id,
        limit=limit,
        level_filter=level_filter,
        player_filter=player_id,
    )

    return {
        "session_id": session_id,
        "logs": logs,
        "total": len(logs),
    }


@router.get("/{session_id}/logs/file")
async def get_logs_from_file(
    session_id: str,
    limit: Optional[int] = Query(None, description="限制返回的日志数量"),
):
    """
    从文件获取完整日志历史
    Get complete log history from file
    """
    logs = realtime_logger.get_logs_from_file(
        session_id=session_id,
        limit=limit,
    )

    return {
        "session_id": session_id,
        "logs": logs,
        "total": len(logs),
        "source": "file",
    }


@router.get("/{session_id}/logs/stream")
async def get_log_stream(session_id: str):
    """
    获取日志流用于实时更新（最近100条）
    Get log stream for real-time updates
    """
    # 获取最近100条日志
    logs = realtime_logger.get_logs(session_id=session_id, limit=100)

    return {
        "session_id": session_id,
        "logs": logs,
        "total": len(logs),
        "message": "Use WebSocket connection at /ws/{session_id} for real-time updates",
    }


@router.get("/levels")
async def get_log_levels():
    """
    获取可用的日志级别
    Get available log levels
    """
    return {
        "levels": [level.value for level in LogLevel],
        "descriptions": {
            "debug": "调试信息",
            "info": "一般信息",
            "action": "玩家动作",
            "vote": "投票",
            "death": "玩家死亡",
            "game_start": "游戏开始",
            "game_end": "游戏结束",
            "phase_change": "阶段变化",
            "error": "错误",
        }
    }