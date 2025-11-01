"""
Realtime Game Logger Service - 实时游戏日志服务
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
from enum import Enum


class LogLevel(str, Enum):
    """日志级别"""
    DEBUG = "debug"
    INFO = "info"
    ACTION = "action"
    VOTE = "vote"
    DEATH = "death"
    GAME_START = "game_start"
    GAME_END = "game_end"
    PHASE_CHANGE = "phase_change"
    ERROR = "error"


class GameLogEntry:
    """游戏日志条目"""
    def __init__(
        self,
        session_id: str,
        level: LogLevel,
        message: str,
        player_id: Optional[int] = None,
        player_name: Optional[str] = None,
        round_number: Optional[int] = None,
        phase: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = f"{session_id}-{datetime.now().timestamp()}"
        self.session_id = session_id
        self.timestamp = datetime.now().isoformat()
        self.level = level
        self.message = message
        self.player_id = player_id
        self.player_name = player_name
        self.round_number = round_number
        self.phase = phase
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "timestamp": self.timestamp,
            "type": self.level.value,  # 兼容前端
            "level": self.level.value,
            "message": self.message,
            "player_id": self.player_id,
            "player_name": self.player_name,
            "round_number": self.round_number,
            "phase": self.phase,
            "metadata": self.metadata,
        }


class RealtimeGameLogger:
    """实时游戏日志器"""

    def __init__(self):
        # 内存日志: {session_id: [log_entries]}
        self._logs: Dict[str, List[GameLogEntry]] = {}
        # 日志文件: {session_id: file_path}
        self._log_files: Dict[str, Path] = {}
        # 内存日志数量限制
        self._max_memory_logs = 1000
        # 文件锁
        self._file_locks: Dict[str, asyncio.Lock] = {}

    def initialize_session(self, session_id: str, log_dir: str):
        """初始化会话"""
        if session_id not in self._logs:
            self._logs[session_id] = []
            # 不再使用asyncio.Lock，避免事件循环问题
            # 使用线程锁替代
            import threading
            self._file_locks[session_id] = threading.Lock()

            # 创建日志文件路径
            log_path = Path(log_dir) / "realtime_logs.jsonl"
            self._log_files[session_id] = log_path

            # 确保日志目录存在
            log_path.parent.mkdir(parents=True, exist_ok=True)

            print(f"[RealtimeLogger] Initialized session {session_id}, log file: {log_path}")

    async def log(
        self,
        session_id: str,
        level: LogLevel,
        message: str,
        player_id: Optional[int] = None,
        player_name: Optional[str] = None,
        round_number: Optional[int] = None,
        phase: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """记录日志"""
        # 创建日志条目
        entry = GameLogEntry(
            session_id=session_id,
            level=level,
            message=message,
            player_id=player_id,
            player_name=player_name,
            round_number=round_number,
            phase=phase,
            metadata=metadata,
        )

        # 确保会话已初始化
        if session_id not in self._logs:
            self.initialize_session(session_id, f"logs/{session_id}")

        self._logs[session_id].append(entry)

        # 限制内存日志数量
        if len(self._logs[session_id]) > self._max_memory_logs:
            self._logs[session_id] = self._logs[session_id][-self._max_memory_logs:]

        # 异步写入文件
        asyncio.create_task(self._write_to_file(session_id, entry))

        print(f"[RealtimeLogger] {session_id} [{level.value}] {message}")

    async def _write_to_file(self, session_id: str, entry: GameLogEntry):
        """写入文件 JSONL 格式"""
        try:
            if session_id in self._log_files and session_id in self._file_locks:
                log_file = self._log_files[session_id]
                # 检查事件循环是否活跃
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    # 没有运行中的事件循环，直接返回
                    return

                # 使用线程锁进行文件写入
                import threading
                lock = self._file_locks[session_id]

                # 在线程池中执行文件写入
                def write_file():
                    with lock:
                        with open(log_file, 'a', encoding='utf-8') as f:
                            f.write(json.dumps(entry.to_dict(), ensure_ascii=False) + '\n')

                # 在线程池中运行
                loop.run_in_executor(None, write_file)
        except (RuntimeError, asyncio.InvalidStateError) as e:
            # 事件循环已关闭或无效，静默忽略
            pass
        except Exception as e:
            print(f"[RealtimeLogger] Error writing log to file: {e}")

    def get_logs(
        self,
        session_id: str,
        limit: Optional[int] = None,
        level_filter: Optional[List[LogLevel]] = None,
        player_filter: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """获取内存日志"""
        if session_id not in self._logs:
            return []

        logs = self._logs[session_id]

        # 过滤日志
        if level_filter:
            logs = [log for log in logs if log.level in level_filter]

        if player_filter is not None:
            logs = [log for log in logs if log.player_id == player_filter]

        # 限制数量
        if limit:
            logs = logs[-limit:]

        return [log.to_dict() for log in logs]

    def get_logs_from_file(self, session_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """从文件读取日志"""
        if session_id not in self._log_files:
            return []

        log_file = self._log_files[session_id]
        if not log_file.exists():
            return []

        logs = []
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        logs.append(json.loads(line))
        except Exception as e:
            print(f"[RealtimeLogger] Error reading logs from file: {e}")

        # 限制数量
        if limit:
            logs = logs[-limit:]

        return logs

    def clear_session(self, session_id: str):
        """清除会话"""
        if session_id in self._logs:
            del self._logs[session_id]
        if session_id in self._log_files:
            del self._log_files[session_id]
        if session_id in self._file_locks:
            del self._file_locks[session_id]
        print(f"[RealtimeLogger] Cleared session {session_id}")

    # 便捷方法
    async def log_game_start(self, session_id: str, num_players: int, metadata: Optional[Dict] = None):
        """记录游戏开始"""
        await self.log(
            session_id=session_id,
            level=LogLevel.GAME_START,
            message=f"游戏开始，共 {num_players} 名玩家",
            round_number=0,
            metadata=metadata,
        )

    async def log_game_end(self, session_id: str, winner: str, round_number: int):
        """记录游戏结束"""
        await self.log(
            session_id=session_id,
            level=LogLevel.GAME_END,
            message=f"游戏结束，{winner}获得胜利",
            round_number=round_number,
        )

    async def log_phase_change(self, session_id: str, phase: str, round_number: int):
        """记录阶段变化"""
        await self.log(
            session_id=session_id,
            level=LogLevel.PHASE_CHANGE,
            message=f"进入{phase}阶段",
            round_number=round_number,
            phase=phase,
        )

    async def log_player_action(
        self,
        session_id: str,
        player_name: str,
        action: str,
        target: Optional[str] = None,
        round_number: Optional[int] = None,
        phase: Optional[str] = None,
    ):
        """记录玩家动作"""
        message = f"{player_name} {action}"
        if target:
            message += f" {target}"

        await self.log(
            session_id=session_id,
            level=LogLevel.ACTION,
            message=message,
            player_name=player_name,
            round_number=round_number,
            phase=phase,
        )

    async def log_vote(
        self,
        session_id: str,
        voter: str,
        target: str,
        round_number: Optional[int] = None,
        phase: Optional[str] = None,
    ):
        """记录投票"""
        await self.log(
            session_id=session_id,
            level=LogLevel.VOTE,
            message=f"{voter} 投票给 {target}",
            player_name=voter,
            round_number=round_number,
            phase=phase,
        )

    async def log_death(
        self,
        session_id: str,
        player_name: str,
        reason: str,
        round_number: Optional[int] = None,
    ):
        """记录玩家死亡"""
        await self.log(
            session_id=session_id,
            level=LogLevel.DEATH,
            message=f"{player_name} {reason}",
            player_name=player_name,
            round_number=round_number,
        )


# 全局实时日志器实例
realtime_logger = RealtimeGameLogger()