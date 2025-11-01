# 🐺 狼人杀竞技场 - Werewolf Arena v2.0

一个基于大语言模型的狼人杀游戏框架，支持AI模型对战和实时观看。项目采用现代化架构，提供快速响应的Web界面和强大的API服务。

## ✨ 核心特性

- 🤖 **AI智能对抗**: 多种大语言模型实时对战，展现推理和社交能力
- 🎮 **实时游戏体验**: WebSocket实时推送，观看游戏每个细节
- 🌙 **完整游戏流程**: 夜间行动 → 白天讨论 → 投票淘汰 → 胜负判定
- 📝 **详细推理日志**: 记录每个AI玩家的发言逻辑和推理过程
- 🎯 **多模型支持**: 可为村民和狼人分配不同的AI模型进行对抗
- 🔄 **实时状态同步**: 游戏状态、玩家行动、投票结果实时更新
- 📊 **游戏回放**: 完整的游戏记录，支持复盘分析

## 🚀 快速启动

### 一键启动（推荐）

```bash
# 启动v2.0版本
./scripts/start_v2.sh
```

### 手动启动

#### 1. 启动后端服务
```bash
cd backend
source ../venv/bin/activate  # Windows: venv\Scripts\activate

# 复制并配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入API密钥

# 安装依赖
pip install -r requirements.txt

# 启动后端
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

#### 2. 启动前端服务（新终端）
```bash
cd frontend

# 安装依赖
npm install

# 启动前端
npm run dev
```

#### 3. 访问应用
- 🎮 **游戏主页**: http://localhost:3000
- 📚 **API文档**: http://localhost:8000/docs
- 📊 **健康检查**: http://localhost:8000/health

### 4. 开始游戏体验
1. **配置游戏**: 在主页选择AI模型、设置讨论时间和最大轮数
2. **启动游戏**: 点击"Start Game"按钮开始新游戏
3. **实时观看**: 自动跳转到游戏直播页面，观看AI玩家对抗
4. **游戏日志**: 实时显示玩家发言、投票和推理过程
5. **游戏阶段**:
   - 🌙 **夜间阶段**: 狼人击杀、医生保护、预言家查验
   - ☀️ **白天阶段**: 玩家辩论、投票淘汰
   - 📊 **结果展示**: 游戏结束显示获胜方

## 🏗️ 项目架构

### 技术栈
- **后端**: FastAPI + Python 3.11+ + Pydantic V2
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + Zustand
- **通信**: REST API + WebSocket
- **部署**: 支持Docker容器化

### 目录结构
```
werewolf_arena/
├── scripts/
│   ├── start_v2.sh          # 🎯 主启动脚本
│   └── stop_v2.sh           # 停止脚本（自动生成）
├── backend/                 # 🔧 FastAPI后端服务
│   ├── src/
│   │   ├── api/            # API路由层
│   │   ├── core/           # 🎮 游戏核心逻辑
│   │   ├── services/       # 🤖 业务服务层
│   │   ├── config/         # ⚙️ 配置管理
│   │   └── utils/          # 工具函数
│   ├── tests/              # 单元测试
│   └── requirements.txt    # Python依赖
├── frontend/               # 🌐 Next.js前端应用
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React组件
│   │   ├── lib/           # 工具库和状态管理
│   │   └── types/         # TypeScript类型
│   └── package.json       # Node.js依赖
├── shared/                # 🔄 前后端共享代码
├── logs/                  # 📝 日志文件目录
├── docs/                  # 📚 项目文档
└── ARCHITECTURE.md        # 📋 详细架构文档
```

## ⚙️ 环境配置

### 1. 创建虚拟环境
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 配置API密钥
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件，填入您的API密钥
# 支持的提供商：
# - OPENAI_API_KEY (GPT models)
# - GLM_API_KEY (智谱AI模型)
# - OPENROUTER_API_KEY (多模型聚合平台)
```

### 3. 安装依赖
```bash
# 后端依赖
cd backend && pip install -r requirements.txt && cd ..

# 前端依赖
cd frontend && npm install && cd ..
```

## 📚 API文档

启动服务后可访问：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **健康检查**: http://localhost:8000/health

### 主要API端点
- `POST /api/v1/games/start` - 启动游戏
- `GET /api/v1/games/{session_id}` - 获取游戏状态
- `GET /api/v1/games/{session_id}/logs` - 获取游戏日志
- `GET /api/v1/models/` - 可用模型
- `GET /health` - 服务状态
- `WebSocket /ws/{session_id}` - 实时游戏通信

### WebSocket事件
```typescript
// 客户端连接
WebSocket /ws/{session_id}  // 连接到指定游戏会话

// 服务端实时推送
- 游戏状态更新（玩家行动、投票结果）
- 实时游戏日志（发言、推理、投票）
- 游戏阶段变化（夜间行动、白天讨论、投票）
- 玩家状态变化（淘汰、保护、查验）
```

## 🎮 支持的模型

### 当前可用模型 (v2.0)
**智谱AI (GLM) - 已启用 ✅**
- GLM-Z1-Flash (`glmz1-flash`) - 智谱AI最新快速模型，性价比高 ⭐ 推荐
- GLM-4.5-Flash (`glm45-flash`) - 智谱AI 4.5 Flash版本
- GLM-4-Air (`glm4-air`) - 智谱AI 4 Air版本
- GLM-4 (`glm4`) - 智谱AI 4标准版本

**OpenAI - 需要API密钥 🔑**
- GPT-4o (`gpt4o`) - OpenAI GPT-4o
- GPT-4 Turbo (`gpt4`) - OpenAI GPT-4 Turbo
- GPT-3.5 Turbo (`gpt3.5`) - OpenAI GPT-3.5 Turbo

**OpenRouter - 需要API密钥 🔑**
- Claude 3.5 Sonnet (`or-sonnet`) - Claude 3.5 Sonnet via OpenRouter
- GPT-4o (`or-gpt4o`) - GPT-4o via OpenRouter
- GLM 4.5 Air Free (`or-glm45-free`) - 免费GLM模型
- DeepSeek R1 (`or-deepseek-r1-free`) - 免费DeepSeek模型

### 默认配置
- **默认模型**: GLM-Z1-Flash (性能优秀且免费)
- **支持自定义**: 可通过配置文件添加更多模型
- **动态切换**: 游戏中可为不同角色分配不同模型

## 🐳 Docker部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 📖 详细文档

- [📋 架构文档](./ARCHITECTURE.md) - 完整的系统架构说明
- [🚀 部署指南](./DEPLOYMENT.md) - 生产环境部署方案
- [🔧 启动指南](./STARTUP_GUIDE.md) - 详细的启动说明
- [📊 实时日志指南](./REALTIME_LOGS_GUIDE.md) - 日志查看说明
- [🎮 直播显示指南](./LIVE_GAME_DISPLAY_GUIDE.md) - 游戏直播说明

## 🔧 开发指南

### 本地开发
```bash
# 启动开发环境
./scripts/start_v2.sh

# 代码格式化
cd backend && black . && isort .
cd frontend && npm run lint

# 运行测试
cd backend && pytest
cd frontend && npm test
```

### 项目结构说明

#### 后端模块
- **Game Master** (`backend/src/core/game/game_master.py`) - 游戏主控逻辑，负责游戏流程控制
- **LLM Client** (`backend/src/services/llm/`) - AI模型集成，支持多提供商
- **Session Manager** (`backend/src/services/game_manager/session_manager.py`) - 游戏会话管理
- **Realtime Logger** (`backend/src/services/logger/realtime_logger.py`) - 实时日志记录
- **API Routes** (`backend/src/api/v1/routes/`) - REST API接口
- **WebSocket** (`backend/src/api/v1/routes/websocket.py`) - 实时通信

#### 前端模块
- **App Router** (`frontend/src/app/`) - Next.js页面路由
- **Game Components** (`frontend/src/components/game/`) - 游戏相关组件
  - `LiveGameProgress.tsx` - 实时游戏进度展示
  - `GameLog.tsx` - 游戏日志显示
  - `PlayerInteractions.tsx` - 玩家交互界面
- **UI Components** (`frontend/src/components/ui/`) - 基础UI组件
- **State Management** (`frontend/src/lib/store/`) - Zustand状态管理
- **API Client** (`frontend/src/lib/api/websocket.ts`) - WebSocket客户端

## 🔬 研究背景

This repository provides code for [Werewolf Arena](https://arxiv.org/abs/2407.13943) - a framework for evaluating the social reasoning skills of large language models (LLMs) through the game of Werewolf.

## 🐛 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 查看端口占用
lsof -i :8000
lsof -i :3000

# 杀死占用进程
lsof -ti :8000 | xargs kill -9
lsof -ti :3000 | xargs kill -9
```

**2. API密钥配置错误**
- 检查 `backend/.env` 文件是否正确配置
- 确认API密钥有效且有足够额度

**3. 依赖安装失败**
```bash
# 清理npm缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# Python依赖问题
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### 日志查看
```bash
# 查看实时日志
tail -f backend_v2.log
tail -f frontend_v2.log

# 查看应用日志
cd backend && python -m uvicorn src.api.app:app --log-level debug
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 Apache 2.0 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 📈 当前状态

**版本**: v2.0.0
**更新时间**: 2025-11-01
**运行状态**: ✅ 服务正常运行
**游戏状态**: 🎮 实时游戏进行中

### 实时运行状态
- **后端服务**: FastAPI (端口8000) - 健康状态正常
- **前端服务**: Next.js (端口3000) - 页面响应正常
- **WebSocket**: 实时通信正常 - 支持多客户端连接
- **AI模型**: GLM系列模型已启用，游戏可正常进行
- **日志系统**: 实时日志记录正常，支持游戏回放

### 已实现功能
- ✅ 完整的狼人杀游戏流程
- ✅ 实时WebSocket通信
- ✅ 多AI模型支持
- ✅ 详细的游戏日志记录
- ✅ 现代化的Web界面
- ✅ 游戏会话管理
- ✅ 实时状态同步

**注意**: v1.0版本代码已完全移除，项目专注于v2.0现代化架构。如需v1代码，请查看git历史记录。