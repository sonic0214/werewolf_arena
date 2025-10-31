"""
游戏相关的Pydantic Schemas
Game-related Pydantic Schemas for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class GameConfigRequest(BaseModel):
    """游戏配置请求"""
    villager_model: str = Field(..., description="村民使用的模型ID")
    werewolf_model: str = Field(..., description="狼人使用的模型ID")
    num_players: Optional[int] = Field(6, description="玩家数量", ge=5, le=17)
    max_debate_turns: Optional[int] = Field(2, description="最大辩论轮数", ge=1, le=10)

    class Config:
        json_schema_extra = {
            "example": {
                "villager_model": "glm/GLM-Z1-Flash",
                "werewolf_model": "glm/GLM-Z1-Flash",
                "num_players": 6,
                "max_debate_turns": 2
            }
        }


class GameStartResponse(BaseModel):
    """游戏启动响应"""
    session_id: str = Field(..., description="游戏会话ID")
    status: str = Field(..., description="游戏状态")
    message: str = Field(..., description="响应消息")
    log_directory: Optional[str] = Field(None, description="日志目录")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "session_20251031_123045",
                "status": "started",
                "message": "Game started successfully",
                "log_directory": "/path/to/logs/session_20251031_123045"
            }
        }


class PlayerInfo(BaseModel):
    """玩家信息"""
    name: str = Field(..., description="玩家名字")
    role: str = Field(..., description="角色")
    model: str = Field(..., description="使用的模型")
    alive: bool = Field(True, description="是否存活")


class RoundSummary(BaseModel):
    """回合摘要"""
    round_number: int = Field(..., description="回合编号")
    eliminated: Optional[str] = Field(None, description="被狼人淘汰的玩家")
    protected: Optional[str] = Field(None, description="被医生保护的玩家")
    unmasked: Optional[str] = Field(None, description="被预言家调查的玩家")
    exiled: Optional[str] = Field(None, description="被投票放逐的玩家")
    players_alive: List[str] = Field(..., description="存活玩家列表")


class GameStatusResponse(BaseModel):
    """游戏状态响应"""
    session_id: str = Field(..., description="游戏会话ID")
    status: str = Field(..., description="游戏状态: running, completed, error")
    current_round: int = Field(..., description="当前回合数")
    winner: Optional[str] = Field(None, description="获胜方: Villagers, Werewolves, 或 None")
    players: List[PlayerInfo] = Field(..., description="玩家列表")
    rounds: List[RoundSummary] = Field(..., description="回合历史")
    error_message: Optional[str] = Field(None, description="错误信息")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "session_20251031_123045",
                "status": "running",
                "current_round": 2,
                "winner": None,
                "players": [
                    {"name": "Alice", "role": "Villager", "model": "glm/GLM-Z1-Flash", "alive": True},
                    {"name": "Bob", "role": "Werewolf", "model": "glm/GLM-Z1-Flash", "alive": True}
                ],
                "rounds": [],
                "error_message": None
            }
        }


class GameStopResponse(BaseModel):
    """游戏停止响应"""
    session_id: str = Field(..., description="游戏会话ID")
    status: str = Field(..., description="停止状态")
    message: str = Field(..., description="响应消息")
    final_round: int = Field(..., description="最终回合数")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "session_20251031_123045",
                "status": "stopped",
                "message": "Game stopped successfully",
                "final_round": 3
            }
        }


class GameListResponse(BaseModel):
    """游戏列表响应"""
    games: List[Dict[str, Any]] = Field(..., description="游戏会话列表")
    total: int = Field(..., description="总数量")

    class Config:
        json_schema_extra = {
            "example": {
                "games": [
                    {
                        "session_id": "session_20251031_123045",
                        "status": "running",
                        "started_at": "2025-10-31T12:30:45",
                        "winner": None
                    }
                ],
                "total": 1
            }
        }
