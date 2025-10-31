#!/bin/bash

echo "🌟 同时启动 Werewolf Arena 两个版本"
echo "=================================="

# 启动 v2.0 版本（后台）
echo "🚀 后台启动 v2.0 版本..."
./start_v2.sh &
V2_PID=$!

# 等待一段时间
sleep 10

# 启动 v1.0 版本（后台）
echo "🔄 后台启动 v1.0 版本..."
./start_v1.sh &
V1_PID=$!

echo ""
echo "🎉 两个版本均已启动！"
echo "=========================================="
echo "🎮 v2.0 现代前端: http://localhost:3000"
echo "🎮 v1.0 传统前端: http://localhost:8080/home.html"
echo "🔧 v2.0 API文档:  http://localhost:8001/docs"
echo "📊 健康检查: http://localhost:8001/health"
echo ""
echo "🛑 停止服务: Ctrl+C 或运行 ./scripts/stop_both.sh"
echo "=========================================="

# 创建停止脚本
cat > ../scripts/stop_both.sh << 'EOF'
#!/bin/bash
echo "🛑 停止所有 Werewolf Arena 服务..."

./stop_v2.sh
./stop_v1.sh

echo "✅ 所有服务已停止"
EOF

chmod +x ../scripts/stop_both.sh

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止所有服务..."; kill $V2_PID $V1_PID 2>/dev/null; ./stop_both.sh; echo "✅ 所有服务已停止"; exit 0' INT

# 持续监控服务状态
while true; do
    sleep 15
done