#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
最终集成测试
Final Integration Test
"""

import sys
import os

def test_web_server_import():
    """测试Web服务器导入"""
    print("🌐 测试Web服务器导入...")
    try:
        sys.path.append('.')
        from web_server import app, api_config
        print("✅ Web服务器导入成功")
        return True
    except Exception as e:
        print(f"❌ Web服务器导入失败: {e}")
        return False

def test_apis_module():
    """测试APIs模块"""
    print("\n🔌 测试APIs模块...")
    try:
        from werewolf.apis import generate_glm, api_config
        print("✅ APIs模块导入成功")

        # 检查GLM API配置
        glm_key = api_config.get_api_key("glm")
        if glm_key:
            print(f"✅ GLM API密钥已配置")
        else:
            print("⚠️ GLM API密钥未配置 - 需要配置")

        return True
    except Exception as e:
        print(f"❌ APIs模块测试失败: {e}")
        return False

def test_model_routing():
    """测试模型路由"""
    print("\n🤖 测试模型路由...")
    try:
        from werewolf.runner import model_to_id
        from api_config import api_config

        # 测试glmz1-flash路由
        if "glmz1-flash" in model_to_id:
            mapped_model = model_to_id["glmz1-flash"]
            print(f"✅ glmz1-flash -> {mapped_model}")

            # 检查配置文件中的模型配置
            model_config = api_config.get_model_config("glmz1-flash")
            if model_config and model_config.get("enabled"):
                api_type = model_config.get("api_type")
                if api_type == "glm":
                    print("✅ glmz1-flash正确路由到GLM API")
                    return True
                else:
                    print(f"❌ API类型错误: {api_type}")
                    return False
            else:
                print("❌ glmz1-flash模型未启用")
                return False
        else:
            print("❌ glmz1-flash模型未找到")
            return False

    except Exception as e:
        print(f"❌ 模型路由测试失败: {e}")
        return False

def test_config_file():
    """测试配置文件"""
    print("\n📁 测试配置文件...")
    try:
        from api_config import api_config

        # 检查配置文件存在
        if os.path.exists("api_config.json"):
            print("✅ api_config.json 存在")

            # 检查配置状态
            status = api_config.get_status()
            glm_status = status.get('apis', {}).get('glm', {})
            if glm_status.get('configured'):
                print("✅ GLM API已配置")
            else:
                print("⚠️ GLM API未配置 - 需要在api_config.json中设置密钥")

            # 检查Google Cloud状态
            google_enabled = api_config.is_google_cloud_enabled()
            if not google_enabled:
                print("✅ Google Cloud API已禁用")
            else:
                print("⚠️ Google Cloud API仍然启用")

            return True
        else:
            print("❌ api_config.json 不存在")
            return False

    except Exception as e:
        print(f"❌ 配置文件测试失败: {e}")
        return False

def test_google_cloud_disabled():
    """测试Google Cloud已禁用"""
    print("\n🚫 测试Google Cloud已禁用...")
    try:
        from werewolf.apis import generate_vertexai

        # 尝试调用Vertex AI - 应该抛出错误
        try:
            generate_vertexai("test-model", "test prompt")
            print("❌ Vertex AI未禁用")
            return False
        except RuntimeError as e:
            if "disabled" in str(e).lower():
                print("✅ Vertex AI已正确禁用")
                return True
            else:
                print(f"❌ Vertex AI错误异常: {e}")
                return False

    except Exception as e:
        print(f"❌ Google Cloud禁用测试失败: {e}")
        return False

def main():
    """运行最终集成测试"""
    print("🧪 最终集成测试")
    print("=" * 60)

    tests = [
        ("Web服务器导入", test_web_server_import),
        ("APIs模块", test_apis_module),
        ("模型路由", test_model_routing),
        ("配置文件", test_config_file),
        ("Google Cloud禁用", test_google_cloud_disabled)
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} 测试异常: {e}")

    print("\n" + "=" * 60)
    print(f"📊 测试结果: {passed}/{total} 通过")

    if passed == total:
        print("\n🎉 系统集成完全成功！")
        print("\n✅ 修复内容:")
        print("   ✅ API密钥配置已提取到 api_config.json")
        print("   ✅ Google Cloud API已完全禁用")
        print("   ✅ GLM API路由配置正确")
        print("   ✅ 配置文件管理功能完善")
        print("\n🚀 启动步骤:")
        print("1. 编辑 api_config.json")
        print("2. 在 'apis.glm.api_key' 中填入GLM API密钥")
        print("3. 启动Web服务器: python3 start_web_server.py")
        print("4. 访问: http://localhost:8081")
        print("5. 配置状态: http://localhost:8081/api-config")
        return True
    else:
        print(f"\n⚠️ {total - passed} 项测试失败")
        print("请检查上述错误并修复")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)