# Frontend组件文档

## 📋 概述

本文档详细说明 Werewolf Arena Frontend 中所有组件的功能、接口和使用方法。组件采用原子设计理念，具有良好的可复用性和可维护性。

## 🗂️ 组件分类

### 📱 页面组件 (Pages)
### 🎨 UI基础组件 (UI Components)
### 🎮 游戏专用组件 (Game Components)
### 🪝 自定义Hooks (Custom Hooks)

---

## 📱 页面组件

### 主页组件
**文件位置**: `src/app/page.tsx`

**主要职责**: 游戏启动配置界面

**核心功能**:
- AI模型选择 (村民 vs 狼人)
- 游戏参数配置 (讨论时间、最大轮数)
- 自定义玩家名称设置
- 游戏启动控制
- 模型状态展示

**状态集成**:
```typescript
const { startGame, setGameSettings } = useGameActions();
const gameSettings = useGameSettings();
const gameLoading = useGameLoading();
const { models, loading: modelsLoading } = useModels();
```

**自动跳转逻辑**:
```typescript
useEffect(() => {
  if (currentGame && currentGame.session_id && gameLoading === 'success') {
    router.push(`/live/${currentGame.session_id}`);
  }
}, [currentGame, gameLoading, router]);
```

### 直播页面组件
**文件位置**: `src/app/live/[sessionId]/page.tsx`

**主要职责**: 实时游戏展示界面

**核心功能**:
- 实时游戏状态显示
- WebSocket连接管理
- 游戏进度可视化
- 玩家状态实时更新

**动态路由参数**: `sessionId`

### 日志页面组件
**文件位置**: `src/app/logs/[sessionId]/page.tsx`

**主要职责**: 游戏日志查看界面

**核心功能**:
- 历史游戏日志展示
- 实时日志流
- 日志搜索和过滤
- 游戏回放功能

---

## 🎨 UI基础组件

### Button 组件
**文件位置**: `src/components/ui/Button.tsx`

**Props接口**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}
```

**使用示例**:
```tsx
<Button
  variant="primary"
  size="lg"
  loading={isLoading}
  onClick={handleSubmit}
>
  Start Game
</Button>
```

**变体样式**:
- `primary`: 主要操作按钮，蓝色背景
- `secondary`: 次要操作按钮，灰色背景
- `danger`: 危险操作按钮，红色背景
- `ghost`: 透明背景按钮，悬停效果

### Card 组件
**文件位置**: `src/components/ui/Card.tsx`

**Props接口**:
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}
```

**使用示例**:
```tsx
<Card padding="lg" shadow>
  <h2>Game Configuration</h2>
  <p>Configure your game settings here</p>
</Card>
```

### Input 组件
**文件位置**: `src/components/ui/Input.tsx`

**Props接口**:
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
}
```

**使用示例**:
```tsx
<Input
  label="Player Names"
  placeholder="Enter comma-separated names"
  value={playerNames}
  onChange={setPlayerNames}
  helperText="Leave empty to use random names"
/>
```

### Select 组件
**文件位置**: `src/components/ui/Select.tsx`

**Props接口**:
```typescript
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string | string[];
  options: SelectOption[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  helperText?: string;
}
```

**使用示例**:
```tsx
<Select
  label="AI Model"
  value={selectedModel}
  onChange={setSelectedModel}
  options={modelOptions}
  helperText="Choose the AI model for villagers"
/>
```

### Badge 组件
**文件位置**: `src/components/ui/Badge.tsx`

**Props接口**:
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}
```

**使用示例**:
```tsx
<Badge variant="success" size="sm">Connected</Badge>
<Badge variant="danger">Werewolf</Badge>
```

---

## 🎮 游戏专用组件

### GameLog 组件
**文件位置**: `src/components/game/GameLog.tsx`

**主要职责**: 游戏日志实时显示

**核心功能**:
- 实时日志流处理
- 自动滚动到底部
- 日志分类和样式化
- 时间戳显示

**Props接口**:
```typescript
interface GameLogProps {
  logs: LogEntry[];
  loading?: boolean;
  className?: string;
  maxHeight?: string;
}
```

**特色功能**:
- **自动滚动**: 新日志自动滚动到视图中
- **分类样式**: 不同类型的日志有不同的样式
- **时间格式化**: 友好的时间显示格式
- **虚拟化**: 大量日志时的性能优化

### PlayerCard 组件
**文件位置**: `src/components/game/PlayerCard.tsx`

**主要职责**: 玩家信息展示

**核心功能**:
- 玩家状态显示 (存活/淘汰)
- 角色标识
- 动作历史记录
- 选中状态处理

**Props接口**:
```typescript
interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  onSelect?: (player: Player) => void;
  showRole?: boolean;
  compact?: boolean;
}
```

**状态样式**:
- **存活**: 绿色边框，正常显示
- **淘汰**: 灰色背景，删除线效果
- **选中**: 蓝色边框高亮
- **角色标识**: 不同角色的图标和颜色

### GameStats 组件
**文件位置**: `src/components/game/GameStats.tsx`

**主要职责**: 游戏统计信息展示

**核心功能**:
- 实时数据更新
- 图表可视化
- 关键指标展示
- 趋势分析

**Props接口**:
```typescript
interface GameStatsProps {
  game: GameState;
  showCharts?: boolean;
  className?: string;
}
```

**统计指标**:
- **存活玩家数**: 实时统计
- **轮次进度**: 当前轮次/总轮次
- **游戏时长**: 已进行时间
- **投票统计**: 投票分布图表

### LiveGameProgress 组件
**文件位置**: `src/components/game/LiveGameProgress.tsx`

**主要职责**: 实时游戏进度展示

**核心功能**:
- 阶段进度条
- 时间显示
- 状态转换动画
- 阶段说明

**Props接口**:
```typescript
interface LiveGameProgressProps {
  game: GameState;
  className?: string;
}
```

**进度阶段**:
- **等待阶段**: 游戏准备中
- **夜间阶段**: 狼人行动、医生保护、预言家查验
- **白天阶段**: 讨论和投票
- **结算阶段**: 游戏结束

### PlayerInteractions 组件
**文件位置**: `src/components/game/PlayerInteractions.tsx`

**主要职责**: 玩家交互界面

**核心功能**:
- 投票操作
- 动作历史
- 交互反馈
- 权限控制

**Props接口**:
```typescript
interface PlayerInteractionsProps {
  game: GameState;
  onVote?: (targetId: string) => void;
  onAction?: (action: string, targetId?: string) => void;
  className?: string;
}
```

**交互类型**:
- **投票**: 选择淘汰玩家
- **查验**: 预言家查验身份
- **保护**: 医生保护目标
- **击杀**: 狼人击杀目标

### GameTimeline 组件
**文件位置**: `src/components/game/GameTimeline.tsx`

**主要职责**: 游戏事件时间轴

**核心功能**:
- 事件时间轴
- 关键节点标记
- 可展开的详细信息
- 事件过滤

**Props接口**:
```typescript
interface GameTimelineProps {
  events: GameEvent[];
  className?: string;
  showDetails?: boolean;
}
```

**事件类型**:
- **游戏开始**: 游戏初始化
- **角色分配**: 玩家角色确定
- **夜间行动**: 各角色夜间行动
- **白天讨论**: 辩论和发言
- **投票结果**: 投票淘汰结果
- **游戏结束**: 胜负判定

---

## 🪝 自定义Hooks

### useGame Hook
**文件位置**: `src/lib/hooks/useGame.ts`

**主要功能**: 游戏状态管理和操作

**返回值**:
```typescript
interface UseGameReturn {
  game: GameState | null;
  loading: LoadingState;
  error: string | null;
  actions: {
    startGame: (config: GameConfig) => Promise<void>;
    stopGame: () => Promise<void>;
    getGameStatus: () => Promise<void>;
  };
}
```

**使用示例**:
```tsx
const { game, loading, actions } = useGame(sessionId);

useEffect(() => {
  actions.getGameStatus();
}, [sessionId]);
```

### useWebSocket Hook
**文件位置**: `src/lib/hooks/useWebSocket.ts`

**主要功能**: WebSocket连接管理

**返回值**:
```typescript
interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  send: (event: string, data?: any) => void;
}
```

**使用示例**:
```tsx
const { connected, connect, disconnect } = useWebSocket();

useEffect(() => {
  if (sessionId) {
    connect(sessionId);
    return () => disconnect();
  }
}, [sessionId]);
```

### useModels Hook
**文件位置**: `src/lib/hooks/useModels.ts`

**主要功能**: AI模型信息管理

**返回值**:
```typescript
interface UseModelsReturn {
  models: ModelInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**使用示例**:
```tsx
const { models, loading } = useModels();

const enabledModels = models.filter(model => model.enabled);
```

### usePerformanceOptimizations Hook
**文件位置**: `src/lib/hooks/usePerformanceOptimizations.ts`

**主要功能**: 性能优化工具集合

**优化功能**:
- **防抖**: 用户输入防抖处理
- **节流**: 频繁事件节流处理
- **虚拟化**: 大列表虚拟化
- **懒加载**: 组件和图片懒加载

**使用示例**:
```tsx
const { debounce, throttle, lazyLoad } = usePerformanceOptimizations();

const handleSearch = debounce((query: string) => {
  // 搜索逻辑
}, 300);
```

---

## 🎨 组件设计原则

### 1. 单一职责原则
- 每个组件只负责一个特定功能
- 避免组件功能过于复杂
- 便于测试和维护

### 2. 可复用性设计
- 通过props控制组件行为
- 避免硬编码的样式和逻辑
- 提供合理的默认值

### 3. 类型安全
- 完整的TypeScript接口定义
- 严格的类型检查
- 运行时类型验证

### 4. 性能优化
- 合理使用React.memo
- 避免不必要的重渲染
- 优化事件处理函数

### 5. 可访问性
- 语义化HTML结构
- 键盘导航支持
- 屏幕阅读器友好

---

## 🔧 组件开发指南

### 创建新组件
1. 在相应目录创建组件文件
2. 定义TypeScript接口
3. 实现组件逻辑
4. 添加样式和变体
5. 编写单元测试
6. 更新组件文档

### 组件命名规范
- **文件名**: PascalCase (如 `PlayerCard.tsx`)
- **组件名**: PascalCase (如 `PlayerCard`)
- **Props接口**: `ComponentProps` (如 `PlayerCardProps`)
- **样式类**: kebab-case (如 `player-card`)

### 样式约定
- 使用Tailwind CSS类名
- 响应式设计优先
- 一致的颜色和间距系统
- 主题变量支持

### 测试要求
- 单元测试覆盖核心逻辑
- 快照测试确保UI一致性
- 集成测试验证组件交互
- 可访问性测试

---

## 📚 使用示例

### 典型页面结构
```tsx
export default function GamePage() {
  const { game, loading } = useGame(sessionId);
  const { connected } = useWebSocket();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <GameStats game={game} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveGameProgress game={game} />
          <PlayerInteractions game={game} />
        </div>

        <div>
          <GameLog logs={game?.logs} />
        </div>
      </div>
    </div>
  );
}
```

### 组件组合示例
```tsx
function PlayerSection({ players }: { players: Player[] }) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <Card>
      <h3>Players</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            selected={selectedPlayer?.id === player.id}
            onSelect={setSelectedPlayer}
            showRole={game.revealed}
          />
        ))}
      </div>
    </Card>
  );
}
```

---

*本文档详细描述了Frontend所有组件的功能和使用方法，为开发者提供完整的组件库参考。*