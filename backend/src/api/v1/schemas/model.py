"""
模型相关的Pydantic Schemas
Model-related Pydantic Schemas for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ModelInfo(BaseModel):
    """模型信息"""
    id: str = Field(..., description="模型完整ID")
    alias: str = Field(..., description="模型别名")
    name: str = Field(..., description="模型显示名称")
    provider: str = Field(..., description="提供商: openai, glm, openrouter, anthropic")
    enabled: bool = Field(True, description="是否启用")
    description: Optional[str] = Field(None, description="模型描述")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "glm/GLM-Z1-Flash",
                "alias": "glmz1-flash",
                "provider": "glm",
                "enabled": True,
                "description": "GLM Z1 Flash Model"
            }
        }


class ModelListResponse(BaseModel):
    """模型列表响应"""
    models: List[ModelInfo] = Field(..., description="可用模型列表")
    total: int = Field(..., description="模型总数")

    class Config:
        json_schema_extra = {
            "example": {
                "models": [
                    {
                        "id": "glm/GLM-Z1-Flash",
                        "alias": "glmz1-flash",
                        "provider": "glm",
                        "enabled": True,
                        "description": "GLM Z1 Flash Model"
                    }
                ],
                "total": 1
            }
        }


class ModelTestRequest(BaseModel):
    """模型测试请求"""
    model_config = {
        "protected_namespaces": (),  # 允许model_开头的字段
        "json_schema_extra": {
            "example": {
                "model_id": "glm/GLM-Z1-Flash",
                "prompt": "Hello, how are you?",
                "temperature": 0.7
            }
        }
    }

    model_id: str = Field(..., description="要测试的模型ID")
    prompt: str = Field("Hello, how are you?", description="测试提示词")
    temperature: Optional[float] = Field(0.7, description="温度参数", ge=0.0, le=2.0)


class ModelTestResponse(BaseModel):
    """模型测试响应"""
    model_config = {
        "protected_namespaces": (),  # 允许model_开头的字段
        "json_schema_extra": {
            "example": {
                "model_id": "glm/GLM-Z1-Flash",
                "success": True,
                "response": "I'm doing well, thank you!",
                "error": None,
                "latency_ms": 850.5
            }
        }
    }

    model_id: str = Field(..., description="模型ID")
    success: bool = Field(..., description="是否成功")
    response: Optional[str] = Field(None, description="模型响应")
    error: Optional[str] = Field(None, description="错误信息")
    latency_ms: Optional[float] = Field(None, description="响应延迟(毫秒)")
