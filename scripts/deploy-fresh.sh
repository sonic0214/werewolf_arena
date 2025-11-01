#!/bin/bash

# 全新部署 Werewolf Arena 到 fly.io
set -e

echo "🚀 全新部署 Werewolf Arena 到 fly.io..."

# 检查当前目录
echo "📍 当前目录: $(pwd)"
echo "📁 根目录文件:"
ls -la | grep -E "(Dockerfile|fly\.toml|\.env)"

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

# 检查 fly CLI
if ! command -v fly &> /dev/null; then
    echo "❌ 请先安装 fly CLI:"
    echo "   brew install flyctl"
    echo "   或: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# 检查登录状态
if ! fly auth whoami &> /dev/null; then
    echo "🔐 请先登录 fly.io:"
    fly auth login
fi

echo "✅ 已登录 fly.io"

# 清理任何现有应用
echo "🧹 检查现有应用..."
existing_app=$(fly apps list 2>/dev/null | grep "werewolf-arena" | awk '{print $1}' || echo "")
if [ ! -z "$existing_app" ]; then
    echo "🗑️  删除现有应用: $existing_app"
    fly apps destroy $existing_app -y || true
fi

# 创建新应用
echo "🆕 创建新应用..."
fly launch --no-deploy --copy-config --name werewolf-arena

# 设置环境变量
echo "⚙️  设置环境变量..."
fly secrets set ENVIRONMENT=production || true
fly secrets set DEBUG=false || true
fly secrets set NODE_ENV=production || true

# 如果有 .env 文件，提示用户设置密钥
if [ -f ".env" ]; then
    echo "📝 发现 .env 文件，请手动设置以下密钥:"
    grep -E "^[A-Z_]+_API_KEY=" .env | sed 's/^/fly secrets set /' | sed 's/=/=/' | sed 's/$/ || echo "跳过设置该密钥"/'
    echo "💡 或者跳过密钥设置，稍后通过控制台设置"
fi

# 部署应用
echo "🚀 开始部署..."
echo "这可能需要几分钟时间..."
fly deploy

# 等待部署完成
echo "⏳ 等待应用启动..."
sleep 10

# 显示应用状态
echo "✅ 部署完成！"
echo ""
echo "📋 应用信息:"
fly status || echo "应用还在启动中..."

echo ""
echo "🌐 访问应用:"
fly apps open || echo "应用还在启动中，稍后访问: fly apps open"

echo ""
echo "🔧 有用的命令:"
echo "   查看状态: fly status"
echo "   查看日志: fly logs"
echo "   打开应用: fly apps open"
echo "   设置密钥: fly secrets set KEY=VALUE"