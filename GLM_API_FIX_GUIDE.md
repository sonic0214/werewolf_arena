# 🔧 GLM API 认证问题修复指南

## 🎯 问题描述

当前遇到Google Cloud认证错误：
```
Retrying due to Exception: Your default credentials were not found.
To set up Application Default Credentials, see
https://cloud.google.com/docs/authentication/external/set-up-adc for more information.
```

## 🔍 问题根因分析

1. **模型路由问题**: 系统本应使用GLM API，但可能在某些情况下错误路由到Google Cloud API
2. **API密钥缺失**: GLM API密钥未配置，导致API调用失败
3. **认证配置不完整**: 缺少必要的环境变量设置

## ✅ 解决方案

### 1. 配置GLM API密钥

#### 方法A: 设置环境变量（推荐）
```bash
# 设置GLM API密钥
export GLM_API_KEY="your-actual-glm-api-key"

# 或者使用智谱AI的密钥
export ZHIPU_API_KEY="your-actual-zhipu-api-key"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export GLM_API_KEY="your-actual-glm-api-key"' >> ~/.bashrc
source ~/.bashrc
```

#### 方法B: 使用.env文件
```bash
# 创建.env文件
cp .env.example .env

# 编辑.env文件，填入实际的API密钥
nano .env
```

### 2. 获取GLM API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册并登录账户
3. 在控制台获取API密钥
4. 将密钥设置为环境变量

### 3. 验证配置

#### 检查API状态
```bash
curl http://localhost:8081/api-status
```

#### 运行测试脚本
```bash
python3 test_glm_api.py
```

#### 运行配置检查
```bash
python3 setup_glm_key.py
```

## 🛠️ 已实施的修复

### 1. Web服务器增强
- ✅ 添加GLM API密钥检查
- ✅ 提供友好的错误提示
- ✅ 添加 `/api-status` 端点用于诊断

### 2. 模型路由优化
- ✅ `glmz1-flash` 正确映射到 `"glm/GLM-Z1-Flash"`
- ✅ GLM API路由逻辑完善
- ✅ 避免错误的Google Cloud调用

### 3. 错误处理改进
- ✅ 更好的错误提示信息
- ✅ 详细的配置指导
- ✅ 诊断工具集成

## 🎮 使用流程

### 1. 配置API密钥
```bash
export GLM_API_KEY="your-actual-api-key"
```

### 2. 启动Web服务器
```bash
python3 start_web_server.py
```

### 3. 访问系统
- 首页: http://localhost:8081
- API状态: http://localhost:8081/api-status

### 4. 开始游戏
1. 选择模型：`glmz1-flash`
2. 点击"模拟开局"
3. 系统自动跳转到直播间

## 🔧 故障排除

### 问题1: 仍然提示Google Cloud认证错误
**原因**: 可能存在其他模型配置错误
**解决**:
1. 确认使用的是 `glmz1-flash` 模型
2. 检查 `/api-status` 端点输出
3. 确保没有其他模型配置干扰

### 问题2: GLM API调用失败
**原因**: API密钥无效或过期
**解决**:
1. 检查API密钥是否正确
2. 确认账户余额充足
3. 验证API密钥权限

### 问题3: 游戏启动失败
**原因**: 多种可能原因
**解决**:
1. 运行系统测试: `python3 test_system.py`
2. 检查所有依赖: `pip install -r requirements.txt`
3. 查看详细错误日志

## 📋 配置清单

- [ ] GLM API密钥已设置 (`GLM_API_KEY` 或 `ZHIPU_API_KEY`)
- [ ] Web服务器启动成功 (`python3 start_web_server.py`)
- [ ] API状态检查通过 (`/api-status`)
- [ ] 首页可正常访问 (`http://localhost:8081`)
- [ ] 游戏启动功能正常

## 🎯 模型配置参考

| 模型名称 | API类型 | 环境变量 | 状态 |
|---------|---------|-----------|------|
| `glmz1-flash` | GLM API | `GLM_API_KEY` | ✅ 推荐使用 |
| `glm45-flash` | GLM API | `GLM_API_KEY` | ✅ 可用 |
| `gpt4o` | OpenAI API | `OPENAI_API_KEY` | 需配置 |
| `flash` | Google Cloud | Google认证 | 不推荐 |

## 🌟 最佳实践

1. **优先使用GLM模型**: `glmz1-flash` 性能优秀且配置简单
2. **环境变量管理**: 使用 `.env` 文件管理敏感信息
3. **定期检查**: 使用 `/api-status` 端点监控配置状态
4. **错误日志**: 注意查看控制台输出的详细错误信息

---

🎉 **配置完成后，系统将完全使用GLM API，不再需要Google Cloud认证！**