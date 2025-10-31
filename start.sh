#!/bin/bash

echo "🐺 启动狼人杀竞技场 - Werewolf Arena"
echo "=========================================="

# 检查当前目录
if [ ! -f "home.html" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "❌ 错误：未找到虚拟环境，请先创建虚拟环境"
    echo "运行: python3 -m venv venv"
    exit 1
fi

# 检查后端目录
if [ ! -d "backend" ]; then
    echo "❌ 错误：未找到backend目录"
    exit 1
fi

echo "✅ 环境检查通过"

# 启动后端
echo "🖥️  启动后端服务..."
cd backend
source ../venv/bin/activate

# 检查端口是否被占用
if lsof -i :8001 > /dev/null 2>&1; then
    echo "⚠️  端口8001已被占用，正在尝试关闭占用进程..."
    lsof -ti :8001 | xargs kill -9
    sleep 2
fi

python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8001 > ../backend.log 2>&1 &
BACKEND_PID=$!

cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败，请检查日志: tail -f backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 检查前端端口
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  端口8080已被占用，正在尝试关闭占用进程..."
    lsof -ti :8080 | xargs kill -9
    sleep 2
fi

# 启动前端
echo "🌐 启动前端服务..."
python3 -m http.server 8080 > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

# 检查前端是否启动成功
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ 前端服务启动成功 (PID: $FRONTEND_PID)"
else
    echo "❌ 前端服务启动失败，请检查日志: tail -f frontend.log"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 服务启动完成！"
echo "=========================================="
echo "📱 前端地址: http://localhost:8080/home.html"
echo "🔧 后端API:  http://localhost:8001/docs"
echo "📊 API健康检查: http://localhost:8001/health"
echo ""
echo "📝 日志文件:"
echo "   后端日志: tail -f backend.log"
echo "   前端日志: tail -f frontend.log"
echo ""
echo "🛑 停止服务: Ctrl+C 或运行 ./stop.sh"
echo "=========================================="

# 创建停止脚本
cat > stop.sh << 'EOF'
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
EOF

chmod +x stop.sh

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 持续监控服务状态
while true; do
    if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo "❌ 后端服务异常，请检查日志"
        tail -10 backend.log
    fi
    if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "❌ 前端服务异常，请检查日志"
        tail -10 frontend.log
    fi
    sleep 10
done