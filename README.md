# 🐺 狼人杀竞技场 - Werewolf Arena v2.0

一个基于大语言模型的狼人杀游戏框架，支持AI模型对战和实时观看。项目已完成前后端分离重构，提供现代化的Web界面。

## 🎯 版本说明

- **v2.0 (推荐)**: 重构版本 - Next.js前端 + FastAPI后端
- **v1.0 (兼容)**: 原始版本 - 静态HTML + Python后端

## 🚀 快速启动 (v2.0版本)

### 方法一：一键启动（推荐）

**macOS/Linux:**
```bash
./start.sh
```

### 方法二：手动启动

#### 1. 启动后端服务
```bash
cd backend
source ../venv/bin/activate  # Windows: venv\Scripts\activate

# 复制并配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入API密钥

# 启动后端
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8001
```

#### 2. 启动前端服务（新终端）
```bash
cd frontend
npm install  # 首次运行需要安装依赖
npm run dev
```

#### 3. 访问应用
- 🎮 **现代前端**: http://localhost:3000 (v2.0推荐)
- 🎮 **传统前端**: http://localhost:8080/home.html (v1.0兼容)
- 📚 **API文档**: http://localhost:8001/docs
- 📊 **健康检查**: http://localhost:8001/health

## 🔄 v1.0版本启动（兼容模式）

如果您想使用原始版本：

```bash
# 启动v1.0后端
python3 main.py --run --v_models=glm4 --w_models=gpt4

# 启动v1.0前端
python3 -m http.server 8080

# 访问地址
# 🎮 游戏主页: http://localhost:8080/home.html
# 📺 直播页面: http://localhost:8080/index.html
```

## 🏗️ 项目架构 (v2.0)

### 技术栈
- **后端**: FastAPI + Python 3.12 + Pydantic V2
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + Zustand
- **通信**: REST API + WebSocket
- **部署**: 支持Docker容器化

### 目录结构
```
werewolf_arena/
├── backend/                 # FastAPI后端服务
│   ├── src/
│   │   ├── core/           # 核心游戏逻辑
│   │   ├── services/       # LLM服务和业务逻辑
│   │   ├── api/           # FastAPI应用和路由
│   │   └── config/        # 配置管理
│   ├── tests/             # 后端测试
│   └── requirements.txt   # Python依赖
├── frontend/              # Next.js前端应用
│   ├── src/
│   │   ├── app/          # App Router页面
│   │   ├── components/   # React组件
│   │   ├── lib/          # 工具库和状态管理
│   │   └── types/        # TypeScript类型定义
│   └── package.json      # Node.js依赖
├── docs/                 # 项目文档
├── venv/                 # Python虚拟环境
└── start.sh             # 一键启动脚本
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
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **健康检查**: http://localhost:8001/health

### 主要API端点
- `GET /api/v1/games/` - 游戏列表
- `POST /api/v1/games/start` - 启动游戏
- `GET /api/v1/models/` - 可用模型
- `GET /api/v1/status/health` - 服务状态

## 📖 详细文档

- [重构进度报告](./REFACTORING_PROGRESS.md) - 完整的重构历程
- [启动指南](./STARTUP_GUIDE.md) - 详细的启动说明
- [架构路线图](./REFACTORING_ROADMAP.md) - 技术架构规划

## 🔬 研究背景

This repository provides code for [Werewolf Arena](https://arxiv.org/abs/2407.13943) - a framework for evaluating the social reasoning skills of large language models (LLMs) through the game of Werewolf.

## 🎮 支持的模型

### OpenAI
- GPT-4, GPT-4o, GPT-3.5-turbo

### 智谱AI (GLM)
- GLM-4, GLM-4-air, GLM-4-flash

### OpenRouter (多模型聚合)
- Claude 3.5 Sonnet, Gemini, Llama等

### 免费模型测试
```bash
# 使用GLM免费模型
python3 main.py --run --v_models=glm4-flash --w_models=glm4-flash
```

---

**当前版本**: v2.0.0
**最后更新**: 2025-10-31
**状态**: ✅ 前后端分离重构完成，可正常使用