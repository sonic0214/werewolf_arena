# 🎯 狼人杀竞技场重构路线图

**技术栈**: FastAPI + React + Next.js + Tailwind CSS

**最后更新**: 2025-10-31

---

## 📦 Phase 1: 项目结构重组 (优先级: 🔥最高)

### 任务清单

#### 1.1 创建新目录结构

- [ ] 创建 `backend/` 目录及子目录
  - [ ] `backend/src/core/game/`
  - [ ] `backend/src/core/models/`
  - [ ] `backend/src/services/llm/`
  - [ ] `backend/src/services/llm/providers/`
  - [ ] `backend/src/services/game_manager/`
  - [ ] `backend/src/services/logger/`
  - [ ] `backend/src/api/v1/routes/`
  - [ ] `backend/src/api/v1/schemas/`
  - [ ] `backend/src/api/middleware/`
  - [ ] `backend/src/config/`
  - [ ] `backend/src/utils/`
  - [ ] `backend/tests/unit/`
  - [ ] `backend/tests/integration/`
  - [ ] `backend/tests/fixtures/`

- [ ] 创建 `frontend/` 目录（Next.js项目）
  - [ ] 运行: `npx create-next-app@latest frontend --typescript --tailwind --app --src-dir`

- [ ] 创建 `shared/` 目录
  - [ ] `shared/logs/`
  - [ ] `shared/configs/`

- [ ] 创建 `docs/` 目录
  - [ ] `docs/architecture.md`
  - [ ] `docs/api.md`
  - [ ] `docs/development.md`
  - [ ] `docs/deployment.md`

#### 1.2 后端代码迁移

**核心游戏逻辑**:
- [ ] `werewolf/game.py` → `backend/src/core/game/game_master.py`
- [ ] `werewolf/prompts.py` → `backend/src/core/game/prompts.py`
- [ ] `werewolf/config.py` → `backend/src/config/game_config.py` (临时)
- [ ] `werewolf/utils.py` → `backend/src/utils/helpers.py`

**拆分 model.py**:
- [ ] `werewolf/model.py` → `backend/src/core/models/player.py` (Player, Villager, Werewolf, Seer, Doctor)
- [ ] `werewolf/model.py` → `backend/src/core/models/game_state.py` (State, Round, GameView)
- [ ] `werewolf/model.py` → `backend/src/core/models/logs.py` (LmLog, VoteLog, RoundLog)

**LLM服务层**:
- [ ] 创建 `backend/src/services/llm/base.py` (抽象基类)
- [ ] `werewolf/apis.py` → `backend/src/services/llm/providers/openai.py`
- [ ] `werewolf/apis.py` → `backend/src/services/llm/providers/glm.py`
- [ ] `werewolf/apis.py` → `backend/src/services/llm/providers/openrouter.py`
- [ ] 创建 `backend/src/services/llm/factory.py` (工厂模式)
- [ ] 创建 `backend/src/services/llm/client.py` (统一客户端)
- [ ] `werewolf/lm.py` → `backend/src/services/llm/generator.py`

**其他服务**:
- [ ] `werewolf/runner.py` → `backend/src/services/game_manager/runner.py`
- [ ] 创建 `backend/src/services/game_manager/session_manager.py`
- [ ] `werewolf/logging.py` → `backend/src/services/logger/game_logger.py`

---

## 🔧 Phase 2: 配置系统重构 (优先级: 🔥高)

### 任务清单

- [ ] 安装依赖: `pip install pydantic-settings`

- [ ] 创建 `backend/src/config/settings.py`:
  ```python
  # 包含:
  # - GameSettings
  # - LLMSettings
  # - ServerSettings
  # - CORSSettings
  # - Settings (主配置类)
  ```

- [ ] 创建 `backend/.env.example`

- [ ] 创建 `backend/src/config/models.yaml` (模型配置)

- [ ] 删除旧配置文件:
  - [ ] 清理 `api_config.py` (迁移后)
  - [ ] 清理 `game_config.py` (迁移后)
  - [ ] 移除 `runner.py` 中的 `model_to_id` 字典

---

## 🌐 Phase 3: FastAPI应用构建 (优先级: 🔥最高)

### 任务清单

#### 3.1 安装后端依赖

- [ ] 创建 `backend/requirements.txt`:
  ```
  fastapi==0.104.1
  uvicorn[standard]==0.24.0
  pydantic==2.5.0
  pydantic-settings==2.1.0
  websockets==12.0
  openai==1.3.0
  anthropic==0.7.0
  pytest==7.4.3
  pytest-asyncio==0.21.1
  pytest-mock==3.12.0
  httpx==0.25.2
  ```

- [ ] 运行: `cd backend && pip install -r requirements.txt`

#### 3.2 创建FastAPI应用

- [ ] 创建 `backend/src/api/app.py` (主应用)
- [ ] 创建 `backend/src/api/dependencies.py` (依赖注入)
- [ ] 创建 `backend/src/api/middleware/error_handler.py`
- [ ] 创建 `backend/src/api/middleware/logging.py`
- [ ] 创建 `backend/src/api/middleware/cors.py`

#### 3.3 定义API Schemas

- [ ] `backend/src/api/v1/schemas/game.py`:
  - GameStartRequest
  - GameStartResponse
  - GameStatusResponse
  - GameListResponse

- [ ] `backend/src/api/v1/schemas/player.py`
- [ ] `backend/src/api/v1/schemas/response.py`

#### 3.4 实现API路由

- [ ] `backend/src/api/v1/routes/games.py`:
  - POST /api/v1/games (开始游戏)
  - GET /api/v1/games/{session_id} (获取游戏状态)
  - POST /api/v1/games/{session_id}/stop (停止游戏)
  - GET /api/v1/games (列出所有游戏)

- [ ] `backend/src/api/v1/routes/status.py`:
  - GET /api/v1/status (健康检查)
  - GET /api/v1/status/api (API配置状态)

- [ ] `backend/src/api/v1/routes/models.py`:
  - GET /api/v1/models (列出可用模型)

- [ ] `backend/src/api/v1/routes/websocket.py`:
  - WebSocket /api/v1/ws/{session_id}

#### 3.5 重构核心逻辑支持依赖注入

- [ ] 修改 `GameMaster.__init__` 接受 LLMClient, GameLogger, GameSettings
- [ ] 修改 `Player` 类接受 LLMClient
- [ ] 更新所有调用点

---

## ⚛️ Phase 4: Next.js前端构建 (优先级: 🔥最高)

### 任务清单

#### 4.1 初始化Next.js项目

- [ ] 创建项目:
  ```bash
  npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"
  ```

- [ ] 安装依赖:
  ```bash
  cd frontend
  npm install zustand axios socket.io-client lucide-react clsx tailwind-merge
  ```

- [ ] 配置 `next.config.js`
- [ ] 配置 `tailwind.config.ts`
- [ ] 创建 `.env.local.example`

#### 4.2 TypeScript类型定义

- [ ] `src/types/game.ts` (Player, Round, GameState, API类型)
- [ ] `src/types/api.ts` (APIResponse, ModelInfo)

#### 4.3 API客户端

- [ ] `src/lib/api/client.ts` (Axios封装)
- [ ] `src/lib/api/games.ts` (游戏API)
- [ ] `src/lib/api/models.ts` (模型API)
- [ ] `src/lib/api/websocket.ts` (WebSocket客户端)

#### 4.4 状态管理 (Zustand)

- [ ] `src/lib/store/gameStore.ts` (游戏状态)
- [ ] `src/lib/store/uiStore.ts` (UI状态，可选)

#### 4.5 Custom Hooks

- [ ] `src/lib/hooks/useGame.ts`
- [ ] `src/lib/hooks/useWebSocket.ts`
- [ ] `src/lib/hooks/useModels.ts`

#### 4.6 UI基础组件

- [ ] `src/components/ui/Button.tsx`
- [ ] `src/components/ui/Card.tsx`
- [ ] `src/components/ui/Badge.tsx`
- [ ] `src/components/ui/Input.tsx`
- [ ] `src/components/ui/Select.tsx`

#### 4.7 游戏组件

- [ ] `src/components/game/GameBoard.tsx`
- [ ] `src/components/game/PlayerCard.tsx`
- [ ] `src/components/game/ChatPanel.tsx`
- [ ] `src/components/game/VotePanel.tsx`
- [ ] `src/components/game/GameControls.tsx`
- [ ] `src/components/game/RoundInfo.tsx`

- [ ] `src/components/ModelSelector.tsx`
- [ ] `src/components/layout/Header.tsx`
- [ ] `src/components/layout/Footer.tsx`

#### 4.8 页面组件

- [ ] `src/app/layout.tsx` (根布局)
- [ ] `src/app/page.tsx` (首页 - 游戏配置)
- [ ] `src/app/game/[sessionId]/page.tsx` (游戏页面)
- [ ] `src/app/game/[sessionId]/layout.tsx` (游戏布局)

#### 4.9 迁移静态资源

- [ ] 复制 `static/*.png` → `frontend/public/assets/avatars/`

---

## 🧪 Phase 5: 测试系统 (优先级: 🟡中)

### 任务清单

#### 5.1 后端测试

- [ ] 安装测试依赖:
  ```bash
  pip install pytest pytest-asyncio pytest-cov pytest-mock httpx
  ```

- [ ] 创建 `backend/tests/conftest.py`
- [ ] 创建 `backend/tests/fixtures/mock_llm_responses.py`

**单元测试**:
- [ ] `backend/tests/unit/test_game_master.py`
- [ ] `backend/tests/unit/test_player.py`
- [ ] `backend/tests/unit/test_llm_client.py`
- [ ] `backend/tests/unit/test_config.py`

**集成测试**:
- [ ] `backend/tests/integration/test_game_flow.py`
- [ ] `backend/tests/integration/test_api_endpoints.py`

#### 5.2 前端测试

- [ ] 安装测试依赖:
  ```bash
  npm install -D vitest @vue/test-utils jsdom @testing-library/react
  ```

- [ ] 配置 `vitest.config.ts`

**组件测试**:
- [ ] `src/components/ui/Button.test.tsx`
- [ ] `src/components/game/PlayerCard.test.tsx`

---

## 🚀 Phase 6: 部署与文档 (优先级: 🟢低)

### 任务清单

#### 6.1 Docker化

- [ ] 创建 `backend/Dockerfile`
- [ ] 创建 `frontend/Dockerfile`
- [ ] 创建 `docker-compose.yml`
- [ ] 创建 `.dockerignore` 文件

#### 6.2 CI/CD

- [ ] 创建 `.github/workflows/test.yml`
- [ ] 创建 `.github/workflows/deploy.yml`

#### 6.3 文档完善

- [ ] `docs/architecture.md` (系统架构)
- [ ] `docs/api.md` (API规范，可从FastAPI自动生成)
- [ ] `docs/development.md` (开发指南)
- [ ] `docs/deployment.md` (部署指南)
- [ ] 更新 `README.md`

---

## 📊 执行优先级

### 🔥 第一阶段 (Week 1-2): 基础设施
1. 创建目录结构
2. 迁移后端核心代码
3. 重构配置系统
4. LLM服务抽象与解耦

### 🔥 第二阶段 (Week 2-3): API与前端基础
5. FastAPI应用构建
6. Next.js项目初始化
7. API客户端与状态管理
8. 基础UI组件

### 🟡 第三阶段 (Week 3-4): 核心功能
9. 游戏组件开发
10. WebSocket实时更新
11. 完整游戏流程测试

### 🟢 第四阶段 (Week 4+): 优化与部署
12. 测试覆盖
13. 性能优化
14. Docker化部署
15. 文档完善

---

## 🎯 当前进度

### Phase 1: 项目结构重组
- [ ] 0% 完成

### Phase 2: 配置系统重构
- [ ] 0% 完成

### Phase 3: FastAPI应用构建
- [ ] 0% 完成

### Phase 4: Next.js前端构建
- [ ] 0% 完成

### Phase 5: 测试系统
- [ ] 0% 完成

### Phase 6: 部署与文档
- [ ] 0% 完成

---

## 📝 注意事项

1. **渐进式迁移**: 在重构过程中保持旧代码可运行，逐步替换
2. **测试验证**: 每完成一个Phase都要进行测试验证
3. **提交记录**: 频繁提交代码，每个小任务完成后都提交
4. **文档同步**: 及时更新文档，记录重构决策
5. **依赖管理**: 使用虚拟环境，避免依赖冲突

---

## 🔗 相关资源

- FastAPI文档: https://fastapi.tiangolo.com/
- Next.js文档: https://nextjs.org/docs
- Tailwind CSS文档: https://tailwindcss.com/docs
- Zustand文档: https://zustand-demo.pmnd.rs/
- Pydantic文档: https://docs.pydantic.dev/

---

**重构开始日期**: 2025-10-31
**预计完成日期**: 2025-11-28 (4周)
