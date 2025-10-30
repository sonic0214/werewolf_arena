#!/usr/bin/env python3
"""
测试游戏终止和重启功能的集成测试脚本
"""

import requests
import json
import time
import threading
import sys

def test_web_server_endpoints():
    """测试Web服务器端点是否正常工作"""
    print("🧪 测试Web服务器端点...")

    base_url = "http://localhost:8081"

    # 测试端点列表
    endpoints = [
        "/",
        "/api-status",
        "/list-games"
    ]

    results = {}
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                results[endpoint] = "✅ 正常"
            else:
                results[endpoint] = f"❌ 状态码: {response.status_code}"
        except requests.exceptions.RequestException as e:
            results[endpoint] = f"❌ 错误: {str(e)}"

    for endpoint, result in results.items():
        print(f"  {endpoint}: {result}")

    return all("✅" in result for result in results.values())

def test_game_termination_api():
    """测试游戏终止API"""
    print("\n🧪 测试游戏终止API...")

    base_url = "http://localhost:8081"

    # 首先获取游戏列表
    try:
        response = requests.get(f"{base_url}/list-games", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('games'):
                # 找一个正在运行的游戏进行测试
                running_games = [g for g in data['games'] if g['status'] in ['running', 'initializing']]
                if running_games:
                    test_game = running_games[0]
                    session_id = test_game['session_id']
                    print(f"  找到测试游戏: {session_id}")

                    # 测试停止API
                    stop_response = requests.post(f"{base_url}/stop-game/{session_id}", timeout=5)
                    if stop_response.status_code == 200:
                        result = stop_response.json()
                        if result.get('success'):
                            print(f"  ✅ 成功发送停止请求到游戏 {session_id}")
                            return True
                        else:
                            print(f"  ❌ 停止请求失败: {result.get('error', '未知错误')}")
                            return False
                    else:
                        print(f"  ❌ 停止API返回错误状态码: {stop_response.status_code}")
                        return False
                else:
                    print("  ⚠️  没有找到正在运行的游戏，跳过终止测试")
                    return True
            else:
                print("  ⚠️  没有游戏记录，跳过终止测试")
                return True
        else:
            print(f"  ❌ 获取游戏列表失败: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  ❌ 请求错误: {str(e)}")
        return False

def test_frontend_files():
    """测试前端文件是否包含必要的功能"""
    print("\n🧪 测试前端文件...")

    files_to_check = {
        'index.html': ['stop-game-btn', 'restart-game-btn', 'game-controls'],
        'home.html': ['game-management', 'refreshGamesList', 'stopGameFromList'],
        'static/index_live.js': ['stopGame', 'restartGame', 'updateGameControls']
    }

    all_good = True
    for file_path, required_elements in files_to_check.items():
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            missing_elements = []
            for element in required_elements:
                if element not in content:
                    missing_elements.append(element)

            if missing_elements:
                print(f"  ❌ {file_path} 缺少: {', '.join(missing_elements)}")
                all_good = False
            else:
                print(f"  ✅ {file_path} 包含所有必要元素")

        except FileNotFoundError:
            print(f"  ❌ {file_path} 文件不存在")
            all_good = False
        except Exception as e:
            print(f"  ❌ 读取 {file_path} 时出错: {str(e)}")
            all_good = False

    return all_good

def test_game_logic():
    """测试游戏逻辑的停止功能"""
    print("\n🧪 测试游戏逻辑...")

    try:
        import sys
        import os
        sys.path.append('.')

        from werewolf.game import GameMaster

        # 创建模拟状态
        class MockState:
            def __init__(self):
                self.session_id = 'test_session'
                self.winner = ''
                self.rounds = []

        state = MockState()
        gm = GameMaster(state)

        # 测试停止功能
        if hasattr(gm, 'should_stop') and hasattr(gm, 'stop'):
            print("  ✅ GameMaster 具有停止功能")

            # 测试初始状态
            if not gm.should_stop:
                print("  ✅ 初始停止状态为 False")
            else:
                print("  ❌ 初始停止状态应为 False")
                return False

            # 测试停止方法
            gm.stop()
            if gm.should_stop:
                print("  ✅ stop() 方法正常工作")
                return True
            else:
                print("  ❌ stop() 方法未正常工作")
                return False
        else:
            print("  ❌ GameMaster 缺少停止功能")
            return False

    except ImportError as e:
        print(f"  ❌ 导入游戏模块失败: {str(e)}")
        return False
    except Exception as e:
        print(f"  ❌ 测试游戏逻辑时出错: {str(e)}")
        return False

def main():
    """运行所有测试"""
    print("🚀 开始游戏终止和重启功能集成测试\n")

    tests = [
        ("前端文件检查", test_frontend_files),
        ("游戏逻辑测试", test_game_logic),
        ("Web服务器端点测试", test_web_server_endpoints),
        ("游戏终止API测试", test_game_termination_api),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} 执行失败: {str(e)}")
            results.append((test_name, False))

    # 输出测试总结
    print("\n" + "="*50)
    print("📊 测试结果总结:")
    print("="*50)

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
        if result:
            passed += 1

    print(f"\n总计: {passed}/{total} 测试通过")

    if passed == total:
        print("🎉 所有测试通过！游戏终止和重启功能已成功实现。")
        return 0
    else:
        print("⚠️  部分测试失败，请检查相关功能。")
        return 1

if __name__ == "__main__":
    sys.exit(main())