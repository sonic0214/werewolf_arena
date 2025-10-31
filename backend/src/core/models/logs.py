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
日志数据模型
Log Data Models
"""

import dataclasses
from typing import Any, Dict, List, Optional, Tuple

from src.utils.helpers import Deserializable


@dataclasses.dataclass
class LmLog(Deserializable):
    """LLM调用日志"""
    prompt: str
    raw_resp: str
    result: Any

    @classmethod
    def from_json(cls, data: Dict[Any, Any]):
        return cls(**data)


class VoteLog(Deserializable):
    """投票日志"""

    def __init__(self, player: str, voted_for: str, log: LmLog):
        self.player = player
        self.voted_for = voted_for
        self.log = log

    def to_dict(self):
        from .game_state import to_dict
        return to_dict(self)

    @classmethod
    def from_json(cls, data: Dict[Any, Any]):
        player = data.get("player", None)
        voted_for = data.get("voted_for", None)
        log = LmLog.from_json(data.get("log", None))
        return cls(player, voted_for, log)


class RoundLog(Deserializable):
    """回合日志

    Attributes:
        eliminate: 狼人淘汰行动的日志
        investigate: 预言家调查行动的日志
        protect: 医生保护行动的日志
        bid: 竞价日志（二维列表）
        debate: 辩论日志列表
        votes: 投票日志列表
        summaries: 总结日志列表
    """

    def __init__(self):
        self.eliminate: Optional[LmLog] = None
        self.investigate: Optional[LmLog] = None
        self.protect: Optional[LmLog] = None
        self.bid: List[List[Tuple[str, LmLog]]] = []
        self.debate: List[Tuple[str, LmLog]] = []
        self.votes: List[List[VoteLog]] = []
        self.summaries: List[Tuple[str, LmLog]] = []

    def to_dict(self):
        from .game_state import to_dict
        return to_dict(self)

    @classmethod
    def from_json(cls, data: Dict[Any, Any]):
        o = cls()

        eliminate = data.get("eliminate", None)
        investigate = data.get("investigate", None)
        protect = data.get("protect", None)

        if eliminate:
            o.eliminate = LmLog.from_json(eliminate)
        if investigate:
            o.investigate = LmLog.from_json(investigate)
        if protect:
            o.protect = LmLog.from_json(protect)

        for votes in data.get("votes", []):
            v_logs = []
            o.votes.append(v_logs)
            for v in votes:
                v_logs.append(VoteLog.from_json(v))

        for r in data.get("bid", []):
            r_logs = []
            o.bid.append(r_logs)
            for player in r:
                r_logs.append((player[0], LmLog.from_json(player[1])))

        for player in data.get("debate", []):
            o.debate.append((player[0], LmLog.from_json(player[1])))

        for player in data.get("summaries", []):
            o.summaries.append((player[0], LmLog.from_json(player[1])))

        return o
