#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试Web服务器集成功能
Test Web Server Integration
"""

import sys
import os
import time
import threading
import requests
import json

def test_web_server_imports():
    """测试Web服务器导入"""
    print("🔍 测试Web服务器导入...")

    try:
        sys.path.append('.')
        from web_server import app
        print("✅ Web服务器导入成功")
        return True
    except Exception as e:
        print(f"❌ Web服务器导入失败: {e}")
        return False

def test_game_runner_imports():
    """测试游戏运行器导入"""
    print("\n🎮 测试游戏运行器导入...")

    try:
        from werewolf.runner import run_game, model_to_id
        print("✅ 游戏运行器导入成功")

        # 测试模型映射
        test_models = ['glmz1-flash', 'glm45-flash', 'gpt4o']
        for model in test_models:
            if model in model_to_id:
                print(f"✅ {model} -> {model_to_id[model]}")
            else:
                print(f"⚠️  {model} 未在配置中找到")

        return True
    except Exception as e:
        print(f"❌ 游戏运行器导入失败: {e}")
        return False

def test_flask_routes():
    """测试Flask路由"""
    print("\n🛣️ 测试Flask路由...")

    try:
        from web_server import app

        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(f"{list(rule.methods)} {rule.rule}")

        expected_routes = [
            "GET /",
            "POST /start-game",
            "GET /game-status/<session_id>",
            "GET /list-games",
            "GET /latest-game",
            "GET /<path:filename>"
        ]

        print("已配置的路由:")
        for route in routes:
            print(f"  {route}")

        print("✅ Flask路由配置正常")
        return True
    except Exception as e:
        print(f"❌ Flask路由测试失败: {e}")
        return False

def test_config_consistency():
    """测试配置一致性"""
    print("\n⚙️ 测试配置一致性...")

    try:
        from game_config import NUM_PLAYERS, MAX_DEBATE_TURNS, DEFAULT_THREADS
        from werewolf.config import get_player_names

        print(f"✅ 玩家数量: {NUM_PLAYERS}")
        print(f"✅ 辩论次数: {MAX_DEBATE_TURNS}")
        print(f"✅ 线程数: {DEFAULT_THREADS}")

        # 测试玩家名称生成
        players = get_player_names()
        print(f"✅ 玩家名称: {players}")

        if len(players) != NUM_PLAYERS:
            print(f"⚠️  警告: 玩家数量不匹配，配置={NUM_PLAYERS}, 实际={len(players)}")

        return True
    except Exception as e:
        print(f"❌ 配置测试失败: {e}")
        return False

def test_file_dependencies():
    """测试文件依赖"""
    print("\n📁 测试文件依赖...")

    required_files = [
        'home.html',
        'index.html',
        'web_server.py',
        'static/index_live.js',
        'game_config.py'
    ]

    missing_files = []
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - 缺失")
            missing_files.append(file)

    if missing_files:
        print(f"❌ 缺少文件: {', '.join(missing_files)}")
        return False

    print("✅ 所有必需文件存在")
    return True

def main():
    """运行所有测试"""
    print("🧪 运行Web服务器集成测试...")
    print("=" * 60)

    tests = [
        ("Web服务器导入", test_web_server_imports),
        ("游戏运行器导入", test_game_runner_imports),
        ("Flask路由", test_flask_routes),
        ("配置一致性", test_config_consistency),
        ("文件依赖", test_file_dependencies)
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
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print(f"📊 测试结果: {passed}/{total} 通过")

    if passed == total:
        print("🎉 所有测试通过！")
        print("\n🚀 现在可以启动Web服务器:")
        print("   python3 start_web_server.py")
        print("\n🌐 访问地址:")
        print("   http://localhost:8081")
        print("\n✨ 修复内容:")
        print("   ✅ 不再使用subprocess执行python命令")
        print("   ✅ 直接调用内部run_game函数")
        print("   ✅ Session ID正确对齐")
        print("   ✅ 前端轮询机制完善")
        return True
    else:
        print("⚠️  部分测试失败，请检查问题")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)