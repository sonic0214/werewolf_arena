#!/bin/bash

# Werewolf Arena fly.io部署脚本
# Deployment script for Werewolf Arena on fly.io

set -e

echo "🚀 开始部署 Werewolf Arena 到 fly.io..."

# 检查fly CLI是否安装
if ! command -v fly &> /dev/null; then
    echo "❌ fly CLI未安装，请先安装: https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

# 检查是否已登录
if ! fly auth whoami &> /dev/null; then
    echo "🔐 请先登录fly.io: fly auth login"
    fly auth login
fi

echo "📦 构建Docker镜像..."
fly docker build

echo "🚀 部署应用..."
fly deploy

echo "✅ 部署完成！"
echo "📋 查看应用状态: fly status"
echo "🌐 查看应用URL: fly apps open"

# 显示应用信息
echo ""
echo "📊 应用信息:"
fly status