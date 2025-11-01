# Backend API接口文档

## 📋 概述

Werewolf Arena Backend提供完整的RESTful API和WebSocket实时通信服务，支持游戏管理、AI模型集成、实时日志记录等功能。所有API遵循RESTful设计原则，支持JSON格式的数据交换。

## 🔗 基础信息

- **Base URL**: `http://localhost:8000`
- **API版本**: `v1`
- **数据格式**: `JSON`
- **字符编码**: `UTF-8`
- **认证方式**: 无需认证（开发环境）

## 📚 API文档

### 交互式文档
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## 🚀 核心API端点

### 1. 系统状态

#### 健康检查
```http
GET /health
```

**响应示例**:
```json
{
  "status": "healthy",
  "version": "2.0.0"
}
```

#### 根路径
```http
GET /
```

**响应示例**:
```json
{
  "message": "Werewolf Arena API",
  "version": "2.0.0",
  "docs": "/docs",
  "status": "running"
}
```

### 2. 游戏管理 (`/api/v1/games`)

#### 启动新游戏
```http
POST /api/v1/games/start
```

**请求体**:
```json
{
  "villager_model": "glmz1-flash",
  "werewolf_model": "glmz1-flash",
  "player_names": ["Alice", "Bob", "Charlie"],
  "discussion_time_minutes": 5,
  "max_rounds": 10
}
```

**响应示例**:
```json
{
  "session_id": "session_20251031_104829",
  "villager_model": "glmz1-flash",
  "werewolf_model": "glmz1-flash",
  "status": "initializing",
  "message": "游戏启动成功，正在跳转到直播间...",
  "log_directory": "/path/to/logs/session_20251031_104829"
}
```

#### 获取游戏状态
```http
GET /api/v1/games/{session_id}
```

**路径参数**:
- `session_id`: 游戏会话ID

**响应示例**:
```json
{
  "session_id": "session_20251031_104829",
  "status": "running",
  "current_round": 2,
  "winner": null,
  "players": [
    {
      "name": "Alice",
      "role": "Seer",
      "status": "alive"
    },
    {
      "name": "Bob",
      "role": "Villager",
      "status": "alive"
    }
  ],
  "game_phase": "debate",
  "started_at": "2025-10-31T10:48:29Z"
}
```

#### 获取游戏日志
```http
GET /api/v1/games/{session_id}/logs
```

**路径参数**:
- `session_id`: 游戏会话ID

**响应示例**:
```json
[
  {
    "timestamp": "2025-10-31T10:50:15Z",
    "round": 1,
    "phase": "debate",
    "player": "Alice",
    "action": "speak",
    "content": "我认为Bob的行为很可疑...",
    "metadata": {
      "role": "Seer",
      "reasoning": "基于观察到的行为模式"
    }
  },
  {
    "timestamp": "2025-10-31T10:51:30Z",
    "round": 1,
    "phase": "vote",
    "player": "Bob",
    "action": "vote",
    "content": "投票给Alice",
    "target": "Alice",
    "metadata": {
      "reason": "怀疑Alice是狼人"
    }
  }
]
```

#### 停止游戏
```http
POST /api/v1/games/{session_id}/stop
```

**路径参数**:
- `session_id`: 游戏会话ID

**响应示例**:
```json
{
  "success": true,
  "message": "游戏停止请求已发送",
  "session_id": "session_20251031_104829",
  "final_status": "stopped"
}
```

### 3. AI模型 (`/api/v1/models`)

#### 获取可用模型
```http
GET /api/v1/models/
```

**响应示例**:
```json
{
  "models": [
    {
      "id": "glm/GLM-Z1-Flash",
      "alias": "glmz1-flash",
      "name": "GLM-Z1-Flash",
      "provider": "glm",
      "enabled": true,
      "description": "智谱AI最新快速模型，性价比高",
      "context_length": 128000,
      "pricing": {
        "input_tokens": 0.0001,
        "output_tokens": 0.0002
      }
    },
    {
      "id": "openai/gpt-4o",
      "alias": "gpt4o",
      "name": "gpt-4o",
      "provider": "openai",
      "enabled": false,
      "description": "OpenAI GPT-4o",
      "context_length": 128000,
      "pricing": {
        "input_tokens": 0.005,
        "output_tokens": 0.015
      }
    }
  ],
  "total": 11
}
```

### 4. 系统状态 (`/api/v1/status`)

#### 获取系统状态
```http
GET /api/v1/status/health
```

**响应示例**:
```json
{
  "status": "healthy",
  "uptime": "2h 15m 30s",
  "version": "2.0.0",
  "environment": "development",
  "llm_providers": {
    "glm": true,
    "openai": false,
    "openrouter": false
  },
  "active_games": 1,
  "total_connections": 3
}
```

### 5. 配置管理 (`/api/v1/config`)

#### 获取时序配置
```http
GET /api/v1/config/timing
```

**响应示例**:
```json
{
  "normal": {
    "night_action": 3.0,
    "debate": 5.0,
    "vote": 2.0,
    "summary": 3.0
  },
  "fast": {
    "night_action": 1.0,
    "debate": 2.0,
    "vote": 1.0,
    "summary": 1.0
  },
  "slow": {
    "night_action": 5.0,
    "debate": 10.0,
    "vote": 5.0,
    "summary": 5.0
  }
}
```

## 📡 WebSocket实时通信

### 连接端点
```
ws://localhost:8000/ws/{session_id}
```

### 连接参数
- `session_id`: 游戏会话ID

### 消息格式

#### 游戏状态更新
```json
{
  "type": "game_state",
  "data": {
    "session_id": "session_20251031_104829",
    "status": "running",
    "current_round": 1,
    "phase": "debate",
    "players": [...]
  },
  "timestamp": "2025-10-31T10:50:15Z"
}
```

#### 玩家行动通知
```json
{
  "type": "player_action",
  "data": {
    "action_type": "eliminate",
    "player_name": "Alice",
    "player_role": "Werewolf",
    "target_name": "Bob",
    "details": {
      "action": "夜间击杀",
      "reasoning": "基于行为分析"
    }
  },
  "timestamp": "2025-10-31T10:50:15Z"
}
```

#### 辩论发言
```json
{
  "type": "debate_turn",
  "data": {
    "player_name": "Alice",
    "dialogue": "我认为Bob的行为很可疑...",
    "player_role": "Seer",
    "turn_number": 1
  },
  "timestamp": "2025-10-31T10:50:15Z"
}
```

#### 投票结果
```json
{
  "type": "vote_cast",
  "data": {
    "voter": "Alice",
    "target": "Bob",
    "voter_role": "Seer"
  },
  "timestamp": "2025-10-31T10:50:15Z"
}
```

#### 游戏完成
```json
{
  "type": "game_complete",
  "data": {
    "winner": "Villagers",
    "final_round": {
      "round_number": 3,
      "eliminated": "Bob",
      "survivors": ["Alice", "Charlie"]
    },
    "game_state": {...}
  },
  "timestamp": "2025-10-31T10:50:15Z"
}
```

## 🔧 错误处理

### 错误响应格式
```json
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "游戏会话未找到",
    "details": "session_id 'invalid_id' 不存在"
  }
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| `GAME_NOT_FOUND` | 404 | 游戏会话未找到 |
| `GAME_ALREADY_RUNNING` | 400 | 游戏已在运行中 |
| `INVALID_MODEL` | 400 | 无效的AI模型 |
| `MODEL_NOT_ENABLED` | 400 | AI模型未启用 |
| `INVALID_PARAMETERS` | 400 | 请求参数无效 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

## 📝 请求示例

### 使用curl启动游戏
```bash
curl -X POST "http://localhost:8000/api/v1/games/start" \
  -H "Content-Type: application/json" \
  -d '{
    "villager_model": "glmz1-flash",
    "werewolf_model": "glmz1-flash",
    "discussion_time_minutes": 5,
    "max_rounds": 10
  }'
```

### 使用curl获取游戏状态
```bash
curl "http://localhost:8000/api/v1/games/session_20251031_104829"
```

### 使用JavaScript WebSocket连接
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session_20251031_104829');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);

  switch(data.type) {
    case 'game_state':
      updateGameUI(data.data);
      break;
    case 'player_action':
      showPlayerAction(data.data);
      break;
    case 'debate_turn':
      displayDialogue(data.data);
      break;
  }
};
```

## 🔒 安全考虑

### 当前实现
- **开发环境**: 无需认证
- **数据验证**: Pydantic模型验证
- **CORS配置**: 支持跨域请求

### 生产环境建议
- **API认证**: 实现JWT或OAuth2认证
- **速率限制**: 防止API滥用
- **HTTPS**: 强制使用HTTPS
- **输入验证**: 严格的参数验证

## 📊 性能特性

### 并发处理
- **游戏并发**: 支持多游戏同时进行
- **WebSocket连接**: 支持多客户端同时连接
- **异步处理**: FastAPI异步特性

### 资源管理
- **连接池**: LLM API连接复用
- **内存优化**: 高效的游戏状态管理
- **日志轮转**: 自动日志文件管理

## 🔄 版本兼容性

### API版本控制
- **当前版本**: v1
- **版本策略**: 语义化版本控制
- **向后兼容**: 保持v1 API稳定

### WebSocket兼容性
- **协议**: WebSocket标准协议
- **消息格式**: JSON格式稳定
- **连接管理**: 自动重连机制

---

*本文档详细描述了Werewolf Arena Backend的所有API接口，为前端开发和第三方集成提供完整的技术参考。*