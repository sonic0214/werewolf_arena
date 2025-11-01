"""
FastAPI主应用
FastAPI Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path

from src.config import settings
from src.services.llm.client import LLMClient
from src.services.llm.generator import set_global_llm_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    print("🚀 Starting Werewolf Arena API...")
    print(f"📝 Environment: {settings.environment}")
    print(f"🔧 Debug mode: {settings.debug}")

    # 初始化全局LLM客户端
    try:
        llm_client = LLMClient.from_settings(settings)
        set_global_llm_client(llm_client)

        # 检查LLM提供商健康状态
        health_status = llm_client.health_check()
        print(f"🤖 LLM Providers Health: {health_status}")

        print("✅ Global LLM client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize LLM client: {e}")
        print("⚠️  Game functionality will be limited")

    print("🎮 Ready to start games!")

    yield

    # 关闭时
    print("🛑 Shutting down Werewolf Arena API...")


# 创建FastAPI应用
app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="LLM-based Werewolf Game Framework API",
    lifespan=lifespan,
    debug=settings.debug,
)

# CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.allow_origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=settings.cors.allow_methods,
    allow_headers=settings.cors.allow_headers,
)


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Werewolf Arena API",
        "version": settings.version,
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "version": settings.version
    }


# 静态文件服务
static_dir = Path("/app/static")
if static_dir.exists():
    # 挂载Next.js构建的静态文件
    app.mount("/_next", StaticFiles(directory=static_dir / ".next" / "_next"), name="_next")
    app.mount("/static", StaticFiles(directory=static_dir / "public"), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """提供前端页面服务"""
        # 检查是否是API请求
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return None  # 让FastAPI处理API路由

        # 返回Next.js的主页面
        index_file = static_dir / ".next" / "server.js"  # Next.js standalone模式
        if index_file.exists():
            return FileResponse(static_dir / ".next" / "server.js")
        else:
            # 如果没有server.js，尝试返回HTML文件
            html_file = static_dir / ".next" / "index.html"
            if html_file.exists():
                return FileResponse(html_file)
            else:
                # 最后的备选方案
                return FileResponse(static_dir / "public" / "index.html")

# 注册API路由
from src.api.v1.routes import games, status, models, timing, websocket, logs

app.include_router(games.router, prefix="/api/v1/games", tags=["Games"])
app.include_router(status.router, prefix="/api/v1/status", tags=["Status"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Models"])
app.include_router(timing.router, prefix="/api/v1/config", tags=["Timing Configuration"])
app.include_router(logs.router, prefix="/api/v1/games", tags=["Logs"])
app.include_router(websocket.router, tags=["WebSocket"])
