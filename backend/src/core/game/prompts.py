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

GAME = """你正在玩一个社交推理游戏狼人杀（也叫天黑请闭眼）。

游戏规则：
- 角色分配：{{num_players}}名玩家 - 2个狼人，1个预言家，1个医生，{{num_villagers}}个村民。
- 回合包含两个阶段：
    - 夜晚阶段：狼人选择淘汰一名玩家。预言家查验一名玩家身份。医生保护一名玩家。如果无人被淘汰，说明医生成功保护了狼人的目标。
    - 白天阶段：玩家进行辩论并投票淘汰一名玩家。
- 胜利条件：村民通过投票淘汰所有狼人获胜。狼人数量超过村民时狼人获胜。

重要：请全程使用中文进行游戏互动和发言。"""

STATE = """游戏状态：
- 当前是第{{round}}轮。{% if round == 0 %}游戏刚刚开始。{% endif %}
- 你是{{name}}，身份是{{role}}。{{werewolf_context}}
{% if personality -%}
- 性格特点：{{ personality }}
{% endif -%}
- 剩余玩家：{{remaining_players}}"""

OBSERVATIONS = """{% if observations|length -%}你的私人观察记录：
{% for turn in observations -%}
{{ turn }}
{% endfor %}
{% endif %}"""

DEBATE_SO_FAR_THIS_ROUND = """\n第{{round}}轮辩论：
{% if debate|length -%}
{% for turn in debate -%}
{{ turn }}
{% endfor -%}
{% else -%}
辩论尚未开始。{% endif %}\n\n"""

PREFIX = f"""{GAME}

{STATE}

{OBSERVATIONS}
""".strip()

BIDDING = (
    PREFIX
    + DEBATE_SO_FAR_THIS_ROUND
    + """情境：为了获得下一个发言机会，你需要进行竞价。出价最高的玩家优先发言。
- 出价选项：
  0: 我想先观察和聆听。
  1: 我有一些基本想法想和大家分享。
  2: 我有重要且具体的内容要为这次讨论做出贡献。
  3: 我迫切需要立即发言。
  4: 有人直接提到了我，我必须回应。
- 你还有{{debate_turns_left}}次发言机会。

指令：
- 以{{name}}（{{role}}身份）进行战略思考。
- 只有在有重要内容要贡献时才优先发言。
- 平衡你的参与度，特别是如果你一直很活跃或异常沉默时。
{% if role == 'Werewolf' -%}
- 决定是否要巧妙地引导对话向混乱和不信任发展，在村民中播下怀疑的种子，或转移对你和同伴的怀疑。
- 沉默可以是强大的策略，但缺乏参与也可能引起怀疑。
{% else -%}
- 如果讨论重复或偏离主题，准备将其引向更战略的方向。
- 如果你受到怀疑或讨论直接涉及你的角色，你应该优先发言。
- 战略性地分享信息和提出指控，但要意识到这样做可能让你成为目标。
{% endif %}

重要：请用中文进行所有发言和推理。

严格注意：你的回答必须完全是中文，JSON中的所有字符串值都必须是中文内容，不允许使用任何英文。

```json
{
"reasoning": "string",  // 现在参与讨论的重要性如何？用一两句话解释你的推理。避免使用暴力或有害语言。
"bid": "string" // 根据你的推理出价。从以下数字中选择一个："0" | "1" | "2" | "3" | "4"
}"
"""
)

BIDDING_SCHEMA = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "bid": {"type": "string"},
    },
    "required": ["reasoning", "bid"],
}

DEBATE = PREFIX + DEBATE_SO_FAR_THIS_ROUND + """指令：
- 轮到你以{{name}}（{{role}}身份）进行辩论发言。
- 你对发言的想法：{{bidding_rationale}}
{% if role == 'Werewolf' -%}
- 你的目标是制造混乱并避免被发现。
- 在村民中播下怀疑的种子，让他们相互猜疑。
- 将对话从你自己和其他狼人身上引开。
- 在破坏村民努力的同时表现出帮助的样子。
- 欺骗是你最强大的武器。例如，你可以声称有特殊身份并错误地指控村民，或捏造不一致之处来制造混乱。谨慎使用这些强大的策略以避免怀疑。
{% else -%}
- 你的目标是找出狼人并保护村庄。
- 仔细审查每一个指控，揭露不一致之处，并指出可疑行为或异常沉默的玩家。不要害怕大胆指控！
- 强调团队合作并提议找出狼人的策略。共同努力将是识别狼人的关键。
{% if role == 'Villager' -%}
- 如果有人声称自己是预言家或医生，试着用你所知的信息来证实他们的说法。
{% elif role in ['Seer', 'Doctor'] -%}
- 分享你的身份可能很有力，但也会让你成为目标。两难选择：继续秘密帮助村庄，还是揭示只有你拥有的信息以获得更大的影响？明智地选择你的时机。
{% endif -%}
{% endif %}

重要：请用中文进行发言和推理。

严格注意：你的回答必须完全是中文，JSON中的所有字符串值都必须是中文内容，不允许使用任何英文。

```json
{
  "reasoning": "string", // 基于游戏当前状态和你角色的目标，概述你的策略。你想实现什么？什么样的信息可以帮助你达到目标？避免使用暴力或有害语言。
  "say": "string" // 你在辩论中的公开声明。要简洁且有说服力。直接回应其他玩家所说的话。避免简单重复别人的话或复述上述指令。请用中文发言。
}
"""

DEBATE_SCHEMA = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "say": {"type": "string"},
    },
    "required": ["reasoning", "say"],
}

VOTE = PREFIX + DEBATE_SO_FAR_THIS_ROUND + """指令：
- 以{{name}}（{{role}}身份）进行战略思考，决定投票淘汰谁。
- 你的投票不会向其他玩家透露，将保持私密。
- 仔细审查指控，分析行为，并考虑之前的模式。
{% if role == 'Werewolf' -%}
- 针对破坏你计划的村民，特别是那些似乎有影响力、可能是医生或预言家，或对你和你的狼人同伴构成威胁的玩家。
- 如果村民开始怀疑他们中的一个，加入怀疑的行列，投票淘汰已经面临怀疑的不幸村民。
{% else -%}
- 要找出可能的狼人，寻找他们故事中的不一致之处、试图推卸责任的行为、在其他村民中制造不和的倾向，或异常沉默的玩家。
{% endif -%}
- 你必须选择一个人。

重要：请用中文进行推理。

严格注意：你的回答必须完全是中文，JSON中的所有字符串值都必须是中文内容，不允许使用任何英文。

```json
{
  "reasoning": "string", // 解释你投票淘汰谁的理由。避免使用暴力或有害语言。
  "vote": "string" // 玩家姓名。从以下选项中选择：{{options}}
}"""

VOTE_SCHEMA = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "vote": {"type": "string"},
    },
    "required": ["reasoning", "vote"],
}

INVESTIGATE = PREFIX + """指令：
- 现在是第{{round}}轮的夜晚阶段。作为{{name}}（{{role}}身份），选择最可疑的玩家进行调查。
{% if round == 0 -%}
- 第一轮没有可用信息，请随机选择某人。
{% else -%}
- 寻找偏离典型村民行为的行为。
- 重点关注有影响力的玩家。
- 你必须选择一个人。
{% endif %}

重要：请用中文进行推理。

严格注意：你的回答必须完全是中文，JSON中的所有字符串值都必须是中文内容，不允许使用任何英文。

```json
{
"reasoning": "string", // 分析证据并证明你选择调查谁的决定是合理的。
"investigate": "string" // 玩家姓名。从以下选项中选择：{{options}}
}
"""

INVESTIGATE_SCHEMA = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "investigate": {"type": "string"},
    },
    "required": ["reasoning", "investigate"],
}

ELIMINATE = PREFIX + """指令：
- 现在是第{{round}}轮的夜晚阶段。作为{{name}}（{{role}}身份），选择最具战略性的玩家进行淘汰。
{% if round == 0 -%}
- 第一轮没有可用信息，请随机选择某人。
{% else -%}
- 分析指控并识别威胁你匿名身份的有影响力的村民。
- 考虑玩家的行为和淘汰他们的风险。
- 你必须选择一个人。
{% endif %}

重要：请用中文进行推理。

严格注意：你的回答必须完全是中文，JSON中的所有字符串值都必须是中文内容，不允许使用任何英文。

```json
{
"reasoning": "string", // 逐步解释你想要从游戏中淘汰谁的理由以及为什么。避免使用暴力或有害语言。
"remove": "string" // 玩家姓名。从以下选项中选择：{{options}}
}
"""

ELIMINATE_SCHEMA = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "remove": {"type": "string"},
    },
    "required": ["reasoning", "remove"],
}

PROTECT = PREFIX + """指令：
- 现在是第{{round}}轮的夜晚阶段。作为{{name}}（{{role}}身份），选择最脆弱的玩家进行保护。
{% if round == 0 -%}
- 第一轮没有可用信息，请随机选择某人。
{% else -%}
- 考虑狼人可能针对谁。
- 优先保护有关键角色的玩家，如预言家和你自己。
- 你必须选择一个人。
{% endif %}

重要：请用中文进行推理。

严格注意：你的回答必须完全是中文，JSON中的所有字符串值都必须是中文内容，不允许使用任何英文。

```json
{
"reasoning": "string", // 分析证据并证明你选择保护谁的决定是合理的。
"protect": "string" // 玩家姓名。从以下选项中选择：{{options}}
}
"""

PROTECT_SCHEMA = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "protect": {"type": "string"},
    },
    "required": ["reasoning", "protect"],
}

SUMMARIZE = PREFIX + DEBATE_SO_FAR_THIS_ROUND + """指令：
- 以{{name}}（{{role}}身份）反思本轮的辩论。
- 总结关键要点和战略含义。
{% if role == 'Werewolf' -%}
- 关注针对你和你的盟友的指控。
- 识别有同情心或容易受影响的玩家。
- 确定可能淘汰的关键角色。
{% else -%}
- 当玩家做出重要声明或分享信息时，仔细考虑其可信度。这是否与你已知的信息一致？
- 分析他人如何参与辩论。他们的话语中是否有矛盾？他们行为背后的隐藏动机？异常沉默的玩家？
- 基于辩论，你能否识别潜在的盟友、可信任的玩家，或可能是预言家或医生的人？
{% endif %}

重要：请用中文进行总结和推理。

严格注意：你的回答必须完全是中文，JSON中的所有字符串值都必须是中文内容，不允许使用任何英文。

```json
{
"reasoning": "string", // 关于你应该记住这次辩论中什么以及为什么这些信息很重要的推理。
"summary": "string" // 用几句话总结辩论中的关键要点和值得注意的观察。尽量对尽可能多的玩家做记录——即使是看似微不足道的细节也可能在后续轮次中变得相关。要具体。记住，你是{{name}}。以他们的视角写总结，使用"我"和"我的"。请用中文总结。
} """

SUMMARIZE_SCHEMA = {
    "type": "object",
    "properties": {
        "reasoning": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": ["reasoning", "summary"],
}

ACTION_PROMPTS_AND_SCHEMAS = {
    "bid": (BIDDING, BIDDING_SCHEMA),
    "debate": (DEBATE, DEBATE_SCHEMA),
    "vote": (VOTE, VOTE_SCHEMA),
    "investigate": (INVESTIGATE, INVESTIGATE_SCHEMA),
    "remove": (ELIMINATE, ELIMINATE_SCHEMA),
    "protect": (PROTECT, PROTECT_SCHEMA),
    "summarize": (SUMMARIZE, SUMMARIZE_SCHEMA),
}