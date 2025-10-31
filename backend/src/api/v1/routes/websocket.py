"""
WebSocket API路由
WebSocket API Routes for real-time game updates
"""

from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.services.game_manager.session_manager import game_manager
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

async def notify_game_complete(session_id: str, winner: str, final_round: dict, game_state: dict):
    """Notify all clients about game completion"""
    await manager.broadcast_game_complete(session_id, winner, final_round, game_state)

def get_active_connections_count(session_id: str) -> int:
    """Get number of active connections for a session"""
    return manager.get_connection_count(session_id)

# Export functions for use in other modules
__all__ = [
    'notify_game_update',
    'notify_round_complete',
    'notify_game_complete',
    'get_active_connections_count'
]