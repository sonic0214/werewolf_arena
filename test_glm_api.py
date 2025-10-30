#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试GLM API连接
"""

import os
import sys

# 添加项目路径
sys.path.append('.')

def test_glm_api():
    """测试GLM API连接"""
    print("🔍 测试GLM API连接...")

    # 设置测试API密钥（您需要替换为实际的GLM API密钥）
    test_api_key = "your-glm-api-key-here"  # 请替换为实际的GLM API密钥

    if test_api_key == "your-glm-api-key-here":
        print("⚠️ 需要设置实际的GLM API密钥")
        print("请获取GLM API密钥并设置环境变量：")
        print("export GLM_API_KEY='your-actual-glm-api-key'")
        return False

    os.environ["GLM_API_KEY"] = test_api_key

    try:
        from werewolf.apis import generate_glm

        # 测试GLM API调用
        response = generate_glm(
            model="GLM-Z1-Flash",
            prompt="你好，请回复一个简短的问候语。",
            json_mode=False
        )

        print(f"✅ GLM API调用成功")
        print(f"📝 响应: {response}")
        return True

    except Exception as e:
        print(f"❌ GLM API调用失败: {e}")
        return False

def main():
    """主函数"""
    print("🧪 GLM API连接测试")
    print("=" * 40)

    success = test_glm_api()

    if success:
        print("\n🎉 GLM API配置正确！")
        print("现在可以使用glmz1-flash模型了。")
    else:
        print("\n⚠️ 需要配置GLM API密钥")
        print("请按以下步骤配置：")
        print("1. 访问 https://open.bigmodel.cn/ 获取API密钥")
        print("2. 设置环境变量: export GLM_API_KEY='your-api-key'")
        print("3. 重新运行此测试")

if __name__ == '__main__':
    main()