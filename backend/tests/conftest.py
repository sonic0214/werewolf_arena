"""
pytest配置文件
pytest configuration file
"""

import pytest
import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环用于异步测试"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_llm_client():
    """模拟LLM客户端"""
    from unittest.mock import Mock
    mock_client = Mock()
    mock_client.health_check.return_value = {"status": "healthy"}
    return mock_client


@pytest.fixture
def sample_game_state():
    """示例游戏状态"""
    return {
        "session_id": "test_session_123",
        "status": "running",
        "players": [
            {
                "id": 1,
                "name": "Alice",
                "role": "villager",
                "alive": True
            },
            {
                "id": 2,
                "name": "Bob",
                "role": "werewolf",
                "alive": True
            }
        ],
        "rounds": [],
        "current_round": {
            "id": "round_1",
            "phase": {
                "name": "讨论阶段",
                "type": "day",
                "number": 1
            },
            "discussions": [],
            "votes": [],
            "night_actions": []
        },
        "winner": None,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:01:00Z",
        "settings": {
            "villager_models": ["glm4"],
            "werewolf_models": ["glm4"],
            "player_names": ["Alice", "Bob"],
            "discussion_time_minutes": 5,
            "max_rounds": 10
        }
    }