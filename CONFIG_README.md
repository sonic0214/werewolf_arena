# 游戏配置说明 / Game Configuration Guide

## 概述 / Overview

本项目使用 `game_config.py` 文件来管理游戏参数，让你可以轻松调整游戏设置而无需修改代码。

This project uses the `game_config.py` file to manage game parameters, allowing you to easily adjust game settings without modifying the code.

## 配置文件位置 / Configuration File Location

配置文件位于项目根目录：`game_config.py`

The configuration file is located in the project root directory: `game_config.py`

## 主要配置项 / Main Configuration Options

### 性能相关配置 / Performance-Related Settings

- **`DEFAULT_THREADS = 5`** - 默认线程数
  - 影响模型调用的并行度
  - 增加此值可以提升性能，但会消耗更多API资源
  - 建议范围：1-10

- **`MAX_DEBATE_TURNS = 2`** - 每轮最大辩论次数
  - 减少此值可以显著加快游戏速度
  - 原值为8，调整为2后速度提升约4倍
  - 建议范围：2-6

### 游戏基础配置 / Game Basic Settings

- **`NUM_PLAYERS = 6`** - 玩家数量
- **`RETRIES = 3`** - API调用失败重试次数
- **`RUN_SYNTHETIC_VOTES = True`** - 是否运行合成投票

## 修改配置 / Modifying Configuration

1. 打开 `game_config.py` 文件
2. 修改相应的配置值
3. 保存文件
4. 重新运行游戏

1. Open the `game_config.py` file
2. Modify the corresponding configuration values
3. Save the file
4. Restart the game

## 性能优化建议 / Performance Optimization Tips

### 快速游戏模式 / Fast Game Mode
```python
DEFAULT_THREADS = 8
MAX_DEBATE_TURNS = 2
```

### 平衡模式 / Balanced Mode
```python
DEFAULT_THREADS = 5
MAX_DEBATE_TURNS = 4
```

### 高质量模式 / High Quality Mode
```python
DEFAULT_THREADS = 3
MAX_DEBATE_TURNS = 6
```

## 注意事项 / Important Notes

- 线程数过多可能导致API限流
- 辩论次数过少可能影响游戏逻辑
- 修改配置后需要重启游戏才能生效
- 如果配置文件不存在，系统会使用默认值

- Too many threads may cause API rate limiting
- Too few debate turns may affect game logic
- Configuration changes require game restart to take effect
- Default values will be used if the configuration file doesn't exist

## 故障排除 / Troubleshooting

如果看到警告信息 "Warning: game_config.py not found"，请确保：
1. `game_config.py` 文件存在于项目根目录
2. 文件内容格式正确

If you see the warning "Warning: game_config.py not found", please ensure:
1. The `game_config.py` file exists in the project root directory
2. The file content format is correct