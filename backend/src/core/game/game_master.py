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

"""Werewolf game."""

from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import random
from typing import List, Optional, Callable

import tqdm
import time

from src.core.models.game_state import Round, State
from src.core.models.logs import RoundLog, VoteLog
from src.config.settings import MAX_DEBATE_TURNS, RUN_SYNTHETIC_VOTES
from src.config.settings import settings
from src.config.timing_loader import apply_game_mode, get_delay

def get_max_bids(d):
  """Gets all the keys with the highest value in the dictionary."""
  max_value = max(d.values())
  max_keys = [key for key, value in d.items() if value == max_value]
  return max_keys


class GameMaster:

  def __init__(
      self,
      state: State,
      num_threads: int = 1,
      on_progress: Optional[Callable[[State, List[RoundLog]], None]] = None,
      game_mode: str = "normal",  # normal, fast, slow, demo
  ) -> None:
    """Initialize the Werewolf game.

    Args:
      state: 游戏状态
      num_threads: 线程数
      on_progress: 进度回调函数
      game_mode: 游戏模式，影响延迟速度
    """
    self.state = state
    self.current_round_num = len(self.state.rounds) if self.state.rounds else 0
    self.num_threads = num_threads
    self.logs: List[RoundLog] = []
    self.on_progress = on_progress
    self.should_stop = False  # 添加停止标志

    # 应用游戏模式延迟倍数
    self.delay_multiplier = apply_game_mode(game_mode)
    self.game_mode = game_mode
    print(f"🎮 游戏模式: {game_mode} (延迟倍数: {self.delay_multiplier}x)")

  def _progress(self) -> None:
    if self.on_progress:
      self.on_progress(self.state, self.logs)

  @property
  def this_round(self) -> Round:
    return self.state.rounds[self.current_round_num]

  @property
  def this_round_log(self) -> RoundLog:
    return self.logs[self.current_round_num]

  def eliminate(self):
    """Werewolves choose a player to eliminate."""
    # 添加夜间行动延迟（使用配置文件）
    delay = get_delay("night_action", self.delay_multiplier)
    time.sleep(delay)

    werewolves_alive = [
        w for w in self.state.werewolves if w.name in self.this_round.players
    ]

    if not werewolves_alive:
      raise ValueError("No werewolves alive to eliminate players.")

    wolf = random.choice(werewolves_alive)
    eliminated, log = wolf.eliminate()
    self.this_round_log.eliminate = log

    # 如果返回None，选择一个默认目标
    if eliminated is None:
      available_targets = [
          p for p in self.this_round.players
          if p != wolf.name and p not in [w.name for w in self.state.werewolves]
      ]
      if available_targets:
        eliminated = random.choice(available_targets)
        print(f"Warning: {wolf.name} failed to choose target, randomly selected {eliminated}")
        # 更新日志以反映随机选择
        log.result = {"remove": eliminated, "reasoning": "Random fallback selection"}
      else:
        # 如果没有有效目标，跳过淘汰
        print(f"Warning: No valid targets for {wolf.name} to eliminate")
        eliminated = None

    if eliminated is not None:
      self.this_round.eliminated = eliminated
      tqdm.tqdm.write(f"{wolf.name} eliminated {eliminated}")
      for wolf in werewolves_alive:
        wolf._add_observation(
            "During the"
            f" night, {'we' if len(werewolves_alive) > 1 else 'I'} decided to"
            f" eliminate {eliminated}."
        )
    else:
      print(f"No player was eliminated this round")
    self._progress()

  def protect(self):
    """Doctor chooses a player to protect."""
    if self.state.doctor.name not in self.this_round.players:
      return  # Doctor no longer in the game

    # 添加夜间行动延迟（使用配置文件）
    delay = get_delay("night_action", self.delay_multiplier)
    time.sleep(delay)

    protect, log = self.state.doctor.save()
    self.this_round_log.protect = log

    if protect is None:
      # 如果没有返回保护目标，随机选择一个
      available_targets = list(self.this_round.players)
      if available_targets:
        protect = random.choice(available_targets)
        print(f"Warning: {self.state.doctor.name} failed to choose protection target, randomly selected {protect}")
        # 更新日志
        log.result = {"protect": protect, "reasoning": "Random fallback selection"}
      else:
        print(f"Warning: No players available for {self.state.doctor.name} to protect")
        protect = None

    if protect is not None:
      self.this_round.protected = protect
      tqdm.tqdm.write(f"{self.state.doctor.name} protected {protect}")
    else:
      print(f"No player was protected this round")
    self._progress()

  def unmask(self):
    """Seer chooses a player to unmask."""
    if self.state.seer.name not in self.this_round.players:
      return  # Seer no longer in the game

    # 添加夜间行动延迟（使用配置文件）
    delay = get_delay("night_action", self.delay_multiplier)
    time.sleep(delay)

    unmask, log = self.state.seer.unmask()
    self.this_round_log.investigate = log

    if unmask is None:
      # 如果没有返回调查目标，随机选择一个未调查过的玩家
      available_targets = [
          p for p in self.this_round.players
          if p != self.state.seer.name and p not in self.state.seer.previously_unmasked.keys()
      ]
      if available_targets:
        unmask = random.choice(available_targets)
        print(f"Warning: {self.state.seer.name} failed to choose investigation target, randomly selected {unmask}")
        # 更新日志
        log.result = {"investigate": unmask, "reasoning": "Random fallback selection"}
      else:
        print(f"Warning: No available targets for {self.state.seer.name} to investigate")
        unmask = None

    if unmask is not None:
      self.this_round.unmasked = unmask
      self.state.seer.reveal_and_update(unmask, self.state.players[unmask].role)
    else:
      print(f"No player was investigated this round")
    self._progress()

  def _get_bid(self, player_name):
    """Gets the bid for a specific player."""
    player = self.state.players[player_name]
    try:
      bid, log = player.bid()
      if bid is None:
        # 如果出价为空，使用默认出价并记录警告
        print(f"Warning: {player_name} did not return a valid bid, using default")
        bid = 1
        log = f"Default bid used due to empty response"
    except Exception as e:
      # 如果出价过程出错，使用默认出价并记录错误
      print(f"Error during bidding for {player_name}: {e}")
      bid = 1
      log = f"Error: {str(e)}"

    if bid > 1:
      tqdm.tqdm.write(f"{player_name} bid: {bid}")
    return bid, log

  def get_next_speaker(self):
    """Determine the next speaker based on bids."""
    previous_speaker, previous_dialogue = (
        self.this_round.debate[-1] if self.this_round.debate else (None, None)
    )

    with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
      player_bids = {
          player_name: executor.submit(self._get_bid, player_name)
          for player_name in self.this_round.players
          if player_name != previous_speaker
      }

      bid_log = []
      bids = {}
      try:
        for player_name, bid_task in player_bids.items():
          bid, log = bid_task.result()
          bids[player_name] = bid
          bid_log.append((player_name, log))
      except TypeError as e:
        print(e)
        raise e

    self.this_round.bids.append(bids)
    self.this_round_log.bid.append(bid_log)

    potential_speakers = get_max_bids(bids)
    # Prioritize mentioned speakers if there's previous dialogue
    if previous_dialogue:
      potential_speakers.extend(
          [name for name in potential_speakers if name in previous_dialogue]
      )

    random.shuffle(potential_speakers)
    return random.choice(potential_speakers)

  def run_summaries(self):
    """Collect summaries from players after the debate."""

    with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
      player_summaries = {
          name: executor.submit(self.state.players[name].summarize)
          for name in self.this_round.players
      }

      for player_name, summary_task in player_summaries.items():
        try:
            summary, log = summary_task.result()
            if summary is None:
                # 如果总结为空，使用默认总结并记录警告
                print(f"Warning: {player_name} did not return a valid summary, using default")
                summary = "I need to think about what happened today and analyze the situation carefully."
                log = f"Default summary used due to empty response"
            tqdm.tqdm.write(f"{player_name} summary: {summary}")
            self.this_round_log.summaries.append((player_name, log))
        except Exception as e:
            # 如果总结过程出错，使用默认总结并记录错误
            print(f"Error during summary for {player_name}: {e}")
            summary = "I need to think about what happened today and analyze the situation carefully."
            log = f"Error: {str(e)}"
            tqdm.tqdm.write(f"{player_name} summary: {summary}")
            self.this_round_log.summaries.append((player_name, log))

            # 添加总结延迟（使用配置文件）
            delay = get_delay("summary", self.delay_multiplier)
            time.sleep(delay)

        self._progress()

  def run_day_phase(self):
    """Run the day phase which consists of the debate and voting."""

    for idx in range(MAX_DEBATE_TURNS):
      next_speaker = self.get_next_speaker()
      if not next_speaker:
        raise ValueError("get_next_speaker did not return a valid player.")

      player = self.state.players[next_speaker]
      try:
        dialogue, log = player.debate()
        if dialogue is None:
          # 如果发言为空，使用默认发言并记录警告
          print(f"Warning: {next_speaker} did not return a valid dialogue, using default")
          dialogue = f"I think we need to be careful and look for clues."
          log = f"Default dialogue used due to empty response"
      except Exception as e:
        # 如果发言过程出错，使用默认发言并记录错误
        print(f"Error during debate for {next_speaker}: {e}")
        dialogue = f"I think we need to be careful and look for clues."
        log = f"Error: {str(e)}"

      self.this_round_log.debate.append((next_speaker, log))
      self.this_round.debate.append([next_speaker, dialogue])
      tqdm.tqdm.write(f"{next_speaker} ({player.role}): {dialogue}")

      # 添加辩论延迟（使用配置文件）
      delay = get_delay("debate", self.delay_multiplier)
      time.sleep(delay)

      self._progress()

      for name in self.this_round.players:
        player = self.state.players[name]
        if player.gamestate:
          player.gamestate.update_debate(next_speaker, dialogue)
        else:
          raise ValueError(f"{name}.gamestate needs to be initialized.")

      if idx == MAX_DEBATE_TURNS - 1 or RUN_SYNTHETIC_VOTES:
        votes, vote_logs = self.run_voting()
        self.this_round.votes.append(votes)
        self.this_round_log.votes.append(vote_logs)
        self._progress()

    for player, vote in self.this_round.votes[-1].items():
      tqdm.tqdm.write(f"{player} voted to remove {vote}")

  def run_voting(self):
    """Conduct a vote among players to exile someone."""
    vote_log = []
    votes = {}

    with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
      player_votes = {
          name: executor.submit(self.state.players[name].vote)
          for name in self.this_round.players
      }

      for player_name, vote_task in player_votes.items():
        try:
          vote, log = vote_task.result()
          vote_log.append(VoteLog(player_name, vote, log))

          if vote is not None:
            # 验证投票是否是有效的玩家名
            if vote in self.this_round.players:
              votes[player_name] = vote
            else:
              # 如果投票无效，记录警告但继续
              print(f"Warning: {player_name} voted for invalid player '{vote}', skipping vote")
              # 安全地选择一个默认玩家
              default_target = next((p for p in self.this_round.players if p and p != player_name), player_name)
              votes[player_name] = default_target
          else:
            # 如果没有返回投票，记录警告但继续
            print(f"Warning: {player_name} did not return a valid vote, skipping")
            # 安全地选择一个默认玩家
            default_target = next((p for p in self.this_round.players if p and p != player_name), player_name)
            votes[player_name] = default_target
        except Exception as e:
          # 如果投票过程出错，记录错误但继续
          print(f"Error during voting for {player_name}: {e}")
          # 安全地选择一个默认玩家
          default_target = next((p for p in self.this_round.players if p and p != player_name), player_name)
          votes[player_name] = default_target
          # 创建一个空的日志条目
          vote_log.append(VoteLog(player_name, default_target, f"Error: {str(e)}"))

    return votes, vote_log

  def exile(self):
    """Exile the player who received the most votes."""

    most_voted, vote_count = Counter(
        self.this_round.votes[-1].values()
    ).most_common(1)[0]

    if vote_count > len(self.this_round.players) / 2:
      self.this_round.exiled = most_voted

    if self.this_round.exiled is not None:
      exiled_player = self.this_round.exiled
      # 安全地从玩家列表中移除被流放的玩家
      if exiled_player in self.this_round.players:
        self.this_round.players.remove(exiled_player)
        announcement = (
            f"The majority voted to remove {exiled_player} from the game."
        )
      else:
        print(f"Warning: Exiled player {exiled_player} not found in players list")
        announcement = f"No valid player was exiled (target: {exiled_player})."
    else:
      announcement = (
          "A majority vote was not reached, so no one was removed from the"
          " game."
      )

    # 只有在真正流放时才从游戏状态中移除玩家
    if self.this_round.exiled is not None and self.this_round.exiled in self.state.players:
      for name in self.this_round.players:
        player = self.state.players[name]
        if player.gamestate:
          player.gamestate.remove_player(self.this_round.exiled)
        player.add_announcement(announcement)
    else:
      # 如果没有流放，仍然需要通知所有玩家
      for name in self.this_round.players:
        player = self.state.players[name]
        player.add_announcement(announcement)

    tqdm.tqdm.write(announcement)
    self._progress()

  def resolve_night_phase(self):
    """Resolve elimination and protection during the night phase."""
    if self.this_round.eliminated != self.this_round.protected:
      eliminated_player = self.this_round.eliminated

      # 安全地从玩家列表中移除被淘汰的玩家
      if eliminated_player in self.this_round.players:
        self.this_round.players.remove(eliminated_player)
        announcement = (
            f"The Werewolves removed {eliminated_player} from the game during the"
            " night."
        )
      else:
        print(f"Warning: Eliminated player {eliminated_player} not found in players list")
        announcement = f"No valid player was removed during the night (target: {eliminated_player})."

      # 只有在真正淘汰时才从游戏状态中移除玩家
      for name in self.this_round.players:
        player = self.state.players[name]
        if player.gamestate:
          player.gamestate.remove_player(eliminated_player)
        player.add_announcement(announcement)
    else:
      announcement = "No one was removed from the game during the night (Doctor's protection succeeded)."
      # 保护成功时，不移除任何玩家，但需要更新游戏状态
      for name in self.this_round.players:
        player = self.state.players[name]
        player.add_announcement(announcement)

    tqdm.tqdm.write(announcement)
    self._progress()

  def run_round(self):
    """Run a single round of the game."""
    self.state.rounds.append(Round())
    self.logs.append(RoundLog())

    self.this_round.players = (
        list(self.state.players.keys())
        if self.current_round_num == 0
        else self.state.rounds[self.current_round_num - 1].players.copy()
    )

    for action, message in [
        (
            self.eliminate,
            "The Werewolves are picking someone to remove from the game.",
        ),
        (self.protect, "The Doctor is protecting someone."),
        (self.unmask, "The Seer is investigating someone."),
        (self.resolve_night_phase, ""),
        (self.check_for_winner, "Checking for a winner after Night Phase."),
        (self.run_day_phase, "The Players are debating and voting."),
        (self.exile, ""),
        (self.check_for_winner, "Checking for a winner after Day Phase."),
        (self.run_summaries, "The Players are summarizing the debate."),
    ]:
      tqdm.tqdm.write(message)
      action()
      # Save progress after each major action in the round
      self._progress()

      if self.state.winner:
        tqdm.tqdm.write(f"Round {self.current_round_num} is complete.")
        self.this_round.success = True
        return

    tqdm.tqdm.write(f"Round {self.current_round_num} is complete.")
    self.this_round.success = True
    self._progress()

  def get_winner(self) -> str:
    """Determine the winner of the game."""
    active_wolves = set(self.this_round.players) & set(
        w.name for w in self.state.werewolves
    )
    active_villagers = set(self.this_round.players) - active_wolves
    if len(active_wolves) >= len(active_villagers):
      return "Werewolves"
    return "Villagers" if not active_wolves else ""

  def check_for_winner(self):
    """Check if there is a winner and update the state accordingly."""
    self.state.winner = self.get_winner()
    if self.state.winner:
      tqdm.tqdm.write(f"The winner is {self.state.winner}!")
      self._progress()

  def stop(self):
    """设置停止标志，让游戏优雅终止"""
    self.should_stop = True
    tqdm.tqdm.write("Game stop requested, will finish current round and exit gracefully.")

  def run_game(self) -> str:
    """Run the entire Werewolf game and return the winner."""
    while not self.state.winner and not self.should_stop:
      tqdm.tqdm.write(f"STARTING ROUND: {self.current_round_num}")
      self.run_round()

      # 检查是否在轮次之间收到停止信号
      if self.should_stop:
        tqdm.tqdm.write("Game stopped by user request between rounds.")
        self.state.winner = "Game Stopped"
        break

      for name in self.this_round.players:
        if self.state.players[name].gamestate:
          self.state.players[name].gamestate.round_number = (
              self.current_round_num + 1
          )
          self.state.players[name].gamestate.clear_debate()
      self.current_round_num += 1

    if self.should_stop:
      tqdm.tqdm.write("Game stopped by user request!")
    else:
      tqdm.tqdm.write("Game is complete!")
    return self.state.winner
