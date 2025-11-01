# 🎮 Werewolf Arena Frontend

基于 Next.js 14 构建的现代化狼人杀游戏前端界面，提供实时游戏体验和直观的用户交互。

## 📋 项目概述

Werewolf Arena Frontend 是一个现代化的 React Web 应用，专为 AI 驱动的狼人杀游戏设计。应用采用最新的 Next.js 14 App Router 架构，提供流畅的用户体验和实时游戏状态同步。

## 🚀 核心特性

- 🎯 **现代化架构**: Next.js 14 + TypeScript + Tailwind CSS
- ⚡ **实时交互**: WebSocket 实时游戏状态同步
- 🎨 **响应式设计**: 移动端友好的用户界面
- 🔄 **状态管理**: Zustand 轻量级状态管理
- 🛠️ **组件化**: 可复用的 UI 组件库
- 📊 **游戏可视化**: 实时游戏进度和统计展示
- 🎮 **游戏直播**: 实时观看 AI 玩家对战
- 📝 **游戏日志**: 详细的推理过程记录

## 🏗️ 技术栈

### 核心框架
- **Next.js 14**: React 全栈框架，App Router 架构
- **TypeScript 5.3+**: 类型安全的 JavaScript
- **React 18**: 用户界面库，支持并发特性

### 样式和UI
- **Tailwind CSS 3.3+**: 实用优先的 CSS 框架
- **Lucide React**: 现代化图标库
- **Inter**: Google 字体，优秀的可读性

### 状态管理和数据
- **Zustand 4.4+**: 轻量级状态管理
- **Axios 1.6+**: HTTP 客户端
- **date-fns**: 现代化日期处理库

### 开发工具
- **ESLint**: 代码质量检查
- **PostCSS**: CSS 后处理器
- **Autoprefixer**: CSS 浏览器兼容

## 📁 项目结构

```
frontend/
├── src/                        # 源代码目录
│   ├── app/                    # Next.js App Router 页面
│   │   ├── layout.tsx         # 全局布局
│   │   ├── page.tsx           # 主页 - 游戏配置
│   │   ├── live/              # 游戏直播页面
│   │   │   └── [sessionId]/   # 动态路由 - 特定游戏
│   │   └── logs/              # 游戏日志页面
│   │       └── [sessionId]/   # 动态路由 - 游戏日志
│   ├── components/            # React 组件
│   │   ├── ui/                # 基础 UI 组件
│   │   │   ├── Button.tsx     # 按钮组件
│   │   │   ├── Card.tsx       # 卡片组件
│   │   │   ├── Input.tsx      # 输入框组件
│   │   │   ├── Select.tsx     # 下拉选择组件
│   │   │   └── Badge.tsx      # 标签组件
│   │   └── game/              # 游戏专用组件
│   │       ├── GameLog.tsx        # 游戏日志显示
│   │       ├── PlayerCard.tsx     # 玩家信息卡片
│   │       ├── GameStats.tsx      # 游戏统计信息
│   │       ├── LiveGameProgress.tsx # 实时游戏进度
│   │       ├── PlayerInteractions.tsx # 玩家交互界面
│   │       └── GameTimeline.tsx    # 游戏时间线
│   ├── lib/                   # 工具库和配置
│   │   ├── api/               # API 客户端
│   │   │   ├── client.ts      # HTTP 客户端配置
│   │   │   ├── games.ts       # 游戏相关 API
│   │   │   ├── models.ts      # 模型信息 API
│   │   │   └── websocket.ts   # WebSocket 客户端
│   │   ├── hooks/             # 自定义 Hooks
│   │   │   ├── useGame.ts     # 游戏状态管理
│   │   │   ├── useWebSocket.ts # WebSocket 连接
│   │   │   ├── useModels.ts   # 模型信息管理
│   │   │   └── usePerformanceOptimizations.ts # 性能优化
│   │   ├── store/             # Zustand 状态管理
│   │   │   ├── gameStore.ts   # 游戏状态 Store
│   │   │   └── uiStore.ts     # UI 状态 Store
│   │   └── utils.ts           # 通用工具函数
│   └── types/                 # TypeScript 类型定义
│       ├── api.ts             # API 响应类型
│       ├── game.ts            # 游戏数据类型
│       └── index.ts           # 通用类型导出
├── docs/                      # 📚 前端文档
│   ├── ARCHITECTURE.md        # 系统架构文档
│   └── COMPONENTS.md          # 组件功能文档
├── public/                    # 静态资源
│   └── favicon.ico           # 网站图标
├── .next/                    # Next.js 构建输出 (自动生成)
├── node_modules/             # 依赖包 (自动生成)
├── package.json              # 项目配置和依赖
├── next.config.js            # Next.js 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── tsconfig.json             # TypeScript 配置
├── postcss.config.js         # PostCSS 配置
├── .gitignore                # Git 忽略规则
└── README.md                 # 本文档
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn 包管理器

### 安装步骤

1. **安装依赖**
```bash
npm install
# 或
yarn install
```

2. **配置环境变量**
```bash
# 创建环境变量文件 (可选)
cp .env.example .env.local

# 编辑环境变量
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
- 🌐 **前端应用**: http://localhost:3000
- 📱 **移动端**: 响应式设计，支持移动设备

## 🎮 功能特性

### 游戏配置界面
- **模型选择**: 为村民和狼人选择不同的 AI 模型
- **参数设置**: 配置讨论时间、最大轮数等游戏参数
- **玩家命名**: 自定义玩家名称或使用随机名称
- **模型展示**: 显示可用模型的状态和信息

### 实时游戏直播
- **游戏状态**: 实时显示当前游戏阶段和进度
- **玩家信息**: 展示所有玩家的状态和角色信息
- **交互界面**: 投票、查验等游戏操作的界面
- **进度条**: 可视化展示游戏进展

### 游戏日志系统
- **实时日志**: 滚动显示最新的游戏事件
- **分类显示**: 不同类型的事件有不同的样式
- **时间戳**: 精确到秒的事件时间记录
- **自动滚动**: 新日志自动滚动到视图中

### 统计和可视化
- **存活统计**: 实时显示各角色存活数量
- **轮次进度**: 当前轮次和总体进度
- **投票分布**: 投票结果的图表展示
- **游戏时长**: 已进行时间的实时更新

## 🔧 开发指南

### 本地开发
```bash
# 开发模式启动
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 组件开发
- **命名规范**: PascalCase 组件名
- **文件结构**: 组件文件、样式、测试文件分离
- **Props 类型**: 完整的 TypeScript 接口定义
- **文档注释**: JSDoc 格式的组件文档

### 状态管理
- **Store 分片**: 按功能域分离状态 (game, ui)
- **选择器模式**: 使用选择器避免不必要的重渲染
- **异步操作**: 统一的异步操作处理模式
- **类型安全**: 完整的 TypeScript 类型覆盖

### 样式规范
- **Tailwind 优先**: 使用 Tailwind CSS 类名
- **响应式设计**: 移动端优先的设计理念
- **一致性**: 统一的颜色、间距、字体系统
- **主题支持**: 支持深色/浅色主题切换

## 🎨 组件库

### 基础组件
- **Button**: 多种样式和尺寸的按钮组件
- **Card**: 卡片容器组件，支持不同的内边距
- **Input**: 输入框组件，支持验证和错误状态
- **Select**: 下拉选择组件，支持搜索和多选
- **Badge**: 标签组件，用于状态指示

### 游戏组件
- **GameLog**: 实时游戏日志显示组件
- **PlayerCard**: 玩家信息展示卡片
- **GameStats**: 游戏统计信息展示
- **LiveGameProgress**: 实时游戏进度条
- **PlayerInteractions**: 玩家交互操作界面
- **GameTimeline**: 游戏事件时间轴

## 🔄 实时通信

### WebSocket 连接
- **自动连接**: 进入游戏页面自动建立连接
- **断线重连**: 网络中断自动重连机制
- **事件处理**: 类型安全的事件处理系统
- **连接状态**: 实时显示连接状态和质量

### 数据同步
- **游戏状态**: 实时同步游戏状态变化
- **玩家行动**: 即时显示玩家操作结果
- **投票结果**: 实时更新投票统计
- **阶段转换**: 平滑的游戏阶段过渡动画

## 📱 响应式设计

### 断点设置
- **手机**: < 768px
- **平板**: 768px - 1024px
- **桌面**: > 1024px

### 适配策略
- **移动端优先**: 基础样式针对移动设备设计
- **渐进增强**: 大屏幕设备添加更多功能和细节
- **触摸友好**: 按钮和交互元素适合触摸操作
- **性能优化**: 移动设备上的性能优化

## 🎯 性能优化

### 代码优化
- **代码分割**: 基于路由的自动代码分割
- **组件懒加载**: 大型组件按需加载
- **状态优化**: Zustand 选择器避免重渲染
- **事件优化**: 防抖节流处理用户输入

### 资源优化
- **图片优化**: Next.js Image 组件自动优化
- **字体优化**: Google Fonts 优化加载
- **CSS 优化**: Tailwind CSS 自动清除未使用样式
- **Bundle 优化**: Webpack 打包优化

### 运行时优化
- **React 18**: 并发特性提升性能
- **Memo 缓存**: 组件级别缓存优化
- **虚拟化**: 大列表虚拟滚动
- **预加载**: 关键资源预加载

## 🔍 调试和测试

### 开发工具
- **React DevTools**: React 组件调试
- **Redux DevTools**: Zustand 状态调试
- **Network**: API 请求监控
- **Console**: 详细的日志输出

### 错误处理
- **错误边界**: 组件错误捕获和恢复
- **网络错误**: API 调用失败的优雅处理
- **用户反馈**: 友好的错误提示信息
- **日志记录**: 开发环境的详细错误日志

## 📚 文档导航

- [📋 系统架构](docs/ARCHITECTURE.md) - 详细的前端架构说明
- [🎨 组件文档](docs/COMPONENTS.md) - 完整的组件库文档
- [🐳 部署指南](../DEPLOYMENT.md) - 生产环境部署方案
- [🚀 启动指南](../STARTUP_GUIDE.md) - 项目的完整启动说明

## 🚨 故障排除

### 常见问题

1. **端口占用**
```bash
# 查找占用3000端口的进程
lsof -i :3000

# 终止进程
kill -9 <PID>
```

2. **依赖安装失败**
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

3. **WebSocket 连接失败**
- 检查后端服务是否运行在 8000 端口
- 确认 WebSocket URL 配置正确
- 查看浏览器控制台错误信息

4. **样式不生效**
- 检查 Tailwind CSS 配置
- 确认 CSS 类名正确
- 查看浏览器开发者工具

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交代码更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 使用 ESLint 和 Prettier 格式化代码
- 遵循 TypeScript 严格模式
- 编写清晰的提交信息
- 添加必要的单元测试

## 📄 许可证

本项目基于 Apache 2.0 许可证开源。

---

**版本**: v2.0.0
**更新时间**: 2025-11-01
**维护状态**: ✅ 活跃维护中
**兼容性**: Next.js 14+, React 18+, Node.js 18+