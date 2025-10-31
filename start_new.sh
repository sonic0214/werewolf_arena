#!/bin/bash

echo "🐺 启动狼人杀竞技场 - Werewolf Arena v2.0"
echo "=========================================="

# 显示启动选项
echo "请选择要启动的版本："
echo "1) v2.0版本 - Next.js前端 + FastAPI后端 (推荐)"
echo "2) v1.0版本 - 传统HTML + Python后端 (兼容)"
echo "3) 同时启动两个版本"
echo ""
read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo "🚀 启动 v2.0版本..."
        ./scripts/start_v2.sh
        ;;
    2)
        echo "🔄 启动 v1.0版本..."
        ./scripts/start_v1.sh
        ;;
    3)
        echo "🌟 同时启动两个版本..."
        ./scripts/start_both.sh
        ;;
    *)
        echo "❌ 无效选择，默认启动 v2.0版本"
        ./scripts/start_v2.sh
        ;;
esac