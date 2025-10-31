"""
游戏会话管理器
Game Session Manager for managing running games
"""

import threading
import asyncio
from typing import Dict, Optional, Any
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from src.core.game.game_master import GameMaster
from src.core.models.game_state import State
from src.core.models.player import Seer, Doctor, Villager, Werewolf
from src.services.logger.game_logger import log_directory, save_game
from src.config.settings import get_player_names, DEFAULT_THREADS


class GameSession:
    """游戏会话"""
    def __init__(self, session_id: str, state: State, gamemaster: GameMaster, log_dir: str):
        self.session_id = session_id
        self.state = state
        self.gamemaster = gamemaster
        self.log_dir = log_dir
        self.started_at = datetime.now()
        self.thread: Optional[threading.Thread] = None
        self.is_running = False


class GameSessionManager:
    """单例游戏会话管理器"""
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
        self._sessions: Dict[str, GameSession] = {}
        self._lock = threading.Lock()
        self._initialized = True

    def create_game(
        self,
        villager_model: str,
        werewolf_model: str,
        num_players: int = 6,
        max_debate_turns: int = 2
    ) -> GameSession:
        """创建新游戏会话"""
        import random

        # 初始化玩家
        player_names = random.sample(get_player_names(), num_players)

        seer = Seer(name=player_names.pop(), model=villager_model)
        doctor = Doctor(name=player_names.pop(), model=villager_model)
        werewolves = [Werewolf(name=player_names.pop(), model=werewolf_model) for _ in range(1)]
        villagers = [Villager(name=name, model=villager_model) for name in player_names]

        # 初始化游戏视图
        all_player_names = [seer.name, doctor.name] + [w.name for w in werewolves] + [v.name for v in villagers]
        for player in [seer, doctor] + werewolves + villagers:
            other_wolf = None
            if isinstance(player, Werewolf) and len(werewolves) > 1:
                other_wolf = next((w.name for w in werewolves if w != player), None)
            player.initialize_game_view(
                current_players=all_player_names,
                round_number=0,
                other_wolf=other_wolf,
            )

        # 创建游戏状态
        log_dir = log_directory()
        session_id = log_dir.split('/')[-1]

        state = State(
            villagers=villagers,
            werewolves=werewolves,
            seer=seer,
            doctor=doctor,
            session_id=session_id,
        )

        # 创建进度保存回调
        def _save_progress(state: State, logs):
            save_game(state, logs, log_dir)

        # 创建游戏主控
        gamemaster = GameMaster(
            state,
            num_threads=DEFAULT_THREADS,
            on_progress=_save_progress
        )

        # 初始保存
        _save_progress(state, gamemaster.logs)

        # 创建会话
        session = GameSession(session_id, state, gamemaster, log_dir)

        with self._lock:
            self._sessions[session_id] = session

        return session

    def start_game(self, session_id: str) -> bool:
        """启动游戏（后台线程运行）"""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return False

            if session.is_running:
                return False

            def run_game_thread():
                try:
                    session.is_running = True
                    session.gamemaster.run_game()
                except Exception as e:
                    session.state.error_message = str(e)
                    print(f"Game error in session {session_id}: {e}")
                finally:
                    session.is_running = False

            session.thread = threading.Thread(target=run_game_thread, daemon=True)
            session.thread.start()
            return True

    def stop_game(self, session_id: str) -> bool:
        """停止游戏"""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session or not session.is_running:
                return False

            session.gamemaster.stop()
            return True

    def get_session(self, session_id: str) -> Optional[GameSession]:
        """获取会话"""
        with self._lock:
            return self._sessions.get(session_id)

    def get_all_sessions(self) -> Dict[str, GameSession]:
        """获取所有会话"""
        with self._lock:
            return self._sessions.copy()

    def get_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """获取会话状态"""
        session = self.get_session(session_id)
        if not session:
            return None

        return {
            "session_id": session.session_id,
            "status": "running" if session.is_running else (
                "completed" if session.state.winner else "stopped"
            ),
            "current_round": len(session.state.rounds),
            "winner": session.state.winner,
            "error_message": session.state.error_message,
            "started_at": session.started_at.isoformat(),
            "log_directory": session.log_dir,
        }


# 全局实例
game_manager = GameSessionManager()
