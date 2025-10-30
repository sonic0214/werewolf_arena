# 狼人杀竞技场Web服务器使用说明

## 快速开始

### 1. 启动Web服务器
```bash
# 方式1: 使用启动脚本（推荐）
python3 start_web_server.py

# 方式2: 直接启动Web服务器
python3 web_server.py
```

### 2. 访问首页
启动后访问: http://localhost:8081

## 功能说明

### 🏠 首页功能
- **模型选择**: 可以选择村民和狼人使用的AI模型
- **快速开局**: 点击"模拟开局"按钮启动新游戏
- **实时跳转**: 游戏启动后自动跳转到直播间

### 🤖 可用模型
- `glmz1-flash` - GLM Z1 Flash (默认)
- `glm45-flash` - GLM 4.5 Flash
- `glm4-air` - GLM 4 Air
- `glm4` - GLM 4
- `gpt4o` - GPT-4o
- `gpt4` - GPT-4
- `flash` - Gemini Flash
- `pro1.5` - Gemini Pro 1.5

### 🎮 游戏流程
1. 在首页选择村民和狼人模型
2. 点击"模拟开局"
3. 系统后台启动游戏进程
4. 自动跳转到直播间观看游戏
5. 实时显示游戏进程和AI推理

## API接口

### 启动游戏
```http
POST /start-game
Content-Type: application/json

{
  "v_models": "glmz1-flash",
  "w_models": "glmz1-flash"
}
```

**响应示例:**
```json
{
  "success": true,
  "session_id": "abc12345",
  "v_model": "glmz1-flash",
  "w_model": "glmz1-flash",
  "message": "游戏已启动"
}
```

### 查询游戏状态
```http
GET /game-status/{session_id}
```

### 列出所有游戏
```http
GET /list-games
```

## 文件说明

- `home.html` - 首页HTML文件
- `web_server.py` - Flask Web服务器
- `start_web_server.py` - 启动脚本
- `game_config.py` - 游戏配置文件

## 技术特点

- 🚀 **异步启动**: 游戏在后台异步启动，不阻塞Web界面
- 🎯 **实时跳转**: 游戏启动后自动跳转到直播间
- 🔄 **状态管理**: 跟踪所有运行中的游戏状态
- 🛡️ **错误处理**: 完善的错误处理和用户反馈
- 📱 **响应式设计**: 支持各种屏幕尺寸

## 故障排除

### 1. 端口被占用
如果8081端口被占用，可以修改 `web_server.py` 中的端口设置:
```python
app.run(host='0.0.0.0', port=8082)  # 改为8082或其他端口
```

### 2. 依赖包缺失
```bash
pip install flask flask-cors
```

### 3. 游戏启动失败
- 检查 `main.py` 文件是否存在
- 确保狼人杀游戏相关依赖已安装
- 查看终端输出的错误信息

### 4. 无法访问首页
- 确保Web服务器已启动
- 检查防火墙设置
- 确认访问地址正确: http://localhost:8081

## 开发说明

如需自定义或扩展功能，可以修改以下文件：

- `home.html` - 修改首页样式和功能
- `web_server.py` - 添加新的API接口
- `game_config.py` - 调整游戏参数
- `start_web_server.py` - 修改启动逻辑