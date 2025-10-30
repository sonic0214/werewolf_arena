#!/usr/bin/env python3
"""
离线测试游戏终止和重启功能
"""

import sys
import os

def test_web_server_imports():
    """测试Web服务器导入和路由"""
    print("🧪 测试Web服务器导入...")

    try:
        sys.path.append('.')
        import web_server

        # 检查关键路由是否存在
        app = web_server.app
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(rule.rule)

        print("  可用路由:")
        for route in sorted(routes):
            print(f"    {route}")

        # 检查关键路由是否存在
        required_routes = ['/stop-game/<session_id>', '/list-games', '/game-status/<session_id>']
        missing_routes = []

        for route in required_routes:
            if not any(route.replace('<session_id>', '') in r for r in routes):
                missing_routes.append(route)

        if missing_routes:
            print(f"  ❌ 缺少路由: {', '.join(missing_routes)}")
            return False
        else:
            print("  ✅ 所有必需路由都存在")
            return True

    except ImportError as e:
        print(f"  ❌ 导入Web服务器失败: {str(e)}")
        return False
    except Exception as e:
        print(f"  ❌ 测试Web服务器时出错: {str(e)}")
        return False

def test_game_mechanics():
    """测试游戏机制"""
    print("\n🧪 测试游戏机制...")

    try:
        sys.path.append('.')
        from werewolf.game import GameMaster
        from werewolf.model import State, Seer, Doctor, Villager, Werewolf

        # 创建模拟玩家
        seer = Seer(name="TestSeer", model="test")
        doctor = Doctor(name="TestDoctor", model="test")
        villagers = [Villager(name="Villager1", model="test")]
        werewolves = [Werewolf(name="Wolf1", model="test")]

        # 创建状态
        state = State(
            session_id="test_session",
            seer=seer,
            doctor=doctor,
            villagers=villagers,
            werewolves=werewolves
        )

        # 创建GameMaster
        gm = GameMaster(state)

        # 测试停止功能
        if not hasattr(gm, 'should_stop'):
            print("  ❌ 缺少 should_stop 属性")
            return False

        if not hasattr(gm, 'stop'):
            print("  ❌ 缺少 stop 方法")
            return False

        if gm.should_stop != False:
            print("  ❌ 初始 should_stop 状态错误")
            return False

        # 测试停止
        gm.stop()
        if gm.should_stop != True:
            print("  ❌ stop() 方法未正常工作")
            return False

        print("  ✅ 游戏停止机制正常工作")
        return True

    except ImportError as e:
        print(f"  ❌ 导入游戏模块失败: {str(e)}")
        return False
    except Exception as e:
        print(f"  ❌ 测试游戏机制时出错: {str(e)}")
        return False

def test_web_server_functions():
    """测试Web服务器函数"""
    print("\n🧪 测试Web服务器函数...")

    try:
        sys.path.append('.')
        import web_server

        # 检查关键变量和字典
        required_vars = ['running_games', 'game_threads', 'game_masters']

        for var_name in required_vars:
            if hasattr(web_server, var_name):
                var_value = getattr(web_server, var_name)
                if isinstance(var_value, dict):
                    print(f"  ✅ {var_name} 字典存在")
                else:
                    print(f"  ❌ {var_name} 不是字典类型")
                    return False
            else:
                print(f"  ❌ 缺少 {var_name} 变量")
                return False

        # 检查关键函数
        required_funcs = ['stop_game']

        for func_name in required_funcs:
            if hasattr(web_server, func_name) and callable(getattr(web_server, func_name)):
                print(f"  ✅ {func_name} 函数存在")
            else:
                print(f"  ❌ 缺少 {func_name} 函数")
                return False

        print("  ✅ Web服务器函数结构正确")
        return True

    except ImportError as e:
        print(f"  ❌ 导入Web服务器失败: {str(e)}")
        return False
    except Exception as e:
        print(f"  ❌ 测试Web服务器函数时出错: {str(e)}")
        return False

def test_frontend_content():
    """测试前端内容"""
    print("\n🧪 测试前端内容...")

    files_to_check = {
        'index.html': [
            'stop-game-btn',
            'restart-game-btn',
            'game-controls',
            'control-btn',
            'status-dot'
        ],
        'home.html': [
            'game-management',
            'refreshGamesList',
            'stopGameFromList',
            'viewGame',
            'games-list'
        ],
        'static/index_live.js': [
            'stopGame',
            'restartGame',
            'updateGameControls',
            'startGameStatusPolling',
            'checkGameStatus'
        ]
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

    if all_good:
        print("  ✅ 所有前端文件内容正确")

    return all_good

def main():
    """运行离线测试"""
    print("🚀 开始游戏终止和重启功能离线测试\n")

    tests = [
        ("Web服务器导入测试", test_web_server_imports),
        ("Web服务器函数测试", test_web_server_functions),
        ("游戏机制测试", test_game_mechanics),
        ("前端内容测试", test_frontend_content),
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
    print("📊 离线测试结果总结:")
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
        print("🎉 所有离线测试通过！")
        print("\n📋 功能实现总结:")
        print("✅ 游戏终止API端点 (/stop-game/<session_id>)")
        print("✅ 游戏状态查询API (/game-status/<session_id>)")
        print("✅ 游戏列表API (/list-games)")
        print("✅ GameMaster优雅停止机制")
        print("✅ 直播页面游戏控制按钮")
        print("✅ 主页游戏管理面板")
        print("✅ 前端状态轮询和UI更新")
        print("\n🚀 使用方法:")
        print("1. 启动Web服务器: python3 web_server.py")
        print("2. 访问主页: http://localhost:8081/")
        print("3. 创建新游戏或管理现有游戏")
        print("4. 在直播页面使用控制按钮停止/重启游戏")
        return 0
    else:
        print("⚠️  部分测试失败，请检查相关功能。")
        return 1

if __name__ == "__main__":
    sys.exit(main())