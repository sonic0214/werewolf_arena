#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试API配置功能
"""

import sys
import os

def test_api_config():
    """测试API配置"""
    print("🔧 测试API配置功能...")

    try:
        sys.path.append('.')
        from api_config import api_config

        print("✅ API配置模块导入成功")
        return True
    except Exception as e:
        print(f"❌ API配置模块导入失败: {e}")
        return False

def test_config_creation():
    """测试配置文件创建"""
    print("\n📁 测试配置文件创建...")

    try:
        from api_config import APIConfig

        # 创建测试配置实例
        test_config = APIConfig("test_api_config.json")

        if os.path.exists("test_api_config.json"):
            print("✅ 配置文件创建成功")

            # 检查配置内容
            config_data = test_config.get_status()
            print(f"✅ 配置文件包含 {len(config_data.get('apis', {}))} 个API配置")
            print(f"✅ 配置文件包含 {len(config_data.get('models', {}))} 个模型配置")

            # 清理测试文件
            os.remove("test_api_config.json")
            return True
        else:
            print("❌ 配置文件创建失败")
            return False

    except Exception as e:
        print(f"❌ 配置文件测试失败: {e}")
        return False

def test_glm_config():
    """测试GLM配置"""
    print("\n🤖 测试GLM模型配置...")

    try:
        from api_config import api_config

        # 检查glmz1-flash模型
        model_config = api_config.get_model_config("glmz1-flash")

        if model_config:
            print(f"✅ glmz1-flash模型配置: {model_config}")

            # 检查API类型
            api_type = api_config.get_model_api_type("glmz1-flash")
            if api_type == "glm":
                print("✅ glmz1-flash正确路由到GLM API")

                # 检查是否启用
                if api_config.is_model_enabled("glmz1-flash"):
                    print("✅ glmz1-flash模型已启用")
                    return True
                else:
                    print("⚠️ glmz1-flash模型未启用")
                    return False
            else:
                print(f"❌ glmz1-flash路由错误: {api_type}")
                return False
        else:
            print("❌ glmz1-flash模型配置未找到")
            return False

    except Exception as e:
        print(f"❌ GLM配置测试失败: {e}")
        return False

def test_api_key_config():
    """测试API密钥配置"""
    print("\n🔑 测试API密钥配置...")

    try:
        from api_config import api_config

        # 获取GLM API密钥
        glm_key = api_config.get_api_key("glm")

        if glm_key:
            print(f"✅ GLM API密钥已配置: {glm_key[:10]}...")
        else:
            print("⚠️ GLM API密钥未配置")

        # 获取GLM基础URL
        glm_url = api_config.get_api_base_url("glm")
        print(f"✅ GLM API基础URL: {glm_url}")

        # 检查Google Cloud是否禁用
        google_enabled = api_config.is_google_cloud_enabled()
        if not google_enabled:
            print("✅ Google Cloud API已禁用")
        else:
            print("⚠️ Google Cloud API仍然启用")

        return True

    except Exception as e:
        print(f"❌ API密钥配置测试失败: {e}")
        return False

def test_apis_integration():
    """测试API集成"""
    print("\n🔌 测试API集成...")

    try:
        sys.path.append('.')
        from werewolf.apis import generate_glm

        print("✅ APIs模块导入成功")

        # 测试API配置导入
        from werewolf.apis import api_config
        print("✅ API配置在apis模块中可用")

        return True

    except Exception as e:
        print(f"❌ API集成测试失败: {e}")
        return False

def main():
    """运行所有测试"""
    print("🧪 API配置功能测试")
    print("=" * 50)

    tests = [
        ("API配置模块", test_api_config),
        ("配置文件创建", test_config_creation),
        ("GLM模型配置", test_glm_config),
        ("API密钥配置", test_api_key_config),
        ("API集成", test_apis_integration)
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
        print("\n🎉 API配置功能完全正常！")
        print("\n🚀 下一步:")
        print("1. 编辑 api_config.json 文件")
        print("2. 在 apis.glm.api_key 中填入GLM API密钥")
        print("3. 启动Web服务器: python3 start_web_server.py")
        print("4. 访问 http://localhost:8081/api-config 查看配置状态")
        return True
    else:
        print(f"\n⚠️ {total - passed} 项测试失败")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)