#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
设置GLM API密钥
Setup GLM API Key
"""

import os

def setup_glm_key():
    """设置GLM API密钥"""
    print("🔑 GLM API密钥配置")
    print("=" * 40)

    # 检查是否已设置GLM API密钥
    glm_key = os.environ.get("GLM_API_KEY") or os.environ.get("ZHIPU_API_KEY")

    if glm_key:
        print(f"✅ GLM API密钥已设置: {glm_key[:10]}...")
        return True

    print("⚠️ GLM API密钥未设置")
    print("\n📋 请按以下步骤配置GLM API密钥：")
    print("1. 访问 https://open.bigmodel.cn/ 注册并获取API密钥")
    print("2. 运行以下命令设置环境变量：")
    print("   export GLM_API_KEY='your-glm-api-key-here'")
    print("   或")
    print("   export ZHIPU_API_KEY='your-zhipu-api-key-here'")
    print("3. 重新启动Web服务器")

    # 创建一个示例.env文件
    env_content = "# GLM API配置\nGLM_API_KEY=your-glm-api-key-here\n# 或者使用智谱AI的密钥\n# ZHIPU_API_KEY=your-zhipu-api-key-here\n"

    try:
        with open('.env.example', 'w', encoding='utf-8') as f:
            f.write(env_content)
        print("✅ 已创建 .env.example 文件，您可以复制为 .env 并填入实际密钥")
    except Exception as e:
        print(f"❌ 创建示例文件失败: {e}")

    return False

if __name__ == '__main__':
    setup_glm_key()