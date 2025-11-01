# MultiWolf Live AI 架构文档

## 📋 概述

MultiWolf Live AI 是一个现代化的 AI 狼人杀游戏直播平台，提供实时观看、下注和排行榜功能。项目采用 React 技术栈，结合 shadcn/ui 组件库，打造沉浸式的游戏体验界面。

## 🏗️ 技术架构

### 核心技术栈
- **前端框架**: React 18 + TypeScript 5.8+
- **构建工具**: Vite 5.4+ (端口8080)
- **UI 组件库**: shadcn/ui + Radix UI
- **样式框架**: Tailwind CSS 3.4+
- **路由管理**: React Router Dom 6.30+
- **状态管理**: TanStack Query 5.83+
- **图表库**: Recharts 2.15+
- **开发工具**: ESLint + TypeScript

### 项目结构
```
multiwolf-live-ai-main/
├── src/
│   ├── pages/                 # 页面组件
│   │   ├── Index.tsx         # 主页 - 游戏入口和统计
│   │   ├── Livestream.tsx   # 直播页面 - 圆桌游戏界面
│   │   ├── Leaderboard.tsx  # 排行榜页面
│   │   ├── Models.tsx        # 模型展示页面
│   │   └── NotFound.tsx      # 404页面
│   ├── components/           # 游戏专用组件
│   │   ├── ModelAvatar.tsx   # AI模型头像组件
│   │   ├── GameInfo.tsx      # 游戏信息面板
│   │   ├── BettingPanel.tsx  # 下注面板
│   │   ├── ChatPanel.tsx     # 聊天面板
│   │   └── GodModeSelector.tsx # 上帝模式选择器
│   ├── components/ui/        # shadcn/ui 基础组件
│   │   ├── button.tsx        # 按钮组件
│   │   ├── card.tsx          # 卡片组件
│   │   ├── badge.tsx         # 标签组件
│   │   └── ...               # 其他UI组件
│   ├── hooks/                # 自定义Hooks
│   │   ├── use-mobile.tsx    # 移动端检测
│   │   └── use-toast.ts      # 提示消息
│   ├── lib/                  # 工具库
│   │   └── utils.ts          # 通用工具函数
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── public/                  # 静态资源
├── docs/                    # 项目文档
├── package.json             # 项目配置
├── vite.config.ts          # Vite配置
├── tailwind.config.ts      # Tailwind配置
└── tsconfig.json           # TypeScript配置
```

## 🎮 核心功能架构

### 1. 游戏直播系统

#### 圆桌布局设计
```typescript
// 圆桌玩家布局算法
const angle = (index * 360) / models.length - 90; // 从顶部开始
const radius = 240;
const x = Math.cos((angle * Math.PI) / 180) * radius;
const y = Math.sin((angle * Math.PI) / 180) * radius;
```

#### 实时发言模拟
- **轮换机制**: 5秒自动切换发言玩家
- **发言内容**: 预设的AI对话内容
- **状态显示**: 当前发言者高亮显示

#### 上帝视角模式
- **场内上帝**: 查看所有角色信息
- **场外上帝**: 仅观察游戏进程
- **模式切换**: 通过弹窗选择观察模式

### 2. 数据可视化系统

#### 模型表现图表
```typescript
const modelPerformanceData = [
  { round: "1", "GPT-4": 75, "Claude": 68, "LLaMA": 62, "Gemini": 70 },
  // ... 多轮数据
];
```

#### 用户排行榜
- **胜注排行**: 基于虚拟货币的排行榜
- **胜率统计**: 用户胜率计算
- **趋势显示**: 收益变化趋势

### 3. 交互系统

#### 下注面板
- **实时赔率**: 狼人/村民赔率动态调整
- **下注金额**: 可选择下注金额
- **收益计算**: 实时显示预期收益

#### 聊天系统
- **实时评论**: 用户实时评论功能
- **浮窗设计**: 可收缩的聊天面板
- **消息展示**: 滚动显示历史消息

## 🔄 数据流架构

### 路由系统
```typescript
// React Router 配置
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/livestream" element={<Livestream />} />
  <Route path="/leaderboard" element={<Leaderboard />} />
  <Route path="/models" element={<Models />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 状态管理
```typescript
// TanStack Query 用于数据获取
const queryClient = new QueryClient();

// 全局状态提供者
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <BrowserRouter>
      {/* 应用路由 */}
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

### 组件通信
- **Props传递**: 父子组件数据传递
- **状态提升**: 共享状态提升到父组件
- **Hook共享**: 自定义Hook共享逻辑

## 🎨 UI/UX 设计架构

### 设计系统
- **主题变量**: CSS变量实现主题切换
- **响应式设计**: 移动端优先的响应式布局
- **组件一致性**: shadcn/ui 组件库保证一致性

### 视觉特效
- **动画效果**: CSS动画和过渡效果
- **发光效果**: 特殊元素的发光效果
- **加载状态**: 优雅的加载和过渡状态

### 交互设计
- **悬停效果**: 按钮和卡片的悬停反馈
- **点击反馈**: 即时的点击响应
- **键盘导航**: 完整的键盘导航支持

## 🔧 组件架构

### 页面组件层次
```
App (根组件)
├── Index (主页)
│   ├── 导航栏
│   ├── 实时数据滚动
│   ├── 直播入口卡片
│   ├── 模型表现图表
│   └── 用户排行榜
├── Livestream (直播页)
│   ├── 顶部控制栏
│   ├── 圆桌游戏区
│   ├── 游戏信息面板
│   ├── 下注面板 (浮窗)
│   └── 聊天面板 (浮窗)
├── Leaderboard (排行榜)
├── Models (模型展示)
└── NotFound (404页面)
```

### 组件复用策略
- **基础组件**: shadcn/ui 提供可复用的基础组件
- **业务组件**: 游戏相关的专用组件
- **布局组件**: 页面布局和容器组件
- **Hook组件**: 可复用的逻辑Hook

## 🚀 性能优化

### 构建优化
- **Vite构建**: 快速的开发服务器和构建工具
- **代码分割**: React Router实现代码分割
- **Tree Shaking**: 自动移除未使用的代码

### 运行时优化
- **React.memo**: 组件级别的渲染优化
- **useCallback/useMemo**: Hook级别的优化
- **懒加载**: 图片和组件的懒加载

### 资源优化
- **图标优化**: Lucide React 图标库优化
- **字体优化**: Google字体优化加载
- **CSS优化**: Tailwind CSS 生产环境优化

## 🔒 安全考虑

### 前端安全
- **XSS防护**: React内置的XSS防护
- **输入验证**: 表单输入验证和清理
- **依赖安全**: 定期更新依赖包

### 数据安全
- **敏感信息**: 避免在前端存储敏感信息
- **API安全**: API调用的安全验证
- **用户隐私**: 用户数据的隐私保护

## 📱 响应式设计

### 断点设置
```css
/* Tailwind CSS 默认断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

### 适配策略
- **移动端优先**: 基础样式针对移动端设计
- **渐进增强**: 大屏幕添加更多功能
- **触摸优化**: 移动端触摸操作优化

## 🧪 开发工具

### 代码质量
- **TypeScript**: 类型安全的开发
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

### 开发体验
- **热重载**: Vite的热重载功能
- **开发工具**: React DevTools支持
- **错误处理**: 友好的错误提示

## 🚀 部署架构

### 构建流程
1. **依赖安装**: `npm install`
2. **类型检查**: TypeScript类型检查
3. **代码检查**: ESLint代码检查
4. **构建**: `npm run build`
5. **预览**: `npm run preview`

### 部署环境
- **开发环境**: Vite开发服务器 (端口8080)
- **生产环境**: 静态文件部署
- **CDN优化**: 静态资源CDN加速

## 📊 监控和分析

### 性能监控
- **构建分析**: Bundle分析工具
- **性能指标**: Core Web Vitals监控
- **错误追踪**: 运行时错误监控

### 用户行为分析
- **页面访问**: 页面访问统计
- **功能使用**: 功能使用情况分析
- **用户反馈**: 用户行为和反馈收集

## 🔮 扩展性考虑

### 功能扩展
- **多语言支持**: 国际化框架集成
- **主题系统**: 动态主题切换
- **插件系统**: 功能插件化架构

### 技术升级
- **框架升级**: React和依赖包版本升级
- **构建工具**: Vite版本升级和配置优化
- **新技术集成**: 新技术栈的集成评估

---

*本文档详细描述了MultiWolf Live AI的完整架构设计，为开发和维护提供全面的技术参考。*