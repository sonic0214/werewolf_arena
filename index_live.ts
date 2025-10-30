/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface LiveMessage {
  id: string;
  timestamp: string;
  player: string;
  type: 'night' | 'bid' | 'debate' | 'vote' | 'summary' | 'system';
  content: string;
  reasoning?: string;
  data?: any;
}

interface PlayerInfo {
  name: string;
  role: string;
  avatar: string;
  status: 'alive' | 'dead' | 'thinking';
  model: string;
}

interface GameStats {
  aliveCount: number;
  eliminatedCount: number;
  currentRound: number;
  currentPhase: 'night' | 'day';
}

class WerewolfLiveStream {
  url: URLSearchParams;
  sessionId: string;
  data: any;
  messages: LiveMessage[] = [];
  players: Map<string, PlayerInfo> = new Map();
  stats: GameStats = {
    aliveCount: 6,
    eliminatedCount: 0,
    currentRound: 0,
    currentPhase: 'night'
  };
  currentTime: Date = new Date();
  isLive: boolean = true;

  constructor() {
    this.url = new URLSearchParams(window.location.search);
    this.sessionId = this.url.get('session_id') || '';
    if (this.sessionId.length == 0) throw new Error('No session specified');

    this.initializeEventListeners();
    this.startClock();
  }

  initializeEventListeners() {
    // 关闭调试面板
    const closeDebugBtn = document.getElementById('close-debug');
    if (closeDebugBtn) {
      closeDebugBtn.addEventListener('click', () => {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) debugPanel.classList.add('hidden');
      });
    }

    // 点击消息显示调试信息
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const messageElement = target.closest('.chat-message');
      if (messageElement) {
        const messageId = messageElement.getAttribute('data-message-id');
        if (messageId) {
          this.showDebugInfo(messageId);
        }
      }
    });
  }

  startClock() {
    // 更新时间显示
    setInterval(() => {
      this.currentTime = new Date();
      this.updateTimeDisplay();
    }, 1000);
  }

  updateTimeDisplay() {
    const timeElement = document.getElementById('game-time');
    if (timeElement) {
      timeElement.textContent = this.formatTime(this.currentTime);
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  async retrieveData() {
    try {
      // 获取游戏日志
      const logsResponse = await fetch(`/logs/${this.sessionId}/game_logs.json`);
      const logs = await logsResponse.json();

      // 获取游戏状态
      let stateResponse = await fetch(`/logs/${this.sessionId}/game_complete.json`);
      if (stateResponse.status === 404) {
        stateResponse = await fetch(`/logs/${this.sessionId}/game_partial.json`);
      }
      const state = await stateResponse.json();

      this.data = { logs, state };
      this.processGameData(logs, state);
    } catch (error) {
      console.error('Failed to retrieve game data:', error);
      this.addSystemMessage('无法加载游戏数据');
    }
  }

  processGameData(logs: any[], state: any) {
    // 检查游戏是否已完成
    if (state.winner && this.messages.length > 0) {
      // 游戏已完成且已有消息，不再处理
      return;
    }

    // 初始化玩家信息
    this.initializePlayers(state);

    // 保存旧的消息数量用于比较
    const oldMessageCount = this.messages.length;

    // 生成直播消息流
    this.generateLiveMessages(logs, state);

    // 只有当消息有变化时才更新界面
    if (this.messages.length !== oldMessageCount) {
      this.updateUI();
    }

    // 如果游戏完成，添加完成消息
    if (state.winner && !this.messages.some(m => m.content.includes('游戏结束'))) {
      this.addSystemMessage(`🎉 游戏结束！获胜者：${state.winner}`);
      this.updateUI();
    }
  }

  initializePlayers(state: any) {
    this.players.clear();

    // 处理所有玩家
    for (const [name, playerData] of Object.entries(state.players)) {
      const player = playerData as any;
      this.players.set(name, {
        name: player.name,
        role: player.role,
        avatar: `static/${name}.png`,
        status: 'alive',
        model: player.model || 'Unknown'
      });
    }

    this.updatePlayersList();
  }

  generateLiveMessages(logs: any[], state: any) {
    // 如果已有消息且游戏未完成，不重新生成
    if (this.messages.length > 0 && !state.winner) {
      return;
    }

    // 只有在首次加载或游戏完成时才重新生成
    if (this.messages.length === 0 || state.winner) {
      this.messages = [];
      let currentTime = new Date();
      currentTime.setHours(14, 30, 0, 0); // 从14:30开始

      for (let round = 0; round < logs.length; round++) {
        const roundLog = logs[round];
        this.stats.currentRound = round;

        // 夜间阶段
        this.stats.currentPhase = 'night';
        this.updatePhaseDisplay();

        // 处理夜间行动
        if (roundLog.eliminate) {
          currentTime = this.addMinutes(currentTime, 1);
          const eliminated = roundLog.eliminate.result?.remove;
          if (eliminated && this.players.has(eliminated)) {
            const player = this.players.get(eliminated);
            if (player) player.status = 'dead';
          }
          this.addNightMessage(currentTime, 'Werewolf', `击杀目标：${eliminated || '未知'}`, roundLog.eliminate);
        }

        if (roundLog.protect) {
          currentTime = this.addMinutes(currentTime, 1);
          this.addNightMessage(currentTime, 'Doctor', `保护目标：${roundLog.protect.result?.protect || '未知'}`, roundLog.protect);
        }

        if (roundLog.investigate) {
          currentTime = this.addMinutes(currentTime, 1);
          this.addNightMessage(currentTime, 'Seer', `查验目标：${roundLog.investigate.result?.investigate || '未知'}`, roundLog.investigate);
        }

        // 天亮公告
        currentTime = this.addMinutes(currentTime, 2);
        this.stats.currentPhase = 'day';
        this.updatePhaseDisplay();
        this.addSystemMessage(`天亮了！昨晚${roundLog.eliminated ? roundLog.eliminated + '被淘汰了' : '是平安夜'}`, currentTime);

        // 白天阶段 - 竞拍发言权
        if (roundLog.bid && Array.isArray(roundLog.bid)) {
          for (let turn = 0; turn < roundLog.bid.length; turn++) {
            const bidTurn = roundLog.bid[turn];
            if (Array.isArray(bidTurn)) {
              for (const [name, bidData] of bidTurn) {
                currentTime = this.addMinutes(currentTime, 2);
                this.addBidMessage(currentTime, name, bidData);
              }
            }
            currentTime = this.addMinutes(currentTime, 1);
          }
        }

        // 辩论发言
        if (roundLog.debate && Array.isArray(roundLog.debate)) {
          for (const [name, debateData] of roundLog.debate) {
            currentTime = this.addMinutes(currentTime, 3);
            this.addDebateMessage(currentTime, name, debateData);
          }
        }

        // 投票阶段
        if (roundLog.votes && roundLog.votes.length > 0) {
          currentTime = this.addMinutes(currentTime, 2);
          this.addSystemMessage('开始投票', currentTime);

          const finalVotes = roundLog.votes[roundLog.votes.length - 1];
          for (const vote of finalVotes) {
            currentTime = this.addMinutes(currentTime, 1);
            this.addVoteMessage(currentTime, vote.player, vote.log);
          }

          // 显示投票结果
          currentTime = this.addMinutes(currentTime, 2);
          this.displayVotingResults(finalVotes, currentTime);

          // 更新玩家状态（投票淘汰）
          this.updatePlayerStatusFromVotes(finalVotes);
        }

        // 总结发言
        if (roundLog.summaries && Array.isArray(roundLog.summaries)) {
          for (const [name, summaryData] of roundLog.summaries) {
            currentTime = this.addMinutes(currentTime, 3);
            this.addSummaryMessage(currentTime, name, summaryData);
          }
        }
      }
    }
  }

  addMinutes(date: Date, minutes: number): Date {
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  }

  addNightMessage(timestamp: Date, player: string, content: string, data: any) {
    const role = this.getRoleByPlayer(player);
    const message: LiveMessage = {
      id: `night_${timestamp.getTime()}`,
      timestamp: this.formatTime(timestamp),
      player: role || player,
      type: 'night',
      content: `🌙 夜间行动：${content}`,
      data
    };
    this.messages.push(message);
  }

  addBidMessage(timestamp: Date, player: string, data: any) {
    const message: LiveMessage = {
      id: `bid_${timestamp.getTime()}`,
      timestamp: this.formatTime(timestamp),
      player,
      type: 'bid',
      content: `💰 竞拍发言权：出价 ${data.result?.bid || 0}`,
      reasoning: data.result?.reasoning,
      data
    };
    this.messages.push(message);
  }

  addDebateMessage(timestamp: Date, player: string, data: any) {
    const message: LiveMessage = {
      id: `debate_${timestamp.getTime()}`,
      timestamp: this.formatTime(timestamp),
      player,
      type: 'debate',
      content: `🗣️ 发言：${data.result?.say || ''}`,
      reasoning: data.result?.reasoning,
      data
    };
    this.messages.push(message);
  }

  addVoteMessage(timestamp: Date, player: string, data: any) {
    const message: LiveMessage = {
      id: `vote_${timestamp.getTime()}`,
      timestamp: this.formatTime(timestamp),
      player,
      type: 'vote',
      content: `🗳️ 投票给：${data.result?.vote || '未知'}`,
      data
    };
    this.messages.push(message);
  }

  addSummaryMessage(timestamp: Date, player: string, data: any) {
    const message: LiveMessage = {
      id: `summary_${timestamp.getTime()}`,
      timestamp: this.formatTime(timestamp),
      player,
      type: 'summary',
      content: `📝 总结：${data.result?.summary || ''}`,
      reasoning: data.result?.reasoning,
      data
    };
    this.messages.push(message);
  }

  addSystemMessage(content: string, timestamp?: Date) {
    const message: LiveMessage = {
      id: `system_${Date.now()}`,
      timestamp: timestamp ? this.formatTime(timestamp) : this.formatTime(new Date()),
      player: '系统',
      type: 'system',
      content: `📢 ${content}`
    };
    this.messages.push(message);
  }

  getRoleByPlayer(playerName: string): string | null {
    if (!this.data?.state) return null;

    const state = this.data.state;
    if (state.doctor?.name === playerName) return 'Doctor';
    if (state.seer?.name === playerName) return 'Seer';
    if (state.werewolves?.some((w: any) => w.name === playerName)) return 'Werewolf';

    return null;
  }

  updatePlayerStatusFromVotes(votes: any[]) {
    // 统计投票结果
    const voteCount: { [key: string]: number } = {};
    votes.forEach((vote) => {
      const target = vote.log?.result?.vote || 'unknown';
      if (target !== 'unknown') {
        voteCount[target] = (voteCount[target] || 0) + 1;
      }
    });

    // 找出得票最多的玩家
    const maxVotes = Math.max(...Object.values(voteCount));
    const mostVotedPlayers = Object.entries(voteCount)
      .filter(([_, count]) => count === maxVotes)
      .map(([player, _]) => player);

    // 如果有玩家被投票淘汰，更新状态
    if (mostVotedPlayers.length === 1 && maxVotes > 0) {
      const eliminated = mostVotedPlayers[0];
      const player = this.players.get(eliminated);
      if (player) {
        player.status = 'dead';
      }
    }
  }

  updateUI() {
    this.renderMessages();
    this.updateStats();
  }

  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // 检查是否已有消息，如果有就不再重新渲染
    if (container.children.length > 0) {
      // 只添加新消息
      const lastMessageId = container.lastElementChild?.getAttribute('data-message-id');
      const lastRenderedIndex = this.messages.findIndex(m => m.id === lastMessageId);

      if (lastRenderedIndex !== -1 && lastRenderedIndex < this.messages.length - 1) {
        // 只添加新消息
        for (let i = lastRenderedIndex + 1; i < this.messages.length; i++) {
          setTimeout(() => {
            this.addMessageToUI(this.messages[i]);
            this.scrollToBottom();
          }, (i - lastRenderedIndex) * 100);
        }
        return;
      }
    }

    // 首次渲染所有消息
    container.innerHTML = '';
    this.messages.forEach((message, index) => {
      setTimeout(() => {
        this.addMessageToUI(message);
        this.scrollToBottom();
      }, index * 100);
    });
  }

  addMessageToUI(message: LiveMessage) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.setAttribute('data-message-id', message.id);

    const playerInfo = this.players.get(message.player);
    const avatarSrc = (playerInfo?.avatar && playerInfo.avatar !== 'static/null.png') ? playerInfo.avatar : 'static/default.png';

    messageElement.innerHTML = `
      <div class="message-time">${message.timestamp}</div>
      <div class="message-content">
        <img class="message-avatar" src="${avatarSrc}" alt="${message.player}"
             onerror="this.src='data:image/svg+xml;base64,${btoa(this.generateAvatarSVG(message.player))}'">
        <div class="message-body">
          <div class="message-header">
            <span class="message-player">${message.player}</span>
            <span class="message-type ${message.type}">${this.getTypeDisplayName(message.type)}</span>
          </div>
          <div class="message-text">${message.content}</div>
          ${message.reasoning ? `<div class="message-reasoning">💭 ${message.reasoning}</div>` : ''}
        </div>
      </div>
    `;

    container.appendChild(messageElement);
  }

  generateAvatarSVG(name: string): string {
    const colors = ['#dc3545', '#28a745', '#007bff', '#ffc107', '#6f42c1', '#fd7e14'];
    const colorIndex = name.charCodeAt(0) % colors.length;

    return `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${colors[colorIndex]}"/>
        <text x="20" y="27" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${name.charAt(0).toUpperCase()}</text>
      </svg>
    `;
  }

  getTypeDisplayName(type: string): string {
    const typeNames: { [key: string]: string } = {
      'night': '夜间',
      'bid': '竞拍',
      'debate': '发言',
      'vote': '投票',
      'summary': '总结',
      'system': '系统'
    };
    return typeNames[type] || type;
  }

  updatePlayersList() {
    const container = document.getElementById('players-list');
    if (!container) return;

    container.innerHTML = '';

    this.players.forEach((player) => {
      const playerElement = document.createElement('div');
      playerElement.className = 'player-item';

      const avatarSrc = player.avatar && player.avatar !== 'static/null.png' ? player.avatar : 'static/default.png';

      playerElement.innerHTML = `
        <img class="player-avatar" src="${avatarSrc}" alt="${player.name}"
             onerror="this.src='data:image/svg+xml;base64,${btoa(this.generateAvatarSVG(player.name))}'">
        <div class="player-info">
          <div class="player-name">${player.name}</div>
          <div class="player-status ${player.status}">${this.getRoleDisplayName(player.role)} • ${player.status === 'alive' ? '存活' : '淘汰'}</div>
        </div>
      `;

      container.appendChild(playerElement);
    });
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'Werewolf': '狼人',
      'Seer': '预言家',
      'Doctor': '医生',
      'Villager': '村民'
    };
    return roleNames[role] || role;
  }

  updateStats() {
    const aliveCount = document.getElementById('alive-count');
    const eliminatedCount = document.getElementById('eliminated-count');

    // 根据实际玩家状态计算统计数据
    const totalPlayers = this.players.size;
    const alivePlayers = Array.from(this.players.values()).filter(player => player.status === 'alive').length;
    const eliminatedPlayers = totalPlayers - alivePlayers;

    // 更新统计数据
    this.stats.aliveCount = alivePlayers;
    this.stats.eliminatedCount = eliminatedPlayers;

    if (aliveCount) aliveCount.textContent = alivePlayers.toString();
    if (eliminatedCount) eliminatedCount.textContent = eliminatedPlayers.toString();

    // 同时更新玩家列表显示
    this.updatePlayersList();
  }

  updatePhaseDisplay() {
    const phaseElement = document.getElementById('current-phase');
    if (!phaseElement) return;

    const phaseIcon = phaseElement.querySelector('.phase-icon');
    const phaseText = phaseElement.querySelector('.phase-text');

    if (phaseIcon && phaseText) {
      phaseIcon.textContent = this.stats.currentPhase === 'night' ? '🌙' : '☀️';
      phaseText.textContent = `第${this.stats.currentRound}轮 - ${this.stats.currentPhase === 'night' ? '夜间' : '白天'}阶段`;
    }
  }

  displayVotingResults(votes: any[], timestamp: Date) {
    // 统计投票结果
    const voteCount: { [key: string]: number } = {};
    const totalVotes = votes.length;

    votes.forEach((vote) => {
      const target = vote.log?.result?.vote || 'unknown';
      voteCount[target] = (voteCount[target] || 0) + 1;
    });

    // 显示投票结果
    const resultMessage = `📊 投票结果：${Object.entries(voteCount)
      .map(([target, count]) => `${target} (${count}票)`)
      .join(', ')}`;

    this.addSystemMessage(resultMessage, timestamp);

    // 在右侧面板显示详细统计
    this.showVotingChart(voteCount, totalVotes);
  }

  showVotingChart(voteCount: { [key: string]: number }, totalVotes: number) {
    const chartContainer = document.getElementById('vote-chart');
    const votingPanel = document.getElementById('voting-results');

    if (!chartContainer || !votingPanel) return;

    votingPanel.classList.remove('hidden');
    chartContainer.innerHTML = '';

    Object.entries(voteCount).forEach(([target, count]) => {
      const percentage = (count / totalVotes) * 100;

      const voteItem = document.createElement('div');
      voteItem.className = 'vote-item';
      voteItem.innerHTML = `
        <div style="width: 60px; font-size: 12px; color: #f1f5f9;">${target}</div>
        <div class="vote-bar" style="width: ${percentage}%"></div>
        <div class="vote-count">${count}</div>
      `;

      chartContainer.appendChild(voteItem);
    });
  }

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      // 使用平滑滚动
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  showDebugInfo(messageId: string) {
    const message = this.messages.find(m => m.id === messageId);
    if (!message || !message.data) return;

    const debugPanel = document.getElementById('debug-panel');
    const debugContent = document.getElementById('debug-content');

    if (!debugPanel || !debugContent) return;

    debugContent.innerHTML = `
      <h4>消息调试信息</h4>
      <p><strong>ID:</strong> ${message.id}</p>
      <p><strong>时间:</strong> ${message.timestamp}</p>
      <p><strong>玩家:</strong> ${message.player}</p>
      <p><strong>类型:</strong> ${message.type}</p>
      <p><strong>内容:</strong> ${message.content}</p>
      ${message.reasoning ? `<p><strong>推理:</strong> ${message.reasoning}</p>` : ''}
      <details style="margin-top: 16px;">
        <summary style="cursor: pointer; color: #93c5fd;">查看原始数据</summary>
        <pre style="background: #0f1419; padding: 12px; border-radius: 8px; margin-top: 8px; font-size: 12px; overflow-x: auto;">
${JSON.stringify(message.data, null, 2)}
        </pre>
      </details>
    `;

    debugPanel.classList.remove('hidden');
  }
}

// 初始化直播流
let liveStream: WerewolfLiveStream;

document.addEventListener('DOMContentLoaded', () => {
  try {
    liveStream = new WerewolfLiveStream();

    // 设置游戏会话ID
    const sessionElement = document.getElementById('game-session');
    if (sessionElement) {
      sessionElement.textContent = liveStream.sessionId;
    }

    // 加载游戏数据
    liveStream.retrieveData();

    // 定期更新（模拟实时），但检查游戏是否已结束
    setInterval(() => {
      if (liveStream.data?.state?.winner) {
        // 游戏已结束，停止更新
        return;
      }
      liveStream.retrieveData();
    }, 5000);

  } catch (error) {
    console.error('Failed to initialize live stream:', error);
    document.body.innerHTML = '<div style="color: white; text-align: center; margin-top: 100px;">加载失败，请检查游戏会话ID是否正确</div>';
  }
});