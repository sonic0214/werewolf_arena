# Backend模块功能说明

## 📋 概述

本文档详细说明了Werewolf Arena Backend中各个模块的功能、职责和使用方法，为开发者提供深入的技术理解。

## 🗂️ 模块索引

### API层模块
- [API应用层](#api应用层)
- [API路由](#api路由)
- [数据模型](#数据模型)

### 核心业务层模块
- [游戏主控](#游戏主控)
- [游戏状态模型](#游戏状态模型)
- [玩家模型](#玩家模型)
- [日志模型](#日志模型)

### 服务层模块
- [游戏会话管理](#游戏会话管理)
- [LLM客户端系统](#llm客户端系统)
- [日志系统](#日志系统)

### 配置层模块
- [应用配置](#应用配置)
- [模型加载器](#模型加载器)
- [时序配置](#时序配置)

### 工具层模块
- [通用工具](#通用工具)

---

## 🌐 API层模块

### API应用层
**文件位置**: `src/api/app.py`

**主要职责**:
- FastAPI应用生命周期管理
- 全局依赖初始化（LLM客户端）
- 中间件配置（CORS、异常处理）
- 路由注册和API版本管理

**核心功能**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化
    llm_client = LLMClient.from_settings(settings)
    set_global_llm_client(llm_client)
    yield
    # 关闭时清理资源
```

**关键特性**:
- 异步启动和关闭
- 全局LLM客户端管理
- 健康状态监控
- 自动重载支持

### API路由

#### 游戏管理路由
**文件位置**: `src/api/v1/routes/games.py`

**主要功能**:
- 游戏创建和启动
- 游戏状态查询
- 游戏停止控制
- 游戏列表管理

**核心端点**:
```python
@router.post("/start")
async def start_game(request: GameStartRequest):
    # 创建新游戏会话
    session = game_manager.create_game(...)
    game_manager.start_game(session.session_id)
    return {"session_id": session.session_id, "status": "initializing"}

@router.get("/{session_id}")
async def get_game(session_id: str):
    # 获取游戏状态
    session = game_manager.get_session(session_id)
    return session.to_dict()
```

#### WebSocket路由
**文件位置**: `src/api/v1/routes/websocket.py`

**主要功能**:
- WebSocket连接管理
- 实时消息广播
- 连接状态监控
- 消息格式验证

**核心功能**:
```python
@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    # 添加到连接池
    connection_manager.add_connection(session_id, websocket)
    # 处理消息循环
    while True:
        data = await websocket.receive_text()
        # 处理客户端消息
```

#### 模型路由
**文件位置**: `src/api/v1/routes/models.py`

**主要功能**:
- 可用AI模型列表
- 模型配置信息
- 模型健康状态

#### 状态和时序路由
**文件位置**: `src/api/v1/routes/status.py`, `src/api/v1/routes/timing.py`

**主要功能**:
- 系统健康监控
- 游戏时序配置
- 运行时统计

### 数据模型

#### 游戏数据模型
**文件位置**: `src/api/v1/schemas/game.py`

**主要模型**:
```python
class GameStartRequest(BaseModel):
    villager_model: str
    werewolf_model: str
    player_names: Optional[List[str]] = None
    discussion_time_minutes: int = 5
    max_rounds: int = 10

class GameState(BaseModel):
    session_id: str
    status: str
    current_round: int
    winner: Optional[str]
    players: List[PlayerInfo]
    game_phase: str
    started_at: datetime
```

---

## 🎮 核心业务层模块

### 游戏主控
**文件位置**: `src/core/game/game_master.py`

**核心职责**:
- 完整的狼人杀游戏流程控制
- 玩家行动协调
- 游戏状态管理
- 实时事件通知

**主要方法**:
```python
class GameMaster:
    def run_game(self) -> str:
        """运行完整游戏"""
        while not self.state.winner and not self.should_stop:
            self.run_round()
            if self.should_stop:
                break
        return self.state.winner

    def eliminate(self):
        """狼人夜间击杀"""
        # 狼人选择击杀目标
        # 发送WebSocket通知

    def run_day_phase(self):
        """白天讨论和投票"""
        # 玩家辩论
        # 投票流程
        # 淘汰判定
```

**特色功能**:
- 可配置游戏模式（normal, fast, slow, demo）
- 实时WebSocket事件通知
- 优雅的游戏停止机制
- 详细的推理过程记录

### 游戏状态模型
**文件位置**: `src/core/models/game_state.py`

**主要类**:

#### State类
```python
class State:
    def __init__(self, villagers, werewolves, seer, doctor, session_id):
        self.villagers = villagers
        self.werewolves = werewolves
        self.seer = seer
        self.doctor = doctor
        self.session_id = session_id
        self.rounds = []
        self.winner = None
```

#### Round类
```python
class Round:
    def __init__(self):
        self.players = []
        self.eliminated = None
        self.protected = None
        self.unmasked = None
        self.exiled = None
        self.bids = []
        self.debate = []
        self.votes = []
        self.success = False
```

### 玩家模型
**文件位置**: `src/core/models/player.py`

**主要角色类**:

#### Villager类（村民）
```python
class Villager(BasePlayer):
    def bid(self) -> Tuple[int, str]:
        """竞价发言"""
        # 生成竞价逻辑
        return bid_amount, reasoning

    def debate(self) -> str:
        """辩论发言"""
        # 生成辩论内容
        return dialogue

    def vote(self) -> str:
        """投票"""
        # 生成投票决策
        return target_player
```

#### Werewolf类（狼人）
```python
class Werewolf(BasePlayer):
    def eliminate(self) -> Tuple[Optional[str], Log]:
        """夜间击杀"""
        # 选择击杀目标
        return target, reasoning
```

#### Seer类（预言家）
```python
class Seer(BasePlayer):
    def unmask(self) -> Tuple[Optional[str], Log]:
        """查验身份"""
        # 选择查验目标
        return target, reasoning
```

#### Doctor类（医生）
```python
class Doctor(BasePlayer):
    def save(self) -> Tuple[Optional[str], Log]:
        """保护玩家"""
        # 选择保护目标
        return target, reasoning
```

### 日志模型
**文件位置**: `src/core/models/logs.py`

**主要类**:
```python
class RoundLog:
    def __init__(self):
        self.bid = []
        self.debate = []
        self.votes = []
        self.summaries = []

class VoteLog:
    def __init__(self, voter: str, target: str, reasoning: str):
        self.voter = voter
        self.target = target
        self.reasoning = reasoning
        self.timestamp = datetime.now()
```

---

## 🤖 服务层模块

### 游戏会话管理
**文件位置**: `src/services/game_manager/session_manager.py`

**核心职责**:
- 游戏会话生命周期管理
- 多游戏并发控制
- WebSocket事件协调
- 线程安全的操作

**主要类**:

#### GameSession类
```python
class GameSession:
    def __init__(self, session_id, state, gamemaster, log_dir):
        self.session_id = session_id
        self.state = state
        self.gamemaster = gamemaster
        self.log_dir = log_dir
        self.started_at = datetime.now()
        self.thread = None
        self.is_running = False
```

#### GameSessionManager类（单例）
```python
class GameSessionManager:
    _instance = None
    _lock = threading.Lock()

    def create_game(self, villager_model, werewolf_model, ...):
        """创建新游戏会话"""
        # 初始化玩家
        # 创建游戏状态
        # 初始化GameMaster
        # 保存会话

    def start_game(self, session_id: str) -> bool:
        """启动游戏（后台线程）"""
        # 创建游戏线程
        # 设置运行状态
        # 启动线程

    def stop_game(self, session_id: str) -> bool:
        """停止游戏"""
        # 调用GameMaster.stop()
        # 更新状态
```

**核心特性**:
- 单例模式确保全局唯一
- 线程安全的会话管理
- 异步游戏执行
- WebSocket事件集成

### LLM客户端系统
**文件位置**: `src/services/llm/`

#### 统一LLM客户端
**文件位置**: `src/services/llm/client.py`

**核心职责**:
- 多提供商统一接口
- 模型路由和识别
- 健康状态检查
- 配置管理

**主要功能**:
```python
class LLMClient:
    def call(self, model, prompt, temperature=0.7, **kwargs):
        """调用LLM生成文本"""
        provider = self._get_provider_for_model(model)
        return provider.generate(model, prompt, temperature, **kwargs)

    def health_check(self):
        """检查所有提供商健康状态"""
        return {name: provider.health_check() for name, provider in self.providers.items()}

    @classmethod
    def from_settings(cls, settings):
        """从配置创建LLM客户端"""
        providers = {}
        # 配置GLM、OpenAI、OpenRouter
        return cls(providers)
```

#### 提供商工厂
**文件位置**: `src/services/llm/factory.py`

**功能**:
- 根据类型创建LLM提供商实例
- 统一的提供商接口
- 配置参数管理

#### 具体提供商实现
**GLM提供商**: `src/services/llm/providers/glm.py`
**OpenAI提供商**: `src/services/llm/providers/openai.py`
**OpenRouter提供商**: `src/services/llm/providers/openrouter.py`

**基础接口**:
```python
class LLMProvider(ABC):
    @abstractmethod
    def generate(self, model, prompt, temperature=0.7, **kwargs):
        """生成文本"""
        pass

    @abstractmethod
    def health_check(self):
        """健康检查"""
        pass
```

### 日志系统
**文件位置**: `src/services/logger/`

#### 实时日志记录器
**文件位置**: `src/services/logger/realtime_logger.py`

**主要功能**:
- 结构化实时日志记录
- WebSocket订阅机制
- 文件实时写入
- 日志格式标准化

**核心功能**:
```python
class RealtimeLogger:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.log_file = f"{session_id}/realtime_logs.jsonl"
        self.subscribers = set()

    def log_action(self, player_name: str, action: str, content: str):
        """记录玩家行动"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "session_id": self.session_id,
            "action": action,
            "player": player_name,
            "content": content
        }
        self._write_log(log_entry)
        self._notify_subscribers(log_entry)

    def subscribe(self, websocket):
        """订阅日志更新"""
        self.subscribers.add(websocket)
```

#### 游戏日志管理
**文件位置**: `src/services/logger/game_logger.py`

**主要功能**:
- 游戏数据保存
- 日志目录管理
- 游戏状态快照

---

## ⚙️ 配置层模块

### 应用配置
**文件位置**: `src/config/settings.py`

**主要职责**:
- 环境变量处理
- API密钥管理
- 服务参数配置
- 开发/生产环境区分

**核心配置**:
```python
class Settings(BaseSettings):
    project_name: str = "Werewolf Arena"
    version: str = "2.0.0"
    environment: str = "development"
    debug: bool = False

    # LLM配置
    llm_glm_api_key: Optional[str] = None
    llm_openai_api_key: Optional[str] = None
    llm_openrouter_api_key: Optional[str] = None

    # CORS配置
    cors_allow_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
```

### 模型加载器
**文件位置**: `src/config/loader.py`

**主要功能**:
- 模型别名管理
- 模型元数据注册
- 模型ID转换

**核心功能**:
```python
model_registry = ModelRegistry()

# 注册模型
model_registry.register_model("glmz1-flash", "glm/GLM-Z1-Flash", {
    "name": "GLM-Z1-Flash",
    "provider": "glm",
    "enabled": True,
    "description": "智谱AI最新快速模型"
})

# 模型ID转换
full_model_id = model_registry.get_full_model_id("glmz1-flash")
```

### 时序配置
**文件位置**: `src/config/timing_loader.py`

**主要功能**:
- 游戏动作延迟配置
- 游戏模式时序参数
- 动态延迟加载

**配置示例**:
```yaml
normal:
  night_action: 3.0
  debate: 5.0
  vote: 2.0
  summary: 3.0

fast:
  night_action: 1.0
  debate: 2.0
  vote: 1.0
  summary: 1.0
```

---

## 🔧 工具层模块

### 通用工具
**文件位置**: `src/utils/helpers.py`

**主要功能**:
- 字符串处理工具
- 时间格式化函数
- 数据验证工具
- 错误处理辅助

**示例函数**:
```python
def format_duration(seconds: int) -> str:
    """格式化时间间隔"""
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        return f"{seconds // 60}m {seconds % 60}s"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}h {minutes}m"

def validate_player_name(name: str) -> bool:
    """验证玩家名称"""
    return isinstance(name, str) and 2 <= len(name) <= 50
```

---

## 🔗 模块间依赖关系

### 依赖层次结构
```
API层
  ↓
服务层
  ↓
核心业务层
  ↓
配置层
```

### 关键依赖
1. **GameMaster** → **Player Models** → **LLM Client**
2. **SessionManager** → **GameMaster** → **WebSocket**
3. **LLM Client** → **Model Registry** → **Settings**
4. **RealtimeLogger** → **WebSocket** → **SessionManager**

### 循环依赖处理
- WebSocket通知使用延迟导入避免循环依赖
- 全局LLM客户端通过工厂模式初始化
- 事件系统使用观察者模式解耦

---

## 📚 扩展指南

### 添加新游戏角色
1. 在`player.py`中创建新角色类
2. 继承`BasePlayer`基类
3. 实现角色特定方法
4. 更新游戏初始化逻辑

### 集成新AI提供商
1. 在`providers/`目录下实现新提供商
2. 继承`LLMProvider`基类
3. 在`factory.py`中注册新提供商
4. 更新`settings.py`添加配置选项

### 扩展WebSocket功能
1. 在`websocket.py`中添加新消息类型
2. 更新`sequence_manager.py`中的事件类型
3. 在相关模块中添加事件触发
4. 更新前端消息处理逻辑

---

*本文档详细描述了Backend各模块的功能和实现，为开发者提供全面的技术参考。*