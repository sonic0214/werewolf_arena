# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import random
import os
import sys

# 添加项目根目录到路径，以便导入配置文件
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from game_config import (
        RETRIES, NAMES, RUN_SYNTHETIC_VOTES,
        MAX_DEBATE_TURNS, NUM_PLAYERS, DEFAULT_THREADS
    )
except ImportError:
    # 如果配置文件不存在，使用默认值
    print("Warning: game_config.py not found, using default values")
    RETRIES = 3
    NAMES = [
        "Derek", "Scott", "Jacob", "Isaac", "Hayley", "David", "Tyler",
        "Ginger", "Jackson", "Mason", "Dan", "Bert", "Will", "Sam",
        "Paul", "Leah", "Harold"
    ]
    RUN_SYNTHETIC_VOTES = True
    MAX_DEBATE_TURNS = 2
    NUM_PLAYERS = 6
    DEFAULT_THREADS = 5

def get_player_names():
    return random.sample(NAMES, NUM_PLAYERS)