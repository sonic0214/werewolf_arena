#!/bin/bash
echo "🛑 停止狼人杀竞技场服务..."

# 停止后端服务
if lsof -i :8001 > /dev/null 2>&1; then
    echo "停止后端服务 (端口8001)..."
    lsof -ti :8001 | xargs kill -9
fi

# 停止前端服务
if lsof -i :8080 > /dev/null 2>&1; then
    echo "停止前端服务 (端口8080)..."
    lsof -ti :8080 | xargs kill -9
fi

echo "✅ 服务已停止"
