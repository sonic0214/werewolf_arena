# MultiWolf Live AI 组件库文档

## 📋 概述

本文档详细说明 MultiWolf Live AI 项目中所有组件的功能、接口和使用方法。项目采用现代化组件设计理念，结合 shadcn/ui 组件库，提供丰富的交互功能和优秀的用户体验。

## 🗂️ 组件分类

### 📱 页面组件 (Pages)
### 🎮 游戏组件 (Game Components)
### 🎨 UI基础组件 (UI Components - shadcn/ui)
### 🪝 自定义Hooks (Custom Hooks)

---

## 📱 页面组件

### Index 组件
**文件位置**: `src/pages/Index.tsx`

**主要职责**: 项目主页，展示游戏入口和统计数据

**核心功能**:
- 实时数据滚动显示
- 直播入口和游戏状态展示
- 模型表现趋势图表
- 用户胜注排行榜
- 上帝视角模式选择器

**关键特性**:
```typescript
const Index = () => {
  const [showGodModeSelector, setShowGodModeSelector] = useState(false);

  const handleEnterLivestream = () => {
    setShowGodModeSelector(true);
  };

  const handleGodModeSelected = (mode: "inside" | "outside") => {
    navigate("/livestream", { state: { godMode: mode } });
  };
};
```

**数据结构**:
- `userRankings`: 用户排行榜数据
- `modelPerformanceData`: 模型表现数据
- `currentGameStatus`: 当前游戏状态

### Livestream 组件
**文件位置**: `src/pages/Livestream.tsx`

**主要职责**: 游戏直播页面，圆桌游戏界面

**核心功能**:
- 圆桌布局的AI模型展示
- 实时发言轮换机制
- 上帝视角信息展示
- 下注和聊天浮窗
- 游戏信息面板

**圆桌布局算法**:
```typescript
const angle = (index * 360) / models.length - 90;
const radius = 240;
const x = Math.cos((angle * Math.PI) / 180) * radius;
const y = Math.sin((angle * Math.PI) / 180) * radius;
```

**Props接口**:
```typescript
interface LivestreamProps {
  // 从location.state接收godMode
  godMode: "inside" | "outside";
}
```

### Leaderboard 组件
**文件位置**: `src/pages/Leaderboard.tsx`

**主要职责**: 排行榜页面，展示用户和模型排名

**核心功能**:
- 用户胜注排行榜
- 模型表现排行榜
- 历史记录展示
- 搜索和筛选功能

### Models 组件
**文件位置**: `src/pages/Models.tsx`

**主要职责**: AI模型展示页面

**核心功能**:
- 模型详细信息展示
- 性能统计数据
- 历史对战记录
- 模型对比功能

### NotFound 组件
**文件位置**: `src/pages/NotFound.tsx`

**主要职责**: 404错误页面

**核心功能**:
- 友好的404错误提示
- 返回首页导航
- 错误信息展示

---

## 🎮 游戏专用组件

### ModelAvatar 组件
**文件位置**: `src/components/ModelAvatar.tsx`

**主要职责**: AI模型头像展示组件

**核心功能**:
- 模型头像显示
- 状态指示器 (存活/淘汰)
- 投票数量显示
- 发言状态指示
- 角色信息显示 (上帝模式)

**Props接口**:
```typescript
interface ModelAvatarProps {
  model: {
    id: number;
    name: string;
    role: string;
    status: "alive" | "eliminated";
    votes: number;
  };
  isActive: boolean;           // 是否正在发言
  godMode: "inside" | "outside"; // 上帝模式
  votes: number;               // 投票数
}
```

**使用示例**:
```tsx
<ModelAvatar
  model={modelData}
  isActive={currentSpeaker === index}
  godMode={godMode}
  votes={model.votes}
/>
```

### GameInfo 组件
**文件位置**: `src/components/GameInfo.tsx`

**主要职责**: 游戏信息面板

**核心功能**:
- 当前轮次和阶段信息
- 当前发言者信息
- 历史发言记录
- 淘汰玩家列表
- 游戏统计数据

**Props接口**:
```typescript
interface GameInfoProps {
  currentRound: number;
  currentPhase: string;
  currentSpeaker: {
    name: string;
    content: string;
  };
  historySpeeches: Array<{
    name: string;
    content: string;
  }>;
  eliminatedPlayers: string[];
}
```

### BettingPanel 组件
**文件位置**: `src/components/BettingPanel.tsx`

**主要职责**: 下注面板组件

**核心功能**:
- 实时赔率显示
- 下注金额选择
- 收益计算
- 下注历史
- 余额管理

**Props接口**:
```typescript
interface BettingPanelProps {
  onClose: () => void;
  wolvesOdds: number;    // 狼人赔率
  villagersOdds: number; // 村民赔率
}
```

**使用示例**:
```tsx
<BettingPanel
  onClose={() => setShowBetting(false)}
  wolvesOdds={1.8}
  villagersOdds={2.1}
/>
```

### ChatPanel 组件
**文件位置**: `src/components/ChatPanel.tsx`

**主要职责**: 聊天面板组件

**核心功能**:
- 实时消息显示
- 消息发送功能
- 用户信息展示
- 消息历史记录
- 表情符号支持

**Props接口**:
```typescript
interface ChatPanelProps {
  onClose: () => void;
}
```

### GodModeSelector 组件
**文件位置**: `src/components/GodModeSelector.tsx`

**主要职责**: 上帝模式选择器

**核心功能**:
- 场内上帝模式选择
- 场外上帝模式选择
- 模式说明和介绍
- 确认和取消操作

**Props接口**:
```typescript
interface GodModeSelectorProps {
  onSelect: (mode: "inside" | "outside") => void;
  onClose: () => void;
}
```

**模式说明**:
- **场内上帝**: 可以查看所有玩家的角色信息
- **场外上帝**: 只能观察游戏进程，无法查看角色信息

---

## 🎨 UI基础组件 (shadcn/ui)

项目使用 shadcn/ui 组件库，提供完整的现代化UI组件。以下是主要组件的使用说明：

### Button 组件
**文件位置**: `src/components/ui/button.tsx`

**变体类型**:
- `default`: 默认按钮样式
- `destructive`: 危险操作按钮
- `outline`: 边框按钮
- `secondary`: 次要按钮
- `ghost`: 透明按钮
- `link`: 链接样式按钮

**尺寸类型**:
- `default`: 默认尺寸
- `sm`: 小尺寸
- `lg`: 大尺寸
- `icon`: 图标尺寸

**使用示例**:
```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  进入直播间
</Button>
```

### Card 组件
**文件位置**: `src/components/ui/card.tsx`

**组件结构**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>
    内容区域
  </CardContent>
  <CardFooter>
    底部区域
  </CardFooter>
</Card>
```

### Badge 组件
**文件位置**: `src/components/ui/badge.tsx`

**变体类型**:
- `default`: 默认样式
- `secondary`: 次要样式
- `destructive`: 危险样式
- `outline`: 边框样式

**使用示例**:
```tsx
<Badge variant="destructive">
  <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
  直播中
</Badge>
```

### 其他UI组件
项目还包含以下 shadcn/ui 组件：
- **Dialog**: 对话框组件
- **Select**: 下拉选择组件
- **Input**: 输入框组件
- **Textarea**: 文本域组件
- **Toast**: 提示消息组件
- **Tooltip**: 工具提示组件
- **Accordion**: 手风琴组件
- **Tabs**: 标签页组件
- **Table**: 表格组件
- **Chart**: 图表组件

---

## 🪝 自定义Hooks

### useMobile Hook
**文件位置**: `src/hooks/use-mobile.tsx`

**主要功能**: 检测用户设备类型

**使用方式**:
```typescript
import { useMobile } from "@/hooks/use-mobile";

const Component = () => {
  const isMobile = useMobile();

  return (
    <div>
      {isMobile ? "移动端视图" : "桌面端视图"}
    </div>
  );
};
```

### useToast Hook
**文件位置**: `src/hooks/use-toast.ts`

**主要功能**: 提示消息管理

**使用方式**:
```typescript
import { useToast } from "@/hooks/use-toast";

const Component = () => {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "操作成功",
      description: "游戏已成功启动",
    });
  };

  return <button onClick={showToast}>显示提示</button>;
};
```

---

## 🎨 组件设计原则

### 1. 单一职责原则
- 每个组件只负责一个特定功能
- 避免组件过于复杂
- 便于测试和维护

### 2. 可复用性设计
- 通过props控制组件行为
- 避免硬编码样式和逻辑
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
5. 编写组件文档
6. 添加单元测试

### 组件命名规范
- **文件名**: PascalCase (如 `ModelAvatar.tsx`)
- **组件名**: PascalCase (如 `ModelAvatar`)
- **Props接口**: `ComponentProps` (如 `ModelAvatarProps`)
- **样式类**: kebab-case (如 `model-avatar`)

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
const LivestreamPage = () => {
  const [showBetting, setShowBetting] = useState(false);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部控制栏 */}
      <TopBar />

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* 圆桌游戏区 */}
          <div className="col-span-8">
            <GameTable />
          </div>

          {/* 游戏信息面板 */}
          <div className="col-span-4">
            <GameInfo />
          </div>
        </div>
      </div>

      {/* 浮窗按钮组 */}
      <FloatingButtons>
        <Button onClick={() => setShowChat(!showChat)}>
          聊天
        </Button>
        <Button onClick={() => setShowBetting(!showBetting)}>
          下注
        </Button>
      </FloatingButtons>

      {/* 浮窗组件 */}
      {showChat && <ChatPanel onClose={() => setShowChat(false)} />}
      {showBetting && <BettingPanel onClose={() => setShowBetting(false)} />}
    </div>
  );
};
```

### 组件组合示例
```tsx
const ModelSection = ({ models }: { models: ModelData[] }) => {
  const [currentSpeaker, setCurrentSpeaker] = useState(0);

  return (
    <Card>
      <h3>AI模型列表</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {models.map((model, index) => (
          <ModelAvatar
            key={model.id}
            model={model}
            isActive={currentSpeaker === index}
            godMode="outside"
            votes={model.votes}
          />
        ))}
      </div>
    </Card>
  );
};
```

---

## 🔍 调试和测试

### 开发工具
- **React DevTools**: React组件调试
- **浏览器开发者工具**: 样式和网络调试
- **控制台日志**: 详细的调试信息

### 错误处理
- **错误边界**: 组件错误捕获和恢复
- **类型检查**: TypeScript编译时错误检查
- **运行时错误**: 友好的错误提示信息

---

## 📈 性能优化

### 渲染优化
- **React.memo**: 组件级别的缓存
- **useCallback**: 事件函数缓存
- **useMemo**: 计算结果缓存
- **虚拟化**: 大列表虚拟滚动

### 代码优化
- **代码分割**: 按需加载组件
- **懒加载**: 图片和组件懒加载
- **Bundle优化**: Webpack打包优化

---

*本文档详细描述了MultiWolf Live AI所有组件的功能和使用方法，为开发者提供完整的组件库参考。*