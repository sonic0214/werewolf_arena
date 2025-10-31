#!/bin/bash
# 开发环境启动脚本

cd "$(dirname "$0")"

echo "🐺 Starting Werewolf Arena Backend (Development Mode)"
echo "=" | tr '=' '=' | head -c 50; echo

# 检查虚拟环境
if [ ! -d "../venv" ]; then
    echo "❌ Virtual environment not found"
    echo "Creating virtual environment..."
    python3 -m venv ../venv
fi

# 激活虚拟环境
source ../venv/bin/activate

# 安装依赖
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# 设置Python路径
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# 启动服务
echo "🚀 Starting API server..."
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
