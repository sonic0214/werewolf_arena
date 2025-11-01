#!/bin/bash

# 测试 fly.io 部署配置
echo "🧪 测试 fly.io 部署配置..."

# 检查文件
echo "📁 检查必要文件:"
files=("Dockerfile" "fly.toml" ".env.example")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
    fi
done

# 检查 Dockerfile 语法
echo ""
echo "🔍 检查 Dockerfile 语法:"
if command -v docker &> /dev/null; then
    echo "🐳 本地 Docker 构建测试..."
    if docker build -t werewolf-test .; then
        echo "✅ Dockerfile 构建成功"
        # 清理测试镜像
        docker rmi werewolf-test &> /dev/null
    else
        echo "❌ Dockerfile 构建失败"
    fi
else
    echo "⚠️  Docker 未安装，跳过构建测试"
fi

# 检查 fly.toml 语法
echo ""
echo "🔍 检查 fly.toml 语法:"
if command -v fly &> /dev/null; then
    if fly validate; then
        echo "✅ fly.toml 语法正确"
    else
        echo "❌ fly.toml 语法错误"
    fi
else
    echo "⚠️  fly CLI 未安装，跳过语法检查"
fi

echo ""
echo "📋 部署建议:"
echo "1. 如果标准配置失败，尝试使用简化版配置:"
echo "   cp fly-simple.toml fly.toml"
echo "   cp Dockerfile.simple Dockerfile"
echo ""
echo "2. 或者手动启动应用:"
echo "   fly launch --no-deploy"
echo "   fly deploy"