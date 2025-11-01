#!/bin/bash

echo "🌟 启动 Werewolf Arena v2.0 - 现代版本"
echo "======================================"

# 检查当前目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "❌ 错误：未找到虚拟环境，正在创建..."
    python3 -m venv venv
fi

echo "✅ 环境检查通过"

# 启动后端
echo "🖥️  启动 FastAPI 后端服务..."
cd backend

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，正在复制模板..."
    cp .env.example .env
    echo "请编辑 backend/.env 文件，填入您的API密钥"
fi

source ../venv/bin/activate

# 检查端口是否被占用
if lsof -i :8000 > /dev/null 2>&1; then
    echo "⚠️  端口8000已被占用，正在尝试关闭占用进程..."
    lsof -ti :8000 | xargs kill -9
    sleep 2
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
pip install -q -r requirements.txt

# 启动后端服务
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000 > ../backend_v2.log 2>&1 &
BACKEND_PID=$!

cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端是否启动成功
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ FastAPI 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败，请检查日志: tail -f backend_v2.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端
echo "🌐 启动 Next.js 前端服务..."
cd frontend

# 检查端口是否被占用
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  端口3000已被占用，正在尝试关闭占用进程..."
    lsof -ti :3000 | xargs kill -9
    sleep 2
fi

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端服务
npm run dev > ../frontend_v2.log 2>&1 &
FRONTEND_PID=$!

cd ..

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 8

# 检查前端是否启动成功
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js 前端服务启动成功 (PID: $FRONTEND_PID)"
else
    echo "❌ 前端服务启动失败，请检查日志: tail -f frontend_v2.log"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 v2.0 服务启动完成！"
echo "=========================================="
echo "🎮 现代前端: http://localhost:3000"
echo "🔧 后端API:  http://localhost:8000/docs"
echo "📊 API健康检查: http://localhost:8000/health"
echo ""
echo "📝 日志文件:"
echo "   后端日志: tail -f backend_v2.log"
echo "   前端日志: tail -f frontend_v2.log"
echo ""
echo "🛑 停止服务: Ctrl+C 或运行 ./scripts/stop_v2.sh"
echo "=========================================="

# 创建停止脚本
cat > ../scripts/stop_v2.sh << 'EOF'
#!/bin/bash
echo "🛑 停止 Werewolf Arena v2.0 服务..."

# 停止后端服务
if lsof -i :8000 > /dev/null 2>&1; then
    echo "停止 FastAPI 后端服务 (端口8000)..."
    lsof -ti :8000 | xargs kill -9
fi

# 停止前端服务
if lsof -i :3000 > /dev/null 2>&1; then
    echo "停止 Next.js 前端服务 (端口3000)..."
    lsof -ti :3000 | xargs kill -9
fi

echo "✅ v2.0 服务已停止"
EOF

chmod +x ../scripts/stop_v2.sh

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 持续监控服务状态
while true; do
    if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "❌ 后端服务异常，请检查日志"
        tail -10 backend_v2.log
    fi
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "❌ 前端服务异常，请检查日志"
        tail -10 frontend_v2.log
    fi
    sleep 10
done