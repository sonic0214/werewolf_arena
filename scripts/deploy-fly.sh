#!/bin/bash

# Werewolf Arena fly.io部署脚本
# Deployment script for Werewolf Arena on fly.io

set -e

echo "🚀 开始部署 Werewolf Arena 到 fly.io..."

# 检查当前目录
echo "📍 当前目录: $(pwd)"
echo "📁 目录内容:"
ls -la

# 检查必要文件
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile 不存在"
    exit 1
fi

if [ ! -f "fly.toml" ]; then
    echo "❌ fly.toml 不存在"
    exit 1
fi

echo "✅ 必要文件检查通过"

# 检查fly CLI是否安装
if ! command -v fly &> /dev/null; then
    echo "❌ fly CLI未安装，请先安装:"
    echo "   macOS: brew install flyctl"
    echo "   或: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo "✅ fly CLI 已安装"

# 检查是否已登录
if ! fly auth whoami &> /dev/null; then
    echo "🔐 请先登录fly.io:"
    fly auth login
fi

echo "✅ 已登录 fly.io"

# 部署前检查
echo "🔍 部署前检查..."
fly doctor || echo "⚠️  fly doctor 报告了一些问题，但继续部署"

echo "📦 开始部署应用..."
fly deploy --verbose

echo "✅ 部署完成！"
echo ""
echo "📋 后续命令:"
echo "   查看应用状态: fly status"
echo "   查看应用URL: fly apps open"
echo "   查看日志: fly logs"

# 显示应用信息
echo ""
echo "📊 应用信息:"
fly status || echo "⚠️  无法获取应用状态"