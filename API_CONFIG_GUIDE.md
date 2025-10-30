# 🔑 API配置管理指南

## 🎯 概述

本系统已将API密钥管理完全重构为基于配置文件的方式，避免了环境变量依赖和Google Cloud认证问题。

## 📁 配置文件

### 主配置文件：`api_config.json`

系统已自动创建包含所有必要配置的JSON文件：

```json
{
  "apis": {
    "glm": {
      "api_key": "",
      "base_url": "https://open.bigmodel.cn/api/paas/v4",
      "description": "智谱AI GLM API"
    }
  },
  "models": {
    "glmz1-flash": {
      "api_type": "glm",
      "model_name": "GLM-Z1-Flash",
      "enabled": true
    }
  },
  "google_cloud": {
    "enabled": false,
    "description": "Google Cloud API (已禁用，优先使用GLM)"
  }
}
```

## 🚀 快速配置

### 1. 获取GLM API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册并登录账户
3. 在控制台获取API密钥
4. 复制密钥备用

### 2. 配置API密钥

编辑 `api_config.json` 文件：

```json
{
  "apis": {
    "glm": {
      "api_key": "你的GLM-API密钥",
      "base_url": "https://open.bigmodel.cn/api/paas/v4",
      "description": "智谱AI GLM API"
    }
  }
}
```

### 3. 启动系统

```bash
python3 start_web_server.py
```

### 4. 验证配置

访问配置页面：http://localhost:8081/api-config

## 🔧 配置选项

### API配置

#### GLM API（推荐）
- **类型**: `glm`
- **模型**: `glmz1-flash`, `glm45-flash`
- **获取密钥**: https://open.bigmodel.cn/
- **状态**: ✅ 推荐使用

#### OpenAI API
- **类型**: `openai`
- **模型**: `gpt4o`, `gpt4`
- **获取密钥**: https://platform.openai.com/
- **状态**: 可选配置

#### OpenRouter API
- **类型**: `openrouter`
- **模型**: 多种开源模型
- **获取密钥**: https://openrouter.ai/
- **状态**: 可选配置

### 模型配置

| 模型名称 | API类型 | 状态 | 推荐度 |
|---------|---------|------|--------|
| `glmz1-flash` | GLM | ✅ 启用 | ⭐⭐⭐⭐⭐ |
| `glm45-flash` | GLM | ✅ 启用 | ⭐⭐⭐⭐ |
| `gpt4o` | OpenAI | ❌ 禁用 | ⭐⭐⭐ |
| `flash` | Google Cloud | ❌ 禁用 | ❌ |

## 🛠️ 高级配置

### 启用/禁用模型

```json
{
  "models": {
    "gpt4o": {
      "api_type": "openai",
      "model_name": "gpt-4o",
      "enabled": true
    }
  }
}
```

### 添加自定义模型

```json
{
  "models": {
    "my-custom-model": {
      "api_type": "openai",
      "model_name": "gpt-4-turbo",
      "enabled": true
    }
  }
}
```

## 🔍 故障排除

### 问题1: API密钥无效
**症状**: 调用API时返回认证错误
**解决**:
1. 检查API密钥是否正确复制
2. 确认账户余额充足
3. 验证API密钥权限

### 问题2: 模型未启用
**症状**: 游戏启动时提示模型未启用
**解决**:
1. 编辑 `api_config.json`
2. 将对应模型的 `"enabled"` 设为 `true`
3. 重启Web服务器

### 问题3: Google Cloud认证错误
**症状**: 仍然提示Google Cloud认证问题
**解决**:
- ✅ 已完全禁用Google Cloud API
- ✅ 使用GLM API替代
- ✅ 不会再出现认证错误

## 📊 监控和诊断

### 配置状态检查
- **Web界面**: http://localhost:8081/api-config
- **API接口**: http://localhost:8081/api-status

### 测试命令
```bash
# 测试API配置
python3 test_api_config.py

# 测试系统集成
python3 test_final_integration.py

# 测试完整系统
python3 final_system_test.py
```

## 🔒 安全注意事项

1. **不要提交API密钥到版本控制**
2. **定期轮换API密钥**
3. **监控API使用量和费用**
4. **使用强密码保护API密钥**

## 📋 配置检查清单

- [ ] GLM API密钥已配置
- [ ] glmz1-flash模型已启用
- [ ] Google Cloud API已禁用
- [ ] 配置文件权限正确
- [ ] Web服务器启动成功
- [ ] 配置页面可正常访问

## 🆘 获取帮助

1. **查看日志**: 启动Web服务器时的控制台输出
2. **检查配置**: http://localhost:8081/api-config
3. **运行测试**: `python3 test_final_integration.py`
4. **查看文档**: `QUICK_START.md`, `GLM_API_FIX_GUIDE.md`

---

🎉 **配置完成后，系统将完全使用GLM API，不再有Google Cloud认证问题！**