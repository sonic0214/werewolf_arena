#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
最终系统测试
Final System Test
"""

import sys
import os

def test_web_server():
    """测试Web服务器"""
    print("🌐 测试Web服务器...")
    try:
        sys.path.append('.')
        from web_server import app, run_game_standalone, DEFAULT_THREADS
        print("✅ Web服务器导入成功")
        return True
    except Exception as e:
        print(f"❌ Web服务器导入失败: {e}")
        return False

def test_model_mapping():
    """测试模型映射"""
    print("\n🤖 测试模型映射...")
    try:
        from werewolf.runner import model_to_id

        test_model = 'glmz1-flash'
        if test_model in model_to_id:
            mapped_model = model_to_id[test_model]
            print(f"✅ {test_model} -> {mapped_model}")

            # 检查是否正确映射到GLM API
            if mapped_model.startswith("glm/"):
                print("✅ 正确路由到GLM API")
                return True
            else:
                print(f"⚠️ 模型路由异常: {mapped_model}")
                return False
        else:
            print(f"❌ 模型 {test_model} 未找到")
            return False
    except Exception as e:
        print(f"❌ 模型映射测试失败: {e}")
        return False

def test_glm_api_config():
    """测试GLM API配置"""
    print("\n🔑 测试GLM API配置...")

    glm_key = os.environ.get("GLM_API_KEY") or os.environ.get("ZHIPU_API_KEY")

    if glm_key:
        print(f"✅ GLM API密钥已配置: {glm_key[:10]}...")
        return True
    else:
        print("⚠️ GLM API密钥未配置")
        print("请设置: export GLM_API_KEY='your-api-key'")
        return False

def test_file_dependencies():
    """测试文件依赖"""
    print("\n📁 测试文件依赖...")

    required_files = [
        'web_server.py',
        'home.html',
        'index.html',
        'werewolf/apis.py',
        'werewolf/runner.py',
        'game_config.py'
    ]

    missing = []
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - 缺失")
            missing.append(file)

    return len(missing) == 0

def main():
    """运行最终测试"""
    print("🧪 最终系统测试")
    print("=" * 50)

    tests = [
        ("Web服务器", test_web_server),
        ("模型映射", test_model_mapping),
        ("GLM API配置", test_glm_api_config),
        ("文件依赖", test_file_dependencies)
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} 测试异常: {e}")

    print("\n" + "=" * 50)
    print(f"📊 测试结果: {passed}/{total} 通过")

    if passed == total:
        print("\n🎉 系统完全就绪！")
        print("\n🚀 启动步骤:")
        print("1. 确保GLM API密钥已设置:")
        print("   export GLM_API_KEY='your-api-key'")
        print("2. 启动Web服务器:")
        print("   python3 start_web_server.py")
        print("3. 访问首页:")
        print("   http://localhost:8081")
        print("\n💡 如遇问题请查看:")
        print("- GLM_API_FIX_GUIDE.md")
        print("- FLAGS_FIX_REPORT.md")
        print("- QUICK_START.md")
        return True
    else:
        print(f"\n⚠️ {total - passed} 项测试失败")
        print("请检查上述问题并参考修复指南")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)