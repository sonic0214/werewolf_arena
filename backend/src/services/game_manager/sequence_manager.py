"""
动作序列号管理器
Action Sequence Manager for ensuring ordered game events
"""

import threading
import time
from typing import Dict, Optional, Any
from datetime import datetime
from enum import Enum


class ActionType(str, Enum):
    """动作类型枚举"""
    GAME_START = "game_start"
    NIGHT_ELIMINATE = "night_eliminate"
    NIGHT_PROTECT = "night_protect"
    NIGHT_INVESTIGATE = "night_investigate"
    NIGHT_RESOLVE = "night_resolve"
    DAY_DEBATE_TURN = "day_debate_turn"
    DAY_VOTE_CAST = "day_vote_cast"
    DAY_VOTE_RESOLVE = "day_vote_resolve"
    DAY_EXILE = "day_exile"
    DAY_SUMMARY = "day_summary"
    ROUND_COMPLETE = "round_complete"
    GAME_END = "game_end"
    ERROR = "error"


class ActionEvent:
    """动作事件"""
    def __init__(
        self,
        sequence_number: int,
        action_type: ActionType,
        session_id: str,
        player_name: Optional[str] = None,
        player_role: Optional[str] = None,
        target_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ):
        self.sequence_number = sequence_number
        self.action_type = action_type
        self.session_id = session_id
        self.player_name = player_name
        self.player_role = player_role
        self.target_name = target_name
        self.details = details or {}
        self.timestamp = timestamp or datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "sequence_number": self.sequence_number,
            "action_type": self.action_type.value,
            "session_id": self.session_id,
            "player_name": self.player_name,
            "player_role": self.player_role,
            "target_name": self.target_name,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
        }


class SequenceManager:
    """序列号管理器 - 单例模式"""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        # 每个会话的序列号计数器: {session_id: counter}
        self._counters: Dict[str, int] = {}
        # 全局锁
        self._lock = threading.Lock()
        self._initialized = True
        print("📊 Sequence Manager initialized")

    def get_next_sequence(self, session_id: str) -> int:
        """获取下一个序列号"""
        with self._lock:
            if session_id not in self._counters:
                self._counters[session_id] = 0

            self._counters[session_id] += 1
            return self._counters[session_id]

    def create_action_event(
        self,
        session_id: str,
        action_type: ActionType,
        player_name: Optional[str] = None,
        player_role: Optional[str] = None,
        target_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> ActionEvent:
        """创建动作事件"""
        sequence_number = self.get_next_sequence(session_id)

        return ActionEvent(
            sequence_number=sequence_number,
            action_type=action_type,
            session_id=session_id,
            player_name=player_name,
            player_role=player_role,
            target_name=target_name,
            details=details,
        )

    def reset_session(self, session_id: str):
        """重置会话的序列号"""
        with self._lock:
            if session_id in self._counters:
                del self._counters[session_id]
            print(f"📊 Reset sequence counter for session {session_id}")

    def get_current_sequence(self, session_id: str) -> int:
        """获取当前序列号"""
        with self._lock:
            return self._counters.get(session_id, 0)

    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """获取会话统计信息"""
        with self._lock:
            return {
                "session_id": session_id,
                "current_sequence": self._counters.get(session_id, 0),
                "total_actions": self._counters.get(session_id, 0),
            }

    def get_all_stats(self) -> Dict[str, Any]:
        """获取所有会话的统计信息"""
        with self._lock:
            return {
                "active_sessions": list(self._counters.keys()),
                "session_stats": {
                    session_id: {
                        "current_sequence": counter,
                        "total_actions": counter,
                    }
                    for session_id, counter in self._counters.items()
                },
                "total_sessions": len(self._counters),
            }


# 全局实例
sequence_manager = SequenceManager()