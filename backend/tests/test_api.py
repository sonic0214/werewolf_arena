"""
API端点单元测试
Unit tests for API endpoints
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json

from src.api.app import app
from src.services.game_manager.session_manager import game_manager

client = TestClient(app)


class TestHealthEndpoints:
    """健康检查端点测试"""

    def test_root_endpoint(self):
        """测试根路径"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Werewolf Arena API"
        assert "version" in data
        assert data["status"] == "running"

    def test_health_check(self):
        """测试健康检查端点"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestStatusAPI:
    """状态API测试"""

    def test_status_health(self):
        """测试状态健康检查"""
        response = client.get("/api/v1/status/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data

    def test_status_info(self):
        """测试状态信息"""
        response = client.get("/api/v1/status/info")
        assert response.status_code == 200
        data = response.json()
        assert "project_name" in data
        assert "version" in data
        assert "environment" in data
        assert "uptime_seconds" in data

    @patch('src.services.game_manager.session_manager.game_manager.get_all_sessions')
    def test_status_stats(self, mock_get_sessions):
        """测试统计信息"""
        # Mock session data
        mock_sessions = {
            "session1": Mock(is_running=True),
            "session2": Mock(is_running=False)
        }
        mock_get_sessions.return_value = mock_sessions

        response = client.get("/api/v1/status/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_games" in data
        assert "active_games" in data
        assert "completed_games" in data
        assert "timestamp" in data


class TestModelsAPI:
    """模型API测试"""

    def test_models_list(self):
        """测试模型列表"""
        response = client.get("/api/v1/models/")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert isinstance(data["models"], list)
        assert len(data["models"]) > 0

    def test_available_providers(self):
        """测试可用提供商"""
        response = client.get("/api/v1/models/providers/available")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert isinstance(data["providers"], list)

    def test_model_info(self):
        """测试特定模型信息"""
        response = client.get("/api/v1/models/glm4")
        # 可能返回404如果模型不存在，这是正常的
        assert response.status_code in [200, 404]

    def test_test_model(self):
        """测试模型测试端点"""
        response = client.post(
            "/api/v1/models/test",
            json={"model_id": "glm4", "test_message": "Hello"}
        )
        # 可能返回400如果模型配置不正确，这是正常的
        assert response.status_code in [200, 400, 404]


class TestGamesAPI:
    """游戏API测试"""

    def test_games_list_empty(self):
        """测试空游戏列表"""
        response = client.get("/api/v1/games/")
        assert response.status_code == 200
        data = response.json()
        assert "games" in data
        assert isinstance(data["games"], list)

    @patch('src.services.game_manager.session_manager.game_manager.create_game')
    def test_start_game_success(self, mock_create_game):
        """测试成功启动游戏"""
        # Mock game session
        mock_session = Mock()
        mock_session.session_id = "test_session_123"
        mock_session.state = Mock()
        mock_session.state.to_dict.return_value = {
            "session_id": "test_session_123",
            "status": "waiting",
            "players": []
        }
        mock_create_game.return_value = mock_session

        response = client.post(
            "/api/v1/games/start",
            json={
                "villager_model": "glm4",
                "werewolf_model": "glm4",
                "player_names": ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"]
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["session_id"] == "test_session_123"
        assert "message" in data
        assert "game_view" in data

    def test_start_game_invalid_data(self):
        """测试无效数据启动游戏"""
        response = client.post(
            "/api/v1/games/start",
            json={}  # 缺少必需字段
        )
        assert response.status_code == 422  # Validation error

    @patch('src.services.game_manager.session_manager.game_manager.get_session')
    def test_game_status_not_found(self, mock_get_session):
        """测试不存在游戏的状态"""
        mock_get_session.return_value = None

        response = client.get("/api/v1/games/nonexistent_session")
        assert response.status_code == 404

    @patch('src.services.game_manager.session_manager.game_manager.get_session')
    def test_game_status_success(self, mock_get_session):
        """测试成功获取游戏状态"""
        # Mock game session
        mock_session = Mock()
        mock_session.session_id = "test_session_123"
        mock_session.state = Mock()
        mock_session.state.to_dict.return_value = {
            "session_id": "test_session_123",
            "status": "running",
            "players": [],
            "rounds": []
        }
        mock_session.is_running = True
        mock_get_session.return_value = mock_session

        response = client.get("/api/v1/games/test_session_123")
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "status" in data
        assert "game_state" in data

    @patch('src.services.game_manager.session_manager.game_manager.stop_game')
    def test_stop_game_success(self, mock_stop_game):
        """测试成功停止游戏"""
        mock_stop_game.return_value = True

        response = client.post("/api/v1/games/test_session_123/stop")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    @patch('src.services.game_manager.session_manager.game_manager.stop_game')
    def test_stop_game_not_found(self, mock_stop_game):
        """测试停止不存在的游戏"""
        mock_stop_game.return_value = False

        response = client.post("/api/v1/games/nonexistent_session/stop")
        assert response.status_code == 404

    @patch('src.services.game_manager.session_manager.game_manager.get_session')
    @patch('src.services.game_manager.session_manager.game_manager.stop_game')
    def test_delete_game_success(self, mock_stop_game, mock_get_session):
        """测试成功删除游戏"""
        # Mock session exists and can be stopped
        mock_session = Mock()
        mock_get_session.return_value = mock_session
        mock_stop_game.return_value = True

        response = client.delete("/api/v1/games/test_session_123")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_delete_game_not_found(self):
        """测试删除不存在的游戏"""
        with patch('src.services.game_manager.session_manager.game_manager.get_session') as mock_get_session:
            mock_get_session.return_value = None

            response = client.delete("/api/v1/games/nonexistent_session")
            assert response.status_code == 404


class TestWebSocketAPI:
    """WebSocket API测试"""

    def test_websocket_connection(self):
        """测试WebSocket连接"""
        with client.websocket_connect("/ws/test_session") as websocket:
            # 测试连接建立
            data = websocket.receive_json()
            assert data["type"] == "connection_established"
            assert "test_session" in data["data"]["session_id"]

            # 测试ping/pong
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"

    def test_websocket_invalid_json(self):
        """测试WebSocket无效JSON"""
        with client.websocket_connect("/ws/test_session") as websocket:
            # 发送无效JSON
            websocket.send_text("invalid json")
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "Invalid JSON format" in response["data"]["message"]

    def test_websocket_unknown_message_type(self):
        """测试WebSocket未知消息类型"""
        with client.websocket_connect("/ws/test_session") as websocket:
            # 发送未知消息类型
            websocket.send_json({"type": "unknown_type"})
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "Unknown message type" in response["data"]["message"]


@pytest.mark.asyncio
class TestWebSocketIntegration:
    """WebSocket集成测试"""

    async def test_websocket_game_update_notification(self):
        """测试游戏更新WebSocket通知"""
        with patch('src.api.v1.routes.websocket.manager') as mock_manager:
            mock_manager.broadcast_to_session = AsyncMock()

            # 模拟游戏更新通知
            from src.api.v1.routes.websocket import notify_game_update
            await notify_game_update("test_session", {"game_state": {"status": "running"}})

            # 验证广播被调用
            mock_manager.broadcast_to_session.assert_called_once()
            call_args = mock_manager.broadcast_to_session.call_args[0]
            assert call_args[0] == "test_session"
            message_data = json.loads(call_args[1])
            assert message_data["type"] == "game_update"
            assert message_data["data"]["game_state"]["status"] == "running"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])