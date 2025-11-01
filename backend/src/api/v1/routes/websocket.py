"""
WebSocket API路由
WebSocket API Routes for real-time game updates
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.services.game_manager.session_manager import game_manager
from src.services.logger.realtime_logger import realtime_logger
from src.services.game_manager.sequence_manager import sequence_manager, ActionType
import json
import asyncio
from datetime import datetime

router = APIRouter()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        # Store active connections: {session_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and store WebSocket connection"""
        await websocket.accept()

        if session_id not in self.active_connections:
            self.active_connections[session_id] = []

        self.active_connections[session_id].append(websocket)
        print(f"WebSocket connected for session {session_id}. Total connections: {len(self.active_connections[session_id])}")

    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove WebSocket connection"""
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
                print(f"WebSocket disconnected for session {session_id}. Remaining connections: {len(self.active_connections[session_id])}")

                # Clean up empty session entries
                if len(self.active_connections[session_id]) == 0:
                    del self.active_connections[session_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific WebSocket"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")

    async def broadcast_to_session(self, message: str, session_id: str):
        """Broadcast message to all connections in a session"""
        if session_id in self.active_connections:
            # Create a copy of the list to avoid modification during iteration
            connections = self.active_connections[session_id].copy()
            disconnected_connections = []

            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"Error broadcasting to connection in session {session_id}: {e}")
                    disconnected_connections.append(connection)

            # Remove disconnected connections
            for connection in disconnected_connections:
                self.disconnect(connection, session_id)

    async def broadcast_game_update(self, session_id: str, game_data: dict):
        """Broadcast game state update to all connections in a session"""
        message = {
            "type": "game_update",
            "data": game_data,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_round_complete(self, session_id: str, round_data: dict, next_phase: dict = None):
        """Broadcast round completion to all connections in a session"""
        message = {
            "type": "round_complete",
            "data": {
                "round": round_data,
                "next_phase": next_phase
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_game_complete(self, session_id: str, winner: str, final_round: dict, game_state: dict):
        """Broadcast game completion to all connections in a session"""
        message = {
            "type": "game_complete",
            "data": {
                "winner": winner,
                "final_round": final_round,
                "game_state": game_state
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_game_complete_v2(self, session_id: str, winner: str, winner_name: str, players_info: dict, round_number: int):
        """Broadcast game completion with player roles to all connections in a session"""
        message = {
            "type": "game_complete",
            "data": {
                "winner": winner,
                "winner_name": winner_name,
                "players_info": players_info,
                "round_number": round_number
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    
    async def broadcast_player_action(self, session_id: str, action_event):
        """Broadcast player action with sequence number"""
        message = {
            "type": "player_action",
            "data": action_event.to_dict(),
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_debate_turn(self, session_id: str, player_name: str, dialogue: str, sequence_number: int):
        """Broadcast debate turn with sequence"""
        message = {
            "type": "debate_turn",
            "data": {
                "sequence_number": sequence_number,
                "player_name": player_name,
                "dialogue": dialogue,
                "timestamp": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_vote_cast(self, session_id: str, voter: str, target: str, sequence_number: int):
        """Broadcast individual vote with sequence"""
        message = {
            "type": "vote_cast",
            "data": {
                "sequence_number": sequence_number,
                "voter": voter,
                "target": target,
                "timestamp": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_night_action(self, session_id: str, action_type: str, player_name: str, target_name: Optional[str] = None, details: Optional[Dict[str, Any]] = None, sequence_number: Optional[int] = None):
        """Broadcast night action with sequence"""
        message = {
            "type": "night_action",
            "data": {
                "sequence_number": sequence_number,
                "action_type": action_type,
                "player_name": player_name,
                "player_role": details.get("role") if details else None,
                "target_name": target_name,
                "details": details or {},
                "timestamp": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_phase_change(self, session_id: str, phase: str, round_number: int, sequence_number: Optional[int] = None):
        """Broadcast phase change with sequence"""
        message = {
            "type": "phase_change",
            "data": {
                "sequence_number": sequence_number,
                "phase": phase,
                "round_number": round_number,
                "timestamp": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_player_exile(self, session_id: str, exiled_player: str, round_number: int, sequence_number: Optional[int] = None):
        """Broadcast player exile"""
        message = {
            "type": "player_exile",
            "data": {
                "sequence_number": sequence_number,
                "exiled_player": exiled_player,
                "round_number": round_number,
                "timestamp": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    async def broadcast_player_summary(self, session_id: str, player_name: str, summary: str, round_number: int, sequence_number: Optional[int] = None):
        """Broadcast player summary"""
        message = {
            "type": "player_summary",
            "data": {
                "sequence_number": sequence_number,
                "player_name": player_name,
                "summary": summary,
                "round_number": round_number,
                "timestamp": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_session(json.dumps(message), session_id)

    def get_connection_count(self, session_id: str) -> int:
        """Get number of active connections for a session"""
        return len(self.active_connections.get(session_id, []))

# Global connection manager instance
manager = ConnectionManager()

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time game updates"""
    await manager.connect(websocket, session_id)

    try:
        # Send initial connection confirmation
        await manager.send_personal_message(json.dumps({
            "type": "connection_established",
            "data": {
                "session_id": session_id,
                "message": "Connected to game session"
            },
            "timestamp": datetime.now().isoformat()
        }), websocket)

        # Send current game state if game exists
        game_session = game_manager.get_session(session_id)
        if game_session and game_session.state:
            await manager.send_personal_message(json.dumps({
                "type": "game_update",
                "data": {
                    "game_state": game_session.state.to_dict(),
                    "status": "running" if game_session.is_running else "stopped"
                },
                "timestamp": datetime.now().isoformat()
            }), websocket)

        # Send recent logs
        recent_logs = realtime_logger.get_logs(session_id, limit=50)
        if recent_logs:
            await manager.send_personal_message(json.dumps({
                "type": "log_history",
                "data": {"logs": recent_logs},
                "timestamp": datetime.now().isoformat()
            }), websocket)

        # Keep connection alive and listen for client messages
        while True:
            try:
                # Wait for message from client (with timeout)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)

                try:
                    message = json.loads(data)

                    # Handle different message types from client
                    if message.get("type") == "ping":
                        # Respond to ping with pong
                        await manager.send_personal_message(json.dumps({
                            "type": "pong",
                            "timestamp": datetime.now().isoformat()
                        }), websocket)

                    elif message.get("type") == "pong":
                        # Client responded to our ping, connection is alive
                        # Just acknowledge it silently, no need to respond
                        pass

                    elif message.get("type") == "get_status":
                        # Send current game status
                        game_session = game_manager.get_session(session_id)
                        if game_session:
                            await manager.send_personal_message(json.dumps({
                                "type": "status_update",
                                "data": {
                                    "status": "running" if game_session.is_running else "stopped",
                                    "game_state": game_session.state.to_dict() if game_session.state else None
                                },
                                "timestamp": datetime.now().isoformat()
                            }), websocket)
                        else:
                            await manager.send_personal_message(json.dumps({
                                "type": "error",
                                "data": {"message": f"Game session {session_id} not found"},
                                "timestamp": datetime.now().isoformat()
                            }), websocket)

                    else:
                        # Unknown message type
                        await manager.send_personal_message(json.dumps({
                            "type": "error",
                            "data": {"message": f"Unknown message type: {message.get('type')}"},
                            "timestamp": datetime.now().isoformat()
                        }), websocket)

                except json.JSONDecodeError:
                    await manager.send_personal_message(json.dumps({
                        "type": "error",
                        "data": {"message": "Invalid JSON format"},
                        "timestamp": datetime.now().isoformat()
                    }), websocket)

            except asyncio.TimeoutError:
                # Send periodic ping to keep connection alive
                await manager.send_personal_message(json.dumps({
                    "type": "ping",
                    "timestamp": datetime.now().isoformat()
                }), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        print(f"WebSocket disconnected for session {session_id}")

    except Exception as e:
        print(f"WebSocket error for session {session_id}: {e}")
        manager.disconnect(websocket, session_id)

# Helper functions to be used by other parts of the application
async def notify_game_update(session_id: str, game_data: dict):
    """Notify all clients about game state update"""
    await manager.broadcast_game_update(session_id, game_data)

async def notify_round_complete(session_id: str, round_data: dict, next_phase: dict = None):
    """Notify all clients about round completion"""
    await manager.broadcast_round_complete(session_id, round_data, next_phase)

async def notify_game_complete(session_id: str, winner: str, winner_name: str = None, players_info: dict = None, round_number: int = 0, final_round: dict = None, game_state: dict = None):
    """Notify all clients about game completion"""
    # 如果提供了新参数，使用新格式
    if winner_name and players_info is not None:
        await manager.broadcast_game_complete_v2(session_id, winner, winner_name, players_info, round_number)
    else:
        # 兼容旧格式
        await manager.broadcast_game_complete(session_id, winner, final_round or {}, game_state or {})

async def notify_player_action(session_id: str, action_type: ActionType, player_name: str, player_role: str, target_name: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    """Notify all clients about a player action with sequence"""
    action_event = sequence_manager.create_action_event(
        session_id=session_id,
        action_type=action_type,
        player_name=player_name,
        player_role=player_role,
        target_name=target_name,
        details=details
    )
    await manager.broadcast_player_action(session_id, action_event)
    return action_event.sequence_number

async def notify_debate_turn(session_id: str, player_name: str, dialogue: str, player_role: str):
    """Notify all clients about a debate turn"""
    sequence_number = sequence_manager.get_next_sequence(session_id)
    await manager.broadcast_debate_turn(session_id, player_name, dialogue, sequence_number)

    # Also log the action
    await realtime_logger.log_player_action(
        session_id=session_id,
        player_name=player_name,
        action=f"发言: {dialogue}",
        round_number=None,  # Will be filled by caller
        phase="day"
    )

    return sequence_number

async def notify_vote_cast(session_id: str, voter: str, target: str, voter_role: str):
    """Notify all clients about an individual vote"""
    sequence_number = sequence_manager.get_next_sequence(session_id)
    await manager.broadcast_vote_cast(session_id, voter, target, sequence_number)

    # Also log the vote
    await realtime_logger.log_vote(
        session_id=session_id,
        voter=voter,
        target=target,
        round_number=None,  # Will be filled by caller
        phase="day"
    )

    return sequence_number

async def notify_night_action(session_id: str, action_type: ActionType, player_name: str, player_role: str, target_name: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    """Notify all clients about a night action"""
    sequence_number = sequence_manager.get_next_sequence(session_id)
    await manager.broadcast_night_action(session_id, action_type.value, player_name, target_name, details, sequence_number)
    return sequence_number

async def notify_phase_change(session_id: str, phase: str, round_number: int):
    """Notify all clients about phase change"""
    sequence_number = sequence_manager.get_next_sequence(session_id)
    await manager.broadcast_phase_change(session_id, phase, round_number, sequence_number)

    # Also log the phase change
    await realtime_logger.log_phase_change(session_id, phase, round_number)

    return sequence_number

async def notify_player_exile(session_id: str, exiled_player: str, round_number: int):
    """Notify all clients about player exile"""
    sequence_number = sequence_manager.get_next_sequence(session_id)
    await manager.broadcast_player_exile(session_id, exiled_player, round_number, sequence_number)
    return sequence_number

async def notify_player_summary(session_id: str, player_name: str, summary: str, round_number: int):
    """Notify all clients about player summary"""
    sequence_number = sequence_manager.get_next_sequence(session_id)
    await manager.broadcast_player_summary(session_id, player_name, summary, round_number, sequence_number)
    return sequence_number

def get_active_connections_count(session_id: str) -> int:
    """Get number of active connections for a session"""
    return manager.get_connection_count(session_id)

# Export functions for use in other modules
__all__ = [
    'notify_game_update',
    'notify_round_complete',
    'notify_game_complete',
    'notify_player_action',
    'notify_debate_turn',
    'notify_vote_cast',
    'notify_night_action',
    'notify_phase_change',
    'notify_player_exile',
    'notify_player_summary',
    'get_active_connections_count'
]