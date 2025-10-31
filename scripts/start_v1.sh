#!/bin/bash

echo "🔄 启动 Werewolf Arena v1.0 - 传统版本"
echo "======================================"

# 检查当前目录
if [ ! -f "home.html" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "❌ 错误：未找到虚拟环境，正在创建..."
    python3 -m venv venv
fi

echo "✅ 环境检查通过"

# 启动传统后端
echo "🖥️  启动传统 Python 后端服务..."
source venv/bin/activate

# 检查端口是否被占用
if lsof -i :8001 > /dev/null 2>&1; then
    echo "⚠️  端口8001已被占用，正在尝试关闭占用进程..."
    lsof -ti :8001 | xargs kill -9
    sleep 2
fi

# 启动传统后端（使用原始方式）
python3 main.py --run --v_models=glm4 --w_models=gpt4 > backend_v1.log 2>&1 &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查端口是否被占用
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  端口8080已被占用，正在尝试关闭占用进程..."
    lsof -ti :8080 | xargs kill -9
    sleep 2
fi

# 启动传统前端
echo "🌐 启动传统 HTML 前端服务..."
python3 -m http.server 8080 > frontend_v1.log 2>&1 &
FRONTEND_PID=$!

sleep 2

# 检查前端是否启动成功
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ 传统前端服务启动成功 (PID: $FRONTEND_PID)"
else
    echo "❌ 前端服务启动失败，请检查日志: tail -f frontend_v1.log"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 v1.0 服务启动完成！"
echo "=========================================="
echo "🎮 游戏主页: http://localhost:8080/home.html"
echo "📺 直播页面: http://localhost:8080/index.html"
echo ""
echo "📝 日志文件:"
echo "   后端日志: tail -f backend_v1.log"
echo "   前端日志: tail -f frontend_v1.log"
echo ""
echo "🛑 停止服务: Ctrl+C 或运行 ./scripts/stop_v1.sh"
echo "=========================================="

# 创建停止脚本
cat > ../scripts/stop_v1.sh << 'EOF'
#!/bin/bash
echo "🛑 停止 Werewolf Arena v1.0 服务..."

# 停止后端服务
if lsof -i :8001 > /dev/null 2>&1; then
    echo "停止传统后端服务 (端口8001)..."
    lsof -ti :8001 | xargs kill -9
fi

# 停止前端服务
if lsof -i :8080 > /dev/null 2>&1; then
    echo "停止传统前端服务 (端口8080)..."
    lsof -ti :8080 | xargs kill -9
fi

echo "✅ v1.0 服务已停止"
EOF

chmod +x ../scripts/stop_v1.sh

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 持续监控服务状态
while true; do
    if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "❌ 前端服务异常，请检查日志"
        tail -10 frontend_v1.log
    fi
    sleep 10
done