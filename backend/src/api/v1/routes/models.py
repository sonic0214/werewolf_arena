"""
模型API路由
Models API Routes
"""

from fastapi import APIRouter, HTTPException, status
import time

from src.api.v1.schemas.model import (
    ModelListResponse,
    ModelInfo,
    ModelTestRequest,
    ModelTestResponse,
)
from src.config.loader import ModelRegistry
from src.services.llm.client import LLMClient
from src.config.settings import settings

router = APIRouter()

# 初始化模型注册表和LLM客户端
model_registry = ModelRegistry()

# 延迟初始化LLM客户端（仅在需要时创建）
_llm_client = None

def get_llm_client() -> LLMClient:
    """获取或创建LLM客户端"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient.from_settings(settings)
    return _llm_client


@router.get("/", response_model=ModelListResponse)
async def list_models():
    """
    列出所有可用模型
    List all available LLM models
    """
    models = []

    for model_id, model_config in model_registry.models.items():
        models.append(ModelInfo(
            id=model_config.to_full_id(),
            alias=model_id,
            name=model_config.model_name,
            provider=model_config.provider,
            enabled=model_config.enabled,
            description=model_config.description or f"{model_config.provider.upper()} - {model_config.model_name}"
        ))

    return ModelListResponse(
        models=models,
        total=len(models)
    )


@router.get("/{model_alias}", response_model=ModelInfo)
async def get_model(model_alias: str):
    """
    获取特定模型信息
    Get information about a specific model
    """
    model_config = model_registry.get_model(model_alias)

    if not model_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_alias}' not found"
        )

    return ModelInfo(
        id=model_config.to_full_id(),
        alias=model_alias,
        name=model_config.model_name,
        provider=model_config.provider,
        enabled=model_config.enabled,
        description=model_config.description or f"{model_config.provider.upper()} - {model_config.model_name}"
    )


@router.post("/test", response_model=ModelTestResponse)
async def test_model(request: ModelTestRequest):
    """
    测试模型可用性
    Test if a model is accessible and working
    """
    try:
        # 获取LLM客户端
        llm_client = get_llm_client()

        # 记录开始时间
        start_time = time.time()

        # 调用LLM
        response = llm_client.call(
            model=request.model_id,
            prompt=request.prompt,
            temperature=request.temperature,
            json_mode=False
        )

        # 计算延迟
        latency_ms = (time.time() - start_time) * 1000

        return ModelTestResponse(
            model_id=request.model_id,
            success=True,
            response=response,
            error=None,
            latency_ms=round(latency_ms, 2)
        )

    except Exception as e:
        return ModelTestResponse(
            model_id=request.model_id,
            success=False,
            response=None,
            error=str(e),
            latency_ms=None
        )


@router.get("/providers/available")
async def get_available_providers():
    """
    获取可用的LLM提供商列表
    Get list of available LLM providers
    """
    from src.config.settings import settings

    providers = {
        "glm": {
            "name": "ZhipuAI GLM",
            "available": bool(settings.llm.glm_api_key),
            "base_url": settings.llm.glm_base_url
        },
        "openai": {
            "name": "OpenAI",
            "available": bool(settings.llm.openai_api_key),
            "base_url": settings.llm.openai_base_url
        },
        "openrouter": {
            "name": "OpenRouter",
            "available": bool(settings.llm.openrouter_api_key),
            "base_url": settings.llm.openrouter_base_url
        },
        "anthropic": {
            "name": "Anthropic",
            "available": bool(settings.llm.anthropic_api_key),
            "base_url": "https://api.anthropic.com"
        }
    }

    return {
        "providers": providers,
        "total": len(providers),
        "configured": sum(1 for p in providers.values() if p["available"])
    }
