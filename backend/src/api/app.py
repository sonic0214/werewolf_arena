"""
FastAPI主应用
FastAPI Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    print("🚀 Starting Werewolf Arena API...")
    print(f"📝 Environment: {settings.environment}")
    print(f"🔧 Debug mode: {settings.debug}")

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


# 注册API路由
from src.api.v1.routes import games, status, models

app.include_router(games.router, prefix="/api/v1/games", tags=["Games"])
app.include_router(status.router, prefix="/api/v1/status", tags=["Status"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Models"])
