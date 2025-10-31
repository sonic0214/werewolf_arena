# 狼人杀竞技场 - 项目启动指南

## 🚀 快速启动

### 前置要求
- Python 3.11+
- Node.js 14+ (可选，用于前端开发)
- Git

### 1. 项目设置

```bash
# 克隆项目（如果还没有）
git clone <repository-url>
cd werewolf_arena

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 环境配置

```bash
# 配置API密钥（如果使用GLM模型）
python setup_glm_key.py

# 或者手动编辑配置文件
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件，添加你的API密钥
```

## 🖥️ 后端启动

### 方法一：直接启动（推荐）

```bash
# 进入后端目录
cd backend

# 启动后端服务
source ../venv/bin/activate && python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8001
```

### 方法二：使用启动脚本

```bash
cd backend
chmod +x run_dev.sh
./run_dev.sh
```

### 方法三：开发模式启动

```bash
cd backend
source ../venv/bin/activate
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8001 --log-level debug
```

**后端启动成功标志：**
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 🌐 前端启动

### 方法一：Python简单服务器（推荐）

```bash
# 在项目根目录下
python3 -m http.server 8080

# 或者指定具体目录
python3 -m http.server 8080 --directory .
```

### 方法二：Node.js服务器

```bash
# 如果安装了Node.js
npx serve . -p 8080

# 或者使用http-server
npm install -g http-server
http-server . -p 8080
```

### 方法三：Live Server（VSCode）

如果你使用VSCode，可以安装Live Server扩展：
1. 安装 "Live Server" 扩展
2. 右键点击 `home.html`
3. 选择 "Open with Live Server"

**前端启动成功标志：**
```
Serving HTTP on 0.0.0.0 port 8080 (http://localhost:8080/) ...
```

## 🎮 访问应用

启动成功后，可以通过以下地址访问：

- **主页（游戏启动页面）**: http://localhost:8080/home.html
- **游戏直播页面**: http://localhost:8080/index.html
- **API文档**: http://localhost:8001/docs
- **API健康检查**: http://localhost:8001/health

## 📝 完整启动流程

### 1. 终端窗口1 - 启动后端

```bash
cd /Users/admin/Project/werewolf_arena
cd backend
source ../venv/bin/activate
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8001
```

### 2. 终端窗口2 - 启动前端

```bash
cd /Users/admin/Project/werewolf_arena
python3 -m http.server 8080
```

### 3. 浏览器访问

打开浏览器访问：http://localhost:8080/home.html

## 🔧 配置说明

### 端口配置
- **后端端口**: 8001 (可在启动命令中修改)
- **前端端口**: 8080 (可在启动命令中修改)

### API配置文件位置
- **环境变量**: `backend/.env`
- **API配置**: `api_config.json`
- **游戏配置**: `game_config.py`

## 🐛 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :8001
lsof -i :8080

# 杀死进程
kill -9 <PID>

# 或者使用其他端口
python3 -m uvicorn src.api.app:app --port 8002
```

### 2. 模块导入错误
```bash
# 确保在正确的目录下启动
cd backend
source ../venv/bin/activate
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8001
```

### 3. 虚拟环境问题
```bash
# 重新创建虚拟环境
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. API密钥配置
```bash
# 重新配置API密钥
python setup_glm_key.py

# 或手动编辑
nano backend/.env
```

### 5. 权限问题
```bash
# 给脚本执行权限
chmod +x backend/run_dev.sh
```

## 📁 项目结构

```
werewolf_arena/
├── backend/                    # 后端代码
│   ├── src/
│   │   ├── api/
│   │   │   ├── app.py         # FastAPI应用入口
│   │   │   └── routes/        # API路由
│   │   └── services/          # 业务逻辑
│   ├── logs/                  # 游戏日志
│   └── .env                   # 环境变量配置
├── static/                    # 前端静态资源
│   └── index_live.js         # 直播页面JavaScript
├── home.html                  # 主页
├── index.html                 # 游戏直播页面
├── venv/                      # Python虚拟环境
├── requirements.txt           # Python依赖
└── api_config.json           # API配置
```

## 🔄 开发流程

1. **启动服务**：按照上述步骤启动前后端
2. **访问主页**：http://localhost:8080/home.html
3. **创建游戏**：选择AI模型，点击"模拟开局"
4. **观看直播**：自动跳转到 http://localhost:8080/index.html?session_id=xxx
5. **查看日志**：游戏日志保存在 `backend/logs/` 目录下

## 📊 监控和调试

### 后端调试
```bash
# 启用调试模式
python3 -m uvicorn src.api.app:app --reload --log-level debug

# 查看API文档
curl http://localhost:8001/docs
```

### 前端调试
- 打开浏览器开发者工具
- 查看Network标签监控API请求
- 查看Console标签查看日志输出

### 日志位置
- **后端日志**：控制台输出
- **游戏日志**：`backend/logs/session_YYYYMMDD_HHMMSS/`
- **前端日志**：浏览器开发者工具Console

---

## 🎯 快速测试命令

```bash
# 一键启动脚本（保存为 start.sh）
#!/bin/bash
echo "🚀 启动狼人杀竞技场..."

# 启动后端
cd backend
source ../venv/bin/activate
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

# 启动前端
cd ..
python3 -m http.server 8080 &
FRONTEND_PID=$!

echo "✅ 后端启动: http://localhost:8001"
echo "✅ 前端启动: http://localhost:8080/home.html"
echo "🛑 停止服务: kill $BACKEND_PID $FRONTEND_PID"

# 等待用户输入
read -p "按Enter键停止服务..."
kill $BACKEND_PID $FRONTEND_PID
echo "👋 服务已停止"
```

保存为 `start.sh`，然后运行：
```bash
chmod +x start.sh
./start.sh
```