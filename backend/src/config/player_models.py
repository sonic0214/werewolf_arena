"""
玩家模型映射配置
Player Model Mapping Configuration
"""

# 玩家模型名到完整模型ID的一对一映射
PLAYER_MODEL_MAPPING = {
    "MiniMax-M1-80k": "MiniMaxAI/MiniMax-M1-80k",
    "GLM-4.6": "THUDM/GLM-Z1-9B-0414",
    "Qwen3-32B": "siliconflow/Qwen/Qwen3-32B",
    "DeepSeek-V3.2": "siliconflow/deepseek-ai/DeepSeek-V3.2-Exp",
    "Kimi-Dev-72B": "siliconflow/moonshotai/Kimi-Dev-72B",
    "Ring-flash-2.0": "inclusionAI/Ling-mini-2.0"
}

def get_model_for_player(player_name: str, role: str = None) -> str:
    """
    根据玩家名称（模型名）获取对应的完整模型ID

    Args:
        player_name: 玩家名称（即模型名）
        role: 玩家角色 (可选，用于兼容性)

    Returns:
        完整的模型名称
    """
    # 从映射中查找对应的完整模型ID
    if player_name in PLAYER_MODEL_MAPPING:
        return PLAYER_MODEL_MAPPING[player_name]

    # 如果没有找到映射，返回默认模型（兼容性处理）
    return "MiniMaxAI/MiniMax-M1-80k"

def get_player_model_mapping(player_names: list[str]) -> dict[str, str]:
    """
    为玩家列表生成模型映射

    Args:
        player_names: 玩家名称列表（即模型名列表）

    Returns:
        玩家名称到完整模型ID的字典映射
    """
    return {name: get_model_for_player(name) for name in player_names}