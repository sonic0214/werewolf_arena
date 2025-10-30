# 狼人杀游戏配置文件
# Werewolf Arena Configuration File

# 游戏基础配置 / Game Basic Configuration
NUM_PLAYERS = 6                    # 玩家数量 / Number of players
MAX_DEBATE_TURNS = 2               # 每轮最大辩论次数 / Maximum debate turns per round
DEFAULT_THREADS = 5                # 默认线程数 / Default number of threads for parallel processing
RETRIES = 3                        # API调用失败重试次数 / Number of retries for failed API calls

# 前端刷新配置 / Frontend Refresh Configuration
FRONTEND_REFRESH_INTERVAL = 2000   # 前端刷新间隔（毫秒）/ Frontend refresh interval in milliseconds
STANDARD_REFRESH_INTERVAL = 1500   # 标准页面刷新间隔（毫秒）/ Standard page refresh interval in milliseconds

# 游戏规则配置 / Game Rules Configuration
RUN_SYNTHETIC_VOTES = True         # 是否运行合成投票 / Whether to run synthetic votes

# 玩家名称池 / Player Name Pool
NAMES = [
    "Derek", "Scott", "Jacob", "Isaac", "Hayley", "David", "Tyler",
    "Ginger", "Jackson", "Mason", "Dan", "Bert", "Will", "Sam",
    "Paul", "Leah", "Harold"
]  # 著名狼人杀角色名称 / Names of famous Werewolves according to Wikipedia

# 性能优化说明 / Performance Optimization Notes:
# - 增加线程数可以提升模型调用的并行度，但会消耗更多API资源
# - 减少辩论次数可以显著加快游戏速度，但可能影响游戏质量
# - 根据你的API限制和性能需求调整这些参数

# Performance Optimization Notes:
# - Increasing threads improves parallel model calls but consumes more API resources
# - Reducing debate turns significantly speeds up the game but may affect quality
# - Adjust these parameters based on your API limits and performance requirements