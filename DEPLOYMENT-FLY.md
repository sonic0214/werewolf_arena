# Werewolf Arena fly.io 部署指南

## 📋 部署概述

本指南帮助您将 Werewolf Arena 应用部署到 fly.io 平台。应用采用前后端统一部署方式，在单个容器中运行。

## 🏗️ 架构说明

- **前端**: Next.js 应用 (构建为静态文件)
- **后端**: FastAPI 应用 (提供API服务和静态文件服务)
- **数据库**: 无需数据库，应用基于内存状态管理
- **部署方式**: 单容器统一部署

## 🚀 快速部署

### 1. 前置条件

- 安装 [fly CLI](https://fly.io/docs/getting-started/installing-flyctl/)
- 创建 [fly.io 账户](https://fly.io/app/sign-up)

### 2. 准备部署

```bash
# 克隆项目
git clone <your-repo-url>
cd werewolf_arena

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，至少配置一个 LLM API 密钥
```

### 3. 一键部署

```bash
# 使用提供的部署脚本
./scripts/deploy-fly.sh
```

或者手动执行：

```bash
# 登录 fly.io
fly auth login

# 创建应用
fly apps create werewolf-arena

# 部署应用
fly deploy

# 查看应用状态
fly status
```

## ⚙️ 配置说明

### fly.toml 主要配置

```toml
app = "werewolf-arena"
primary_region = "sjc"

[http_service]
  internal_port = 8000
  force_https = true
  min_machines_running = 0
  max_machines_running = 1
```

### 环境变量配置

在 fly.io 控制台或通过 CLI 设置环境变量：

```bash
# 设置基础环境变量
fly secrets set ENVIRONMENT=production
fly secrets set DEBUG=false
fly secrets set NODE_ENV=production

# 设置 LLM API 密钥（至少需要配置一个）
fly secrets set GLM_API_KEY=your-glm-api-key
fly secrets set OPENAI_API_KEY=your-openai-api-key
fly secrets set SILICONFLOW_API_KEY=your-siliconflow-api-key
```

## 🔧 自定义配置

### 修改应用名称

1. 编辑 `fly.toml` 文件，修改 `app` 字段
2. 或者在部署时指定：`fly launch --app your-app-name`

### 修改资源配置

在 `fly.toml` 中调整虚拟机配置：

```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
```

### 启用/禁用自动伸缩

```toml
[http_service]
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0  # 0 表示无访问时自动停止
  max_machines_running = 1  # 最大实例数
```

## 📊 监控和管理

### 查看应用状态

```bash
fly status              # 应用状态
fly apps list          # 应用列表
fly apps open          # 在浏览器中打开应用
```

### 查看日志

```bash
fly logs               # 实时日志
fly logs --since 1h    # 最近1小时的日志
```

### 管理密钥

```bash
fly secrets list       # 查看所有密钥
fly secrets set KEY=VALUE  # 设置密钥
fly secrets unset KEY      # 删除密钥
```

### 数据库/存储管理

```bash
fly volumes list werewolf-arena    # 查看存储卷
fly volumes create werewolf_logs  # 创建日志存储卷
```

## 🐛 故障排除

### 常见问题

1. **构建失败**
   - 检查 Dockerfile 是否存在
   - 确认 .dockerignore 配置正确
   - 查看构建日志：`fly deploy --verbose`

2. **应用无法启动**
   - 检查环境变量配置
   - 查看启动日志：`fly logs`
   - 确认端口配置正确（默认8000）

3. **健康检查失败**
   - 确认 `/health` 端点可访问
   - 检查应用启动时间
   - 调整健康检查配置

4. **LLM API 调用失败**
   - 验证 API 密钥是否正确设置
   - 检查 API 配额和限制
   - 查看应用日志了解具体错误

### 调试命令

```bash
# 进入容器调试
fly ssh console

# 查看容器内文件
fly ssh console -C "ls -la /app"

# 重启应用
fly apps restart werewolf-arena

# 重新部署
fly deploy --strategy immediate
```

## 📝 更新部署

### 更新应用代码

```bash
# 推送代码更改
git add .
git commit -m "Update application"
git push

# 重新部署
fly deploy
```

### 更新配置

```bash
# 更新 fly.toml 配置
fly deploy --config fly.toml

# 更新环境变量
fly secrets set NEW_KEY=new_value
```

## 🔒 安全建议

1. **密钥管理**
   - 使用 fly secrets 管理敏感信息
   - 不要在代码中硬编码 API 密钥
   - 定期轮换 API 密钥

2. **网络安全**
   - 启用 HTTPS（默认已启用）
   - 配置适当的 CORS 策略
   - 限制访问来源

3. **资源限制**
   - 设置合理的并发限制
   - 配置适当的内存和CPU限制
   - 监控资源使用情况

## 📚 相关文档

- [fly.io 官方文档](https://fly.io/docs/)
- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)

## 🆘 获取帮助

如果遇到问题，可以：

1. 查看 [fly.io 社区论坛](https://community.fly.io/)
2. 检查 GitHub Issues
3. 联系开发团队

---

**祝您部署顺利！🎉**