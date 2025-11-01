# MultiWolf Live AI 部署指南

## 📋 概述

本文档提供 MultiWolf Live AI 项目的完整部署指南，包括开发环境搭建、生产环境部署和运维监控。

## 🚀 快速开始

### 环境要求

#### 系统要求
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 18.0+ (推荐使用 nvm 管理)
- **内存**: 最少 4GB RAM
- **存储**: 至少 2GB 可用空间

#### 开发工具
- **包管理器**: npm 9.0+ 或 yarn 1.22+
- **代码编辑器**: VS Code (推荐) + 相关插件
- **浏览器**: Chrome 90+ 或 Firefox 90+

### 安装步骤

#### 1. 克隆项目
```bash
git clone <your-repo-url>
cd multiwolf-live-ai-main
```

#### 2. 安装依赖
```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

#### 3. 启动开发服务器
```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

#### 4. 访问应用
打开浏览器访问: http://localhost:8080

---

## 🔧 开发环境配置

### 项目配置文件

#### Vite 配置 (`vite.config.ts`)
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080, // 开发服务器端口
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

#### Tailwind 配置 (`tailwind.config.ts`)
```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 自定义主题配置
    },
  },
  plugins: [],
} satisfies Config;
```

#### TypeScript 配置 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 环境变量配置

#### 开发环境变量 (.env.development)
```bash
# API 配置
VITE_API_BASE_URL=http://localhost:8080/api

# WebSocket 配置
VITE_WS_URL=ws://localhost:8080/ws

# 应用配置
VITE_APP_TITLE=MultiWolf Live AI
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

#### 生产环境变量 (.env.production)
```bash
# API 配置
VITE_API_BASE_URL=https://api.multiwolf.live
VITE_WS_URL=wss://api.multiwolf.live/ws

# 应用配置
VITE_APP_TITLE=MultiWolf Live AI
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true

# 分析工具
VITE_GA_ID=your-google-analytics-id
```

### 开发工具配置

#### ESLint 配置 (`eslint.config.js`)
```javascript
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  }
);
```

---

## 🏗️ 构建和部署

### 构建流程

#### 开发构建
```bash
# 开发模式构建
npm run build:dev

# 预览开发构建
npm run preview
```

#### 生产构建
```bash
# 生产模式构建
npm run build

# 预览生产构建
npm run preview
```

### 构建优化

#### Bundle 分析
```bash
# 安装分析工具
npm install --save-dev rollup-plugin-visualizer

# 在 vite.config.ts 中添加
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
    }),
  ],
});
```

#### 代码分割优化
```typescript
// 路由级别的代码分割
import { lazy, Suspense } from "react";

const Livestream = lazy(() => import("./pages/Livestream"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/livestream" element={<Livestream />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 🚀 部署平台

### 1. Vercel 部署

#### 自动部署配置
1. **连接 GitHub 仓库**
   - 登录 Vercel 控制台
   - 点击 "New Project"
   - 导入 GitHub 仓库

2. **配置项目设置**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install",
     "devCommand": "npm run dev"
   }
   ```

3. **环境变量配置**
   - 在 Vercel 控制台设置环境变量
   - 配置生产和开发环境变量

4. **域名配置**
   - 使用 Vercel 提供的域名
   - 或配置自定义域名

#### 手动部署
```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署到 Vercel
vercel --prod
```

### 2. Netlify 部署

#### 静态站点部署
```bash
# 构建项目
npm run build

# 部署到 Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### 配置文件 (`netlify.toml`)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Docker 部署

#### Dockerfile
```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    restart: unless-stopped
```

#### 构建和运行
```bash
# 构建镜像
docker build -t multiwolf-live-ai .

# 运行容器
docker run -p 80:80 multiwolf-live-ai

# 使用 Docker Compose
docker-compose up -d
```

### 4. 传统服务器部署

#### 服务器要求
- **系统**: Ubuntu 20.04+ / CentOS 8+
- **Web服务器**: Nginx 1.18+ 或 Apache 2.4+
- **Node.js**: 18.0+
- **反向代理**: Nginx 或 Apache

#### Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/multiwolf-live-ai/dist;
    index index.html;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理 (如果有后端API)
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 代理 (如果有WebSocket)
    location /ws/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔍 测试和验证

### 本地测试
```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint

# 运行构建测试
npm run build

# 运行预览
npm run preview
```

### 性能测试
```bash
# 安装 Lighthouse
npm install -g lighthouse

# 运行性能测试
lighthouse http://localhost:8080 --output html --output-path ./lighthouse-report
```

### 兼容性测试
- **浏览器测试**: Chrome, Firefox, Safari, Edge
- **设备测试**: 桌面端、平板、手机
- **分辨率测试**: 1920x1080, 1366x768, 375x667

---

## 📊 监控和日志

### 性能监控

#### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

#### 监控工具集成
```typescript
// Google Analytics 4
import { GoogleAnalytics } from "@next/third-parties/google";

const GA_TRACKING_ID = process.env.VITE_GA_ID;

<GoogleAnalytics gaId={GA_TRACKING_ID} />

// Sentry 错误监控
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### 错误监控

#### 错误边界
```typescript
import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // 发送错误到监控服务
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">出现错误</h1>
            <p className="text-gray-600 mb-4">
              应用遇到了一个错误，请刷新页面重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🔧 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 重新构建
npm run build
```

#### 2. 端口占用
```bash
# 查找占用端口的进程
lsof -i :8080

# 终止进程
kill -9 <PID>

# 或修改 vite.config.ts 中的端口
```

#### 3. 依赖冲突
```bash
# 检查依赖冲突
npm ls

# 更新依赖
npm update

# 或使用 yarn
yarn upgrade
```

#### 4. 样式问题
```bash
# 检查 Tailwind CSS 配置
npx tailwindcss --help

# 重新生成样式
npm run build
```

#### 5. 路由问题
```bash
# 检查 React Router 配置
# 确认路由组件正确导入
# 检查路由匹配规则
```

### 调试技巧

#### 开发工具
- **React DevTools**: 组件状态调试
- **Redux DevTools**: 状态管理调试 (如果使用)
- **浏览器开发者工具**: 网络和样式调试
- **Vite 开发服务器**: 热重载和错误提示

#### 日志调试
```typescript
// 开发环境日志
if (import.meta.env.DEV) {
  console.log("Debug info:", data);
}

// 错误日志
console.error("Error:", error);

// 警告日志
console.warn("Warning:", warning);
```

---

## 🚀 CI/CD 配置

### GitHub Actions

#### 工作流配置 (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run type check
      run: npm run type-check

    - name: Run linting
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📱 移动端优化

### 响应式配置
```css
/* Tailwind CSS 断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

### 移动端优化
- **触摸友好**: 按钮和交互元素适合触摸
- **视口配置**: 正确的 viewport meta 标签
- **性能优化**: 图片懒加载和压缩
- **离线支持**: PWA 功能 (可选)

### PWA 配置 (可选)
```json
// public/manifest.json
{
  "name": "MultiWolf Live AI",
  "short_name": "MultiWolf",
  "description": "AI狼人杀游戏直播平台",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

*本文档提供了 MultiWolf Live AI 项目的完整部署指南，涵盖了从开发环境搭建到生产环境部署的所有方面。*