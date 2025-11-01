# 🐺 Werewolf Arena Backend

基于 FastAPI 的狼人杀游戏后端服务，提供完整的游戏逻辑、AI 模型集成和实时通信功能。

## 📋 项目概述

Werewolf Arena Backend 是一个现代化的 Python Web 服务，专门为 AI 驱动的狼人杀游戏提供后端支持。系统采用分层架构设计，支持多种大语言模型集成，提供实时的 WebSocket 通信和完整的游戏状态管理。

## 🏗️ 架构设计

### 技术栈
- **框架**: FastAPI 0.104+
- **Python 版本**: Python 3.11+
- **数据验证**: Pydantic V2
- **异步支持**: asyncio + uvicorn
- **实时通信**: WebSocket
- **AI 集成**: 多 LLM 提供商支持

### 架构层次
```
API 层 (FastAPI) → 业务逻辑层 (Services) → 核心游戏引擎 (Game Engine) → 配置层 (Config)
```

## 📁 目录结构

```
backend/
├── src/                        # 源代码目录
│   ├── api/                    # API 路由层
│   │   ├── app.py             # FastAPI 应用主文件
│   │   └── v1/                # API v1 版本
│   │       ├── routes/        # API 路由
│   │       │   ├── games.py   # 游戏管理接口
│   │       │   ├── models.py  # AI 模型接口
│   │       │   ├── websocket.py # WebSocket 实时通信
│   │       │   └── status.py  # 系统状态接口
│   │       └── schemas/       # 数据模型
│   │           ├── game.py    # 游戏相关模型
│   │           └── model.py   # AI 模型定义
│   ├── core/                  # 核心游戏引擎
│   │   ├── game/              # 游戏主控逻辑
│   │   │   └── game_master.py # 游戏流程控制器
│   │   └── models/            # 游戏数据模型
│   │       ├── game_state.py  # 游戏状态管理
│   │       ├── player.py      # 玩家角色模型
│   │       └── logs.py        # 日志数据模型
│   ├── services/              # 业务服务层
│   │   ├── game_manager/      # 游戏管理服务
│   │   │   ├── session_manager.py # 会话管理器
│   │   │   └── runner.py      # 游戏运行器
│   │   ├── llm/               # LLM 客户端系统
│   │   │   ├── client.py      # 统一 LLM 客户端
│   │   │   ├── factory.py     # LLM 提供商工厂
│   │   │   └── providers/     # 具体提供商实现
│   │   └── logger/            # 日志服务
│   │       ├── realtime_logger.py # 实时日志记录
│   │       └── game_logger.py # 游戏日志管理
│   ├── config/                # 配置管理
│   │   ├── settings.py        # 应用配置
│   │   ├── loader.py          # 模型加载器
│   │   └── timing_loader.py   # 时序配置
│   └── utils/                 # 工具函数
│       └── helpers.py         # 通用辅助函数
├── docs/                      # 📚 文档目录
│   ├── ARCHITECTURE.md        # 系统架构文档
│   ├── API.md                 # API 接口文档
│   └── MODULES.md             # 模块功能说明
├── tests/                     # 测试代码
├── requirements.txt           # Python 依赖
├── .env.example              # 环境变量模板
├── .gitignore               # Git 忽略规则
└── README.md                # 本文档
```

## 🚀 快速开始

### 环境要求
- Python 3.11+
- pip 或 poetry 包管理器

### 安装步骤

1. **创建虚拟环境**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的 API 密钥
```

4. **启动服务**
```bash
python -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

### 服务验证
- **健康检查**: http://localhost:8000/health
- **API 文档**: http://localhost:8000/docs
- **系统状态**: http://localhost:8000/api/v1/status/health

## 🔧 配置说明

### 环境变量配置
```bash
# 应用配置
PROJECT_NAME=Werewolf Arena
ENVIRONMENT=development
DEBUG=false

# LLM 提供商配置
LLM_GLM_API_KEY=your_glm_api_key
LLM_OPENAI_API_KEY=your_openai_api_key
LLM_OPENROUTER_API_KEY=your_openrouter_api_key

# CORS 配置
CORS_ALLOW_ORIGINS=["http://localhost:3000"]
```

### 支持的 AI 模型
- **智谱 AI (GLM)**: GLM-Z1-Flash, GLM-4.5-Flash, GLM-4-Air, GLM-4
- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **OpenRouter**: Claude 3.5 Sonnet, GPT-4o, GLM 4.5 Air Free, DeepSeek R1

## 🎮 核心功能

### 游戏流程控制
- **完整的狼人杀规则**: 夜间行动 → 白天讨论 → 投票淘汰 → 胜负判定
- **AI 角色扮演**: 村民、狼人、预言家、医生等角色的智能行为
- **实时状态同步**: WebSocket 实时推送游戏状态变化
- **并发游戏支持**: 支持多个游戏会话同时进行

### AI 模型集成
- **统一客户端接口**: 支持多个 LLM 提供商的统一调用
- **智能路由**: 自动识别模型类型并路由到对应提供商
- **健康检查**: 实时监控 LLM 服务可用性
- **错误处理**: 优雅处理 API 调用失败和重试机制

### 实时通信
- **WebSocket 连接**: 支持多客户端实时连接
- **事件推送**: 游戏状态、玩家行动、投票结果实时推送
- **连接管理**: 自动处理连接断开和重连
- **消息格式化**: 标准化的 JSON 消息格式

### 日志系统
- **实时日志**: 结构化的实时游戏日志记录
- **文件存储**: 自动轮转的日志文件管理
- **WebSocket 订阅**: 支持客户端订阅实时日志流
- **游戏回放**: 完整的游戏记录支持复盘分析

## 📚 API 接口

### 游戏管理
- `POST /api/v1/games/start` - 启动新游戏
- `GET /api/v1/games/{session_id}` - 获取游戏状态
- `GET /api/v1/games/{session_id}/logs` - 获取游戏日志
- `POST /api/v1/games/{session_id}/stop` - 停止游戏

### 模型管理
- `GET /api/v1/models/` - 获取可用 AI 模型列表

### 系统状态
- `GET /health` - 服务健康检查
- `GET /api/v1/status/health` - 详细系统状态

### WebSocket 通信
- `ws://localhost:8000/ws/{session_id}` - 游戏实时通信

详细的 API 文档请参考: [API.md](docs/API.md)

## 🔍 监控和日志

### 日志文件
- **应用日志**: `backend_v2.log` - 应用运行日志
- **游戏日志**: `logs/session_{id}/` - 游戏会话日志
- **实时日志**: `logs/session_{id}/realtime_logs.jsonl` - 实时游戏事件

### 监控指标
- **服务健康状态**: 通过 `/health` 端点监控
- **LLM 提供商状态**: 实时检查 AI 服务可用性
- **活跃游戏数量**: 监控当前运行的游戏会话
- **WebSocket 连接数**: 跟踪实时连接状态

## 🧪 开发指南

### 本地开发
```bash
# 开发模式启动
python -m uvicorn src.api.app:app --reload --log-level debug

# 运行测试
pytest

# 代码格式化
black src/
isort src/
```

### 添加新功能
1. **新游戏角色**: 在 `core/models/player.py` 中添加新的角色类
2. **新 API 端点**: 在 `api/v1/routes/` 中添加新的路由文件
3. **新 LLM 提供商**: 在 `services/llm/providers/` 中实现新的提供商
4. **新配置项**: 在 `config/settings.py` 中添加新的配置字段

### 调试技巧
- 使用 `--log-level debug` 获取详细的调试信息
- 通过 Swagger UI (`/docs`) 测试 API 接口
- 检查实时日志文件了解游戏执行过程
- 使用 WebSocket 客户端工具测试实时通信

## 📖 文档导航

- [📋 系统架构](docs/ARCHITECTURE.md) - 完整的架构设计说明
- [🚀 API 接口](docs/API.md) - 详细的 API 文档
- [🔧 模块功能](docs/MODULES.md) - 各模块功能详解
- [🐳 部署指南](../DEPLOYMENT.md) - 生产环境部署方案

## 🚨 故障排除

### 常见问题
1. **端口占用**: 检查 8000 端口是否被占用
2. **API 密钥错误**: 确认 `.env` 文件中的 API 密钥正确
3. **依赖安装失败**: 尝试升级 pip 并重新安装依赖
4. **游戏启动失败**: 检查 LLM 提供商健康状态

### 日志查看
```bash
# 查看实时日志
tail -f backend_v2.log

# 查看特定游戏日志
tail -f logs/session_20251031_104829/realtime_logs.jsonl
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 编写测试
5. 提交 Pull Request

## 📄 许可证

本项目基于 Apache 2.0 许可证开源。

---

**版本**: v2.0.0
**更新时间**: 2025-11-01
**维护状态**: ✅ 活跃维护中