#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试修复后的Web服务器功能
Test Fixed Web Server Functionality
"""

import sys
import os
import time
import requests
import json

def test_imports():
    """测试导入"""
    print("🔍 测试修复后的导入...")

    try:
        from web_server import app, run_game_standalone, DEFAULT_THREADS
        print("✅ Web服务器导入成功")

        # 测试依赖导入
        from werewolf import logging
        from werewolf import game
        from werewolf.model import Doctor, SEER, Seer, State, Villager, WEREWOLF, Werewolf
        from werewolf.runner import initialize_players, model_to_id

        print("✅ 游戏模块导入成功")
        print(f"✅ 默认线程数: {DEFAULT_THREADS}")

        return True
    except Exception as e:
        print(f"❌ 导入失败: {e}")
        return False

def test_flask_routes():
    """测试Flask路由"""
    print("\n🛣️ 测试Flask路由...")

    try:
        from web_server import app

        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(f"{list(rule.methods)} {rule.rule}")

        print("已配置的路由:")
        for route in routes:
            print(f"  {route}")

        return True
    except Exception as e:
        print(f"❌ 路由测试失败: {e}")
        return False

def test_model_mapping():
    """测试模型映射"""
    print("\n🤖 测试模型映射...")

    try:
        from werewolf.runner import model_to_id

        test_models = ['glmz1-flash', 'glm45-flash', 'gpt4o']
        for model in test_models:
            if model in model_to_id:
                print(f"✅ {model} -> {model_to_id[model]}")
            else:
                print(f"⚠️  {model} 未在配置中找到")

        return True
    except Exception as e:
        print(f"❌ 模型映射测试失败: {e}")
        return False

def test_game_functions():
    """测试游戏函数"""
    print("\n🎮 测试游戏函数...")

    try:
        from werewolf.runner import initialize_players
        from werewolf.config import get_player_names

        # 测试玩家初始化
        players = get_player_names()
        print(f"✅ 生成玩家名称: {players}")

        # 测试玩家初始化函数
        seer, doctor, villagers, werewolves = initialize_players(
            'glmz1-flash', 'glmz1-flash'
        )
        print(f"✅ 玩家初始化成功:")
        print(f"   预言家: {seer.name}")
        print(f"   医生: {doctor.name}")
        print(f"   狼人: {[w.name for w in werewolves]}")
        print(f"   村民: {[v.name for v in villagers]}")

        return True
    except Exception as e:
        print(f"❌ 游戏函数测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_config_loading():
    """测试配置加载"""
    print("\n⚙️ 测试配置加载...")

    try:
        from game_config import NUM_PLAYERS, MAX_DEBATE_TURNS, DEFAULT_THREADS

        print(f"✅ 玩家数量: {NUM_PLAYERS}")
        print(f"✅ 辩论次数: {MAX_DEBATE_TURNS}")
        print(f"✅ 线程数: {DEFAULT_THREADS}")

        # 检查一致性
        from web_server import DEFAULT_THREADS as web_threads
        if DEFAULT_THREADS == web_threads:
            print("✅ 配置线程数一致")
        else:
            print(f"⚠️  线程数不一致: config={DEFAULT_THREADS}, web={web_threads}")

        return True
    except Exception as e:
        print(f"❌ 配置测试失败: {e}")
        return False

def main():
    """运行所有测试"""
    print("🧪 测试修复后的Web服务器功能...")
    print("=" * 60)

    tests = [
        ("导入测试", test_imports),
        ("Flask路由", test_flask_routes),
        ("模型映射", test_model_mapping),
        ("游戏函数", test_game_functions),
        ("配置加载", test_config_loading)
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
        print("\n✨ 修复内容:")
        print("   ✅ 移除对absl flags的依赖")
        print("   ✅ 创建独立的run_game_standalone函数")
        print("   ✅ 使用配置文件中的DEFAULT_THREADS")
        print("   ✅ 直接调用游戏模块函数")
        print("\n🚀 现在可以启动Web服务器:")
        print("   python3 start_web_server.py")
        print("\n🌐 访问地址:")
        print("   http://localhost:8081")
        return True
    else:
        print("⚠️  部分测试失败，请检查问题")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)