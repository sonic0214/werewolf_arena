# 模型配置更新记录

## 📋 更新内容

### 修改时间
2025-11-01

### 更新文件
1. `/backend/src/config/player_models.py`
2. `/backend/src/config/settings.py`

## 🔄 模型替换详情

### 替换前 (混元系列)
- `Hunyuan-A13B` → `siliconflow/tencent/Hunyuan-A13B-Instruct`
- `Hunyuan-MT-7B` → `siliconflow/tencent/Hunyuan-MT-7B`

### 替换后 (新模型)
- `MiniMax-M1-80k` → `MiniMaxAI/MiniMax-M1-80k`
- `Ring-flash-2.0` → `inclusionAI/Ring-flash-2.0`

## 📊 当前完整模型列表

| 玩家名称 | 模型ID | 提供商 | 状态 |
|---------|--------|--------|------|
| MiniMax-M1-80k | MiniMaxAI/MiniMax-M1-80k | MiniMaxAI | ✅ 新增 |
| GLM-4.6 | siliconflow/zai-org/GLM-4.6 | 硅基流动 | ✅ 保留 |
| Qwen3-32B | siliconflow/Qwen/Qwen3-32B | 硅基流动 | ✅ 保留 |
| DeepSeek-V3.2 | siliconflow/deepseek-ai/DeepSeek-V3.2-Exp | 硅基流动 | ✅ 保留 |
| Kimi-Dev-72B | siliconflow/moonshotai/Kimi-Dev-72B | 硅基流动 | ✅ 保留 |
| Ring-flash-2.0 | inclusionAI/Ring-flash-2.0 | inclusionAI | ✅ 新增 |

## 🎯 游戏角色分配

根据日志显示，模型在游戏中通常扮演以下角色：

- **MiniMax-M1-80k**: 预言家 (原 Hunyuan-A13B 角色)
- **GLM-4.6**: 狼人
- **Qwen3-32B**: 村民
- **DeepSeek-V3.2**: 村民 (默认备用模型)
- **Kimi-Dev-72B**: 医生
- **Ring-flash-2.0**: 村民 (原 Hunyuan-MT-7B 角色)

## ⚙️ 配置变更详情

### 1. player_models.py
```python
# PLAYER_MODEL_MAPPING 更新
PLAYER_MODEL_MAPPING = {
    "MiniMax-M1-80k": "MiniMaxAI/MiniMax-M1-80k",  # 新增
    "GLM-4.6": "siliconflow/zai-org/GLM-4.6",      # 保留
    "Qwen3-32B": "siliconflow/Qwen/Qwen3-32B",      # 保留
    "DeepSeek-V3.2": "siliconflow/deepseek-ai/DeepSeek-V3.2-Exp",  # 保留
    "Kimi-Dev-72B": "siliconflow/moonshotai/Kimi-Dev-72B",        # 保留
    "Ring-flash-2.0": "inclusionAI/Ring-flash-2.0"   # 新增
}

# 默认模型更新
return "MiniMaxAI/MiniMax-M1-80k"  # 原: DeepSeek-V3.2-Exp
```

### 2. settings.py
```python
# PLAYER_MODEL_NAMES 更新
PLAYER_MODEL_NAMES = [
    "MiniMax-M1-80k",      # 替换 Hunyuan-A13B
    "GLM-4.6",             # 保留
    "Qwen3-32B",           # 保留
    "DeepSeek-V3.2",       # 保留
    "Kimi-Dev-72B",        # 保留
    "Ring-flash-2.0"       # 替换 Hunyuan-MT-7B
]
```

## 🔧 需要确认的事项

1. **API密钥配置**: 确认MiniMaxAI和inclusionAI的API密钥已正确配置
2. **模型可用性**: 验证新模型在对应平台上是否可用
3. **兼容性测试**: 建议重启服务后测试新模型是否正常工作

## 📝 注意事项

- 新模型使用了不同的提供商 (MiniMaxAI 和 inclusionAI)
- 需要确保这些提供商的API密钥已配置在环境变量中
- 建议在开发环境先测试新模型的响应质量和兼容性
- 如果遇到问题，可以回滚到原来的混元模型配置

## 🚀 重启建议

配置更新后，建议重启后端服务以确保新配置生效：
```bash
cd werewolf_arena/backend
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```