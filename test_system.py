#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
狼人杀竞技场系统测试脚本
Werewolf Arena System Test
"""

import sys
import os
import subprocess
import time
import requests
import json

def test_dependencies():
    """测试依赖是否完整"""
    print("🔍 检查依赖...")

    try:
        import flask
        import flask_cors
        print("✅ Flask 依赖已安装")
    except ImportError as e:
        print(f"❌ Flask 依赖缺失: {e}")
        return False

    # 检查必要文件
    required_files = [
        'home.html',
        'index.html',
        'web_server.py',
        'main.py',
        'static/index_live.js',
        'game_config.py'
    ]

    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)

    if missing_files:
        print(f"❌ 缺少必要文件: {', '.join(missing_files)}")
        return False

    print("✅ 所有文件存在")
    return True

def test_config():
    """测试配置文件"""
    print("\n🔧 测试配置...")

    try:
        sys.path.append('.')
        import game_config

        print(f"✅ 玩家数量: {game_config.NUM_PLAYERS}")
        print(f"✅ 辩论次数: {game_config.MAX_DEBATE_TURNS}")
        print(f"✅ 线程数: {game_config.DEFAULT_THREADS}")
        print(f"✅ 刷新间隔: {game_config.FRONTEND_REFRESH_INTERVAL}ms")

        return True
    except Exception as e:
        print(f"❌ 配置文件错误: {e}")
        return False

def test_web_server():
    """测试Web服务器"""
    print("\n🌐 测试Web服务器...")

    # 尝试启动Web服务器
    try:
        import web_server
        print("✅ Web服务器模块加载成功")
        return True
    except Exception as e:
        print(f"❌ Web服务器加载失败: {e}")
        return False

def test_model_config():
    """测试模型配置"""
    print("\n🤖 测试模型配置...")

    try:
        from werewolf.runner import model_to_id

        # 测试默认模型
        default_models = ['glmz1-flash', 'glm45-flash', 'gpt4o']
        for model in default_models:
            if model in model_to_id:
                print(f"✅ 模型 {model} -> {model_to_id[model]}")
            else:
                print(f"⚠️  模型 {model} 未在配置中找到")

        return True
    except Exception as e:
        print(f"❌ 模型配置测试失败: {e}")
        return False

def run_quick_test():
    """运行快速测试"""
    print("🚀 运行系统测试...")
    print("=" * 50)

    tests = [
        ("依赖检查", test_dependencies),
        ("配置测试", test_config),
        ("Web服务器", test_web_server),
        ("模型配置", test_model_config)
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n📋 {test_name}:")
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} 测试异常: {e}")

    print("\n" + "=" * 50)
    print(f"📊 测试结果: {passed}/{total} 通过")

    if passed == total:
        print("🎉 所有测试通过！系统可以正常启动")
        print("\n🎮 启动命令:")
        print("   python3 start_web_server.py")
        print("\n🌐 访问地址:")
        print("   http://localhost:8081")
        return True
    else:
        print("⚠️  部分测试失败，请检查问题后重试")
        return False

if __name__ == '__main__':
    success = run_quick_test()
    sys.exit(0 if success else 1)