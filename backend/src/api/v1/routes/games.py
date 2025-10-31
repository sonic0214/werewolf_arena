"""
游戏API路由
Games API Routes
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
import json
import os
from pathlib import Path

from src.api.v1.schemas.game import (
    GameConfigRequest,
    GameStartResponse,
    GameStatusResponse,
    GameStopResponse,
    GameListResponse,
    PlayerInfo,
    RoundSummary,
)
from src.services.game_manager.session_manager import game_manager

router = APIRouter()


@router.post("/start", response_model=GameStartResponse, status_code=status.HTTP_201_CREATED)
async def start_game(config: GameConfigRequest):
    """
    启动新游戏
    Start a new game with specified configuration
    """
    try:
        # 创建游戏会话
        session = game_manager.create_game(
            villager_model=config.villager_model,
            werewolf_model=config.werewolf_model,
            num_players=config.num_players or 6,
            max_debate_turns=config.max_debate_turns or 2,
        )

        # 启动游戏（后台运行）
        success = game_manager.start_game(session.session_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to start game"
            )

        return GameStartResponse(
            session_id=session.session_id,
            status="started",
            message=f"Game started successfully with session ID: {session.session_id}",
            log_directory=session.log_dir
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting game: {str(e)}"
        )


@router.get("/{session_id}", response_model=GameStatusResponse)
async def get_game_status(session_id: str):
    """
    获取游戏状态
    Get game status by session ID
    """
    session = game_manager.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game session {session_id} not found"
        )

    state = session.state

    # 构建玩家信息列表
    players = []
    current_players = state.rounds[-1].players if state.rounds else list(state.players.keys())

    for name, player in state.players.items():
        players.append(PlayerInfo(
            name=name,
            role=player.role,
            model=player.model,
            alive=name in current_players
        ))

    # 构建回合摘要列表
    rounds = []
    for idx, round_data in enumerate(state.rounds):
        rounds.append(RoundSummary(
            round_number=idx,
            eliminated=round_data.eliminated,
            protected=round_data.protected,
            unmasked=round_data.unmasked,
            exiled=round_data.exiled,
            players_alive=round_data.players
        ))

    # 确定游戏状态
    game_status = "running"
    if state.winner:
        game_status = "completed"
    elif state.error_message:
        game_status = "error"
    elif not session.is_running:
        game_status = "stopped"

    return GameStatusResponse(
        session_id=session_id,
        status=game_status,
        current_round=len(state.rounds),
        winner=state.winner,
        players=players,
        rounds=rounds,
        error_message=state.error_message
    )


@router.post("/{session_id}/stop", response_model=GameStopResponse)
async def stop_game(session_id: str):
    """
    停止游戏
    Stop a running game
    """
    session = game_manager.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game session {session_id} not found"
        )

    if not session.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game is not running"
        )

    success = game_manager.stop_game(session_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop game"
        )

    return GameStopResponse(
        session_id=session_id,
        status="stopped",
        message="Game stop requested successfully",
        final_round=len(session.state.rounds)
    )


@router.get("/", response_model=GameListResponse)
async def list_games():
    """
    列出所有游戏会话
    List all game sessions
    """
    sessions = game_manager.get_all_sessions()

    games = []
    for session_id, session in sessions.items():
        game_status = "running" if session.is_running else (
            "completed" if session.state.winner else "stopped"
        )

        games.append({
            "session_id": session_id,
            "status": game_status,
            "started_at": session.started_at.isoformat(),
            "current_round": len(session.state.rounds),
            "winner": session.state.winner,
            "log_directory": session.log_dir
        })

    return GameListResponse(
        games=games,
        total=len(games)
    )


@router.delete("/{session_id}")
async def delete_game_session(session_id: str):
    """
    删除游戏会话（仅删除内存中的会话，不删除日志）
    Delete game session from memory (logs are preserved)
    """
    session = game_manager.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game session {session_id} not found"
        )

    if session.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a running game. Stop it first."
        )

    # 从管理器中移除会话
    with game_manager._lock:
        del game_manager._sessions[session_id]

    return {
        "message": f"Session {session_id} deleted successfully",
        "session_id": session_id
    }


@router.get("/{session_id}/logs")
async def get_game_logs(session_id: str):
    """
    获取游戏日志
    Get game logs by session ID
    """
    session = game_manager.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game session {session_id} not found"
        )

    try:
        # 读取日志文件
        logs_file = Path(session.log_dir) / "game_logs.json"

        if not logs_file.exists():
            return []  # 如果日志文件不存在，返回空数组

        with open(logs_file, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return []  # 如果文件为空，返回空数组

            logs = json.loads(content)
            return logs if isinstance(logs, list) else []

    except Exception as e:
        # 如果读取失败，返回空数组而不是抛出错误
        print(f"Error reading logs for session {session_id}: {e}")
        return []
