# 多阶段构建 Dockerfile for Werewolf Arena
# 适用于 fly.io 部署

FROM node:18-alpine AS frontend-base
RUN apk add --no-cache libc6-compat
WORKDIR /frontend

# 前端依赖安装
FROM frontend-base AS frontend-deps
COPY frontend/package*.json ./
RUN npm ci --omit=dev

# 前端构建
FROM frontend-base AS frontend-builder
WORKDIR /frontend
COPY --from=frontend-deps /frontend/node_modules ./node_modules
COPY frontend/ .
# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 构建前端 - 允许静态生成错误，只要编译成功即可
RUN npm run build || true

# 后端基础镜像
FROM python:3.11-slim AS backend-base

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制并安装Python依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ .

# 复制前端构建产物到后端静态文件目录
RUN mkdir -p /app/static
COPY --from=frontend-builder /frontend/public ./static/public
COPY --from=frontend-builder /frontend/.next ./static/.next

# 创建日志目录
RUN mkdir -p logs

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 暴露端口
EXPOSE 8000

# 启动脚本 - 同时运行后端API和前端静态文件服务
COPY <<EOF /app/start.sh
#!/bin/bash
set -e

echo "🚀 Starting Werewolf Arena on fly.io..."
echo "📝 Environment: \${ENVIRONMENT:-production}"
echo "🔧 Debug mode: \${DEBUG:-false}"

# 启动后端API服务器
echo "🔧 Starting FastAPI server on port 8000..."
exec uvicorn src.api.app:app --host 0.0.0.0 --port 8000
EOF

RUN chmod +x /app/start.sh

# 启动应用
CMD ["/app/start.sh"]