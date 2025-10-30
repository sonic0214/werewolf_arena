# 🐺 狼人杀竞技场 - 快速开始指南

## ✅ 问题已解决

404错误已经修复！现在系统可以正确处理 `index_live.html` 路径请求。

## 🚀 一键启动

### 1. 启动Web服务器
```bash
python3 start_web_server.py
```

### 2. 访问首页
打开浏览器访问: http://localhost:8081

### 3. 开始游戏
- 村民模型: `glmz1-flash` (默认)
- 狼人模型: `glmz1-flash` (默认)
- 点击 "🎮 模拟开局"

## 🎮 完整流程

1. **首页配置** → 选择AI模型
2. **启动游戏** → 后台运行 `python3 main.py --run --v_models=glmz1-flash --w_models=glmz1-flash`
3. **自动跳转** → 跳转到直播间 `http://localhost:8081/index_live.html?session_id=xxx`
4. **实时观看** → 观看AI对战过程

## 📁 文件结构

```
werewolf_arena/
├── home.html                 # 🏠 首页 (模型选择 + 开局)
├── index.html               # 📺 直播页面 (实际就是 index_live.html)
├── web_server.py            # 🌐 Web服务器
├── start_web_server.py      # 🚀 启动脚本
├── main.py                  # 🎮 游戏主程序
├── game_config.py           # ⚙️ 游戏配置
├── static/
│   └── index_live.js        # 📱 直播页面脚本
└── test_system.py           # 🧪 系统测试
```

## 🤖 支持的模型

| 模型名称 | 说明 |
|---------|------|
| `glmz1-flash` | GLM Z1 Flash (推荐) |
| `glm45-flash` | GLM 4.5 Flash |
| `glm4-air` | GLM 4 Air |
| `glm4` | GLM 4 |
| `gpt4o` | GPT-4o |
| `gpt4` | GPT-4 |
| `flash` | Gemini Flash |
| `pro1.5` | Gemini Pro 1.5 |

## ⚙️ 配置优化

已优化的配置参数：
- **线程数**: 5 (提升并行度)
- **辩论次数**: 2 (加快游戏速度)
- **刷新间隔**: 2秒 (实时更新)
- **玩家数量**: 6人

## 🌐 API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 首页 |
| `/start-game` | POST | 启动游戏 |
| `/index_live.html` | GET | 直播页面 |
| `/game-status/{id}` | GET | 游戏状态 |
| `/list-games` | GET | 游戏列表 |

## 🔧 故障排除

### 1. 404错误 → ✅ 已解决
- **问题**: `GET /index_live.html?session_id=xxx` 返回404
- **解决**: Web服务器现在正确路由 `index_live.html` → `index.html`

### 2. 命令执行方式 → ✅ 已优化
- **原问题**: 使用subprocess执行 `python3 main.py` 命令
- **优化方案**: 直接调用内部 `run_game()` 函数，更高效且避免依赖外部命令

### 3. Session ID对齐 → ✅ 已修复
- **原问题**: Web服务器生成的ID与游戏session_id不匹配
- **解决方案**:
  - 使用游戏内部生成的真实session_id
  - 前端轮询机制确保获取正确的session_id
  - 数据读取路径正确对齐

### 2. 端口占用
```bash
# 使用不同端口
python3 -c "
from web_server import app
app.run(port=8082)
"
```

### 3. 依赖缺失
```bash
pip install flask flask-cors
```

### 4. 游戏启动失败
- 检查 `main.py` 是否存在
- 确保游戏依赖已安装
- 查看终端错误信息

## 🎯 核心功能

- ✅ **Web界面**: 现代化的模型选择界面
- ✅ **一键启动**: 点击按钮即可启动游戏
- ✅ **自动跳转**: 游戏启动后跳转到直播间
- ✅ **实时更新**: 每2秒刷新游戏状态
- ✅ **多模型支持**: 支持多种AI模型
- ✅ **参数优化**: 已优化线程数和辩论次数
- ✅ **错误处理**: 完善的错误提示和处理
- ✅ **状态管理**: 跟踪游戏运行状态

## 🧪 测试系统

运行测试脚本验证系统状态：
```bash
python3 test_system.py
```

## 📞 使用支持

如遇问题：
1. 运行 `python3 test_system.py` 检查系统状态
2. 查看 `WEB_SERVER_README.md` 详细文档
3. 检查终端输出的错误信息

---

🎉 **系统已完全就绪，可以开始使用！**