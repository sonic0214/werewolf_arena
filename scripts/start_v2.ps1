# 🌟 启动 Werewolf Arena v2.0 - 现代版本
Write-Host "======================================"  -ForegroundColor Cyan
Write-Host "🌟 启动 Werewolf Arena v2.0" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

# 检查当前目录
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ 错误：请在项目根目录下运行此脚本" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 环境检查通过" -ForegroundColor Green

# 检查虚拟环境
if (-not (Test-Path "venv")) {
    Write-Host "⚠️  未找到虚拟环境，正在创建..." -ForegroundColor Yellow
    python -m venv venv
}

# 启动后端
Write-Host "`n🖥️  启动 FastAPI 后端服务..." -ForegroundColor Cyan
Set-Location backend

# 检查环境变量文件
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  未找到 .env 文件，正在复制模板..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ 已创建 .env 文件，请编辑填入API密钥" -ForegroundColor Green
    }
}

# 激活虚拟环境并安装依赖
Write-Host "📦 安装后端依赖..." -ForegroundColor Cyan
& ..\venv\Scripts\Activate.ps1
pip install -q -r requirements.txt

# 检查端口8000是否被占用
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "⚠️  端口8000已被占用，正在尝试关闭占用进程..." -ForegroundColor Yellow
    $processId = $port8000.OwningProcess
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
}

# 启动后端服务（后台运行）
Write-Host "🚀 启动后端服务 (端口 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; ..\venv\Scripts\Activate.ps1; python -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal

Set-Location ..

# 等待后端启动
Write-Host "⏳ 等待后端服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 检查后端是否启动成功
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ FastAPI 后端服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️  后端服务可能需要更多时间启动，请稍后访问 http://localhost:8000/health 检查" -ForegroundColor Yellow
}

# 启动前端
Write-Host "`n🌐 启动 Next.js 前端服务..." -ForegroundColor Cyan
Set-Location frontend

# 检查端口3000是否被占用
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  端口3000已被占用，正在尝试关闭占用进程..." -ForegroundColor Yellow
    $processId = $port3000.OwningProcess
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
}

# 检查并安装前端依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装前端依赖..." -ForegroundColor Cyan
    npm install
}

# 启动前端服务（后台运行）
Write-Host "🚀 启动前端服务 (端口 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Set-Location ..

# 等待前端启动
Write-Host "⏳ 等待前端服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 检查前端是否启动成功
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Next.js 前端服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️  前端服务可能需要更多时间启动，请稍后访问 http://localhost:3000 检查" -ForegroundColor Yellow
}

Write-Host "`n======================================"  -ForegroundColor Cyan
Write-Host "✨ 服务启动完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🌐 前端界面: http://localhost:3000" -ForegroundColor White
Write-Host "🔧 API文档: http://localhost:8000/docs" -ForegroundColor White
Write-Host "❤️  健康检查: http://localhost:8000/health" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`n💡 提示：两个新的PowerShell窗口已打开，用于运行后端和前端服务" -ForegroundColor Yellow
Write-Host "💡 按 Ctrl+C 可在各自窗口中停止服务" -ForegroundColor Yellow
