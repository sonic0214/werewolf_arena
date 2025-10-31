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

"""
游戏状态数据模型
Game State Data Models
"""

import enum
import json
from typing import Any, Dict, List, Optional, Tuple, Union

from src.utils.helpers import Deserializable


# JSON serializer that works for nested classes
class JsonEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, enum.Enum):
            return o.value
        if isinstance(o, set):
            return list(o)
        return o.__dict__


def to_dict(o: Any) -> Union[Dict[str, Any], List[Any], Any]:
    """将对象转换为字典（用于JSON序列化）"""
    return json.loads(JsonEncoder().encode(o))


class GameView:
    """玩家视角的游戏状态

    每个玩家都有自己的GameView，包含他们可见的信息。
    """

    def __init__(
        self,
        round_number: int,
        current_players: List[str],
        other_wolf: Optional[str] = None,
    ):
        self.round_number: int = round_number
        self.current_players: List[str] = current_players
        self.debate: List[Tuple[str, str]] = []
        self.other_wolf: Optional[str] = other_wolf

    def update_debate(self, author: str, dialogue: str):
        """添加一条辩论记录"""
        self.debate.append((author, dialogue))

    def clear_debate(self):
        """清空辩论记录"""
        self.debate.clear()

    def remove_player(self, player_to_remove: str):
        """从当前玩家列表中移除一名玩家"""
        if player_to_remove not in self.current_players:
            print(
                f"Player {player_to_remove} not in current players:"
                f" {self.current_players}"
            )
            return  # 如果玩家不在列表中，直接返回而不尝试移除
        self.current_players.remove(player_to_remove)

    def to_dict(self) -> Any:
        return to_dict(self)

    @classmethod
    def from_json(cls, data: Dict[Any, Any]):
        return cls(**data)


class Round(Deserializable):
    """游戏回合

    Attributes:
        players: 本回合存活的玩家列表
        eliminated: 狼人在夜晚淘汰的玩家
        unmasked: 预言家在夜晚调查的玩家
        protected: 医生在夜晚保护的玩家
        exiled: 白天投票放逐的玩家
        debate: 辩论记录（玩家名和发言内容）
        votes: 投票记录列表
        bids: 竞价记录列表
        success: 回合是否成功完成
    """

    def __init__(self):
        self.players: List[str] = []
        self.eliminated: Optional[str] = None
        self.unmasked: Optional[str] = None
        self.protected: Optional[str] = None
        self.exiled: Optional[str] = None
        self.debate: List[Tuple[str, str]] = []
        self.votes: List[Dict[str, str]] = []
        self.bids: List[Dict[str, int]] = []
        self.success: bool = False

    def to_dict(self):
        return to_dict(self)

    @classmethod
    def from_json(cls, data: Dict[Any, Any]):
        o = cls()
        o.players = data["players"]
        o.eliminated = data.get("eliminated", None)
        o.unmasked = data.get("unmasked", None)
        o.protected = data.get("protected", None)
        o.exiled = data.get("exiled", None)
        o.debate = data.get("debate", [])
        o.votes = data.get("votes", [])
        o.bids = data.get("bids", [])
        o.success = data.get("success", False)
        return o


class State(Deserializable):
    """游戏会话状态

    Attributes:
        session_id: 会话唯一标识符
        players: 所有玩家字典（玩家名 -> Player对象）
        seer: 预言家玩家
        doctor: 医生玩家
        villagers: 村民玩家列表
        werewolves: 狼人玩家列表
        rounds: 回合列表
        error_message: 错误信息（如果游戏失败）
        winner: 获胜方（"Villagers" 或 "Werewolves"）
    """

    def __init__(
        self,
        session_id: str,
        seer: "Seer",  # type: ignore  # Forward reference
        doctor: "Doctor",  # type: ignore  # Forward reference
        villagers: List["Villager"],  # type: ignore  # Forward reference
        werewolves: List["Werewolf"],  # type: ignore  # Forward reference
    ):
        self.session_id: str = session_id
        self.seer = seer
        self.doctor = doctor
        self.villagers = villagers
        self.werewolves = werewolves
        self.players: Dict[str, Any] = {
            player.name: player
            for player in self.villagers
            + self.werewolves
            + [self.doctor, self.seer]
        }
        self.rounds: List[Round] = []
        self.error_message: str = ""
        self.winner: str = ""

    def to_dict(self):
        return to_dict(self)

    @classmethod
    def from_json(cls, data: Dict[Any, Any]):
        # 延迟导入以避免循环依赖
        from .player import Werewolf, Villager, Doctor, Seer

        werewolves = []
        for w in data.get("werewolves", []):
            werewolves.append(Werewolf.from_json(w))

        villagers = []
        for v in data.get("villagers", []):
            villagers.append(Villager.from_json(v))

        doctor = Doctor.from_json(data.get("doctor"))
        seer = Seer.from_json(data.get("seer"))

        players = {}
        for p in werewolves + villagers + [doctor, seer]:
            players[p.name] = p

        o = cls(
            data.get("session_id", ""),
            seer,
            doctor,
            villagers,
            werewolves,
        )
        rounds = []
        for r in data.get("rounds", []):
            rounds.append(Round.from_json(r))

        o.rounds = rounds
        o.error_message = data.get("error_message", "")
        o.winner = data.get("winner", "")
        return o
