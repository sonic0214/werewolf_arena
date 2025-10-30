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
class WerewolfLiveStream {
    constructor() {
        this.messages = [];
        this.players = new Map();
        this.stats = {
            aliveCount: 0,
            eliminatedCount: 0,
            currentRound: 0,
            currentPhase: 'night'
        };
        this.currentTime = new Date();
        this.isLive = true;
        this.url = new URLSearchParams(window.location.search);
        this.sessionId = this.url.get('session_id') || '';
        this.lastDataHash = null; // 用于检测数据变化
        this.gameStatus = 'unknown'; // 游戏状态: unknown, running, stopping, stopped, completed, error
        if (this.sessionId.length == 0)
            throw new Error('No session specified');
        this.initializeEventListeners();
        this.startClock();
        this.startGameStatusPolling(); // 开始轮询游戏状态
    }
    initializeEventListeners() {
        // 关闭调试面板
        const closeDebugBtn = document.getElementById('close-debug');
        if (closeDebugBtn) {
            closeDebugBtn.addEventListener('click', () => {
                const debugPanel = document.getElementById('debug-panel');
                if (debugPanel)
                    debugPanel.classList.add('hidden');
            });
        }

        // 游戏控制按钮事件
        const stopBtn = document.getElementById('stop-game-btn');
        const restartBtn = document.getElementById('restart-game-btn');

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopGame();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        // 点击消息显示调试信息
        document.addEventListener('click', (e) => {
            const target = e.target;
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
    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    async retrieveData() {
        try {
            console.log(`[${new Date().toISOString()}] Retrieving data for session: ${this.sessionId}`);

            // 获取游戏日志
            const logsResponse = await fetch(`/logs/${this.sessionId}/game_logs.json`);
            if (!logsResponse.ok) {
                throw new Error(`Failed to fetch logs: ${logsResponse.status}`);
            }
            const logs = await logsResponse.json();
            console.log(`[${new Date().toISOString()}] Retrieved ${logs.length} rounds of logs`);

            // 获取游戏状态
            let stateResponse = await fetch(`/logs/${this.sessionId}/game_complete.json`);
            let stateType = 'complete';
            if (stateResponse.status === 404) {
                stateResponse = await fetch(`/logs/${this.sessionId}/game_partial.json`);
                stateType = 'partial';
            }
            if (!stateResponse.ok) {
                throw new Error(`Failed to fetch state: ${stateResponse.status}`);
            }
            const state = await stateResponse.json();
            console.log(`[${new Date().toISOString()}] Retrieved ${stateType} state, winner: ${state.winner || 'none'}`);

            // 暂时禁用数据哈希检查，直接处理所有数据
            // const currentDataHash = this.calculateDataHash(logs, state);
            // if (this.lastDataHash === currentDataHash) {
            //     console.log(`[${new Date().toISOString()}] Data unchanged, skipping processing`);
            //     return;
            // }
            // console.log(`[${new Date().toISOString()}] Data changed (hash: ${this.lastDataHash} -> ${currentDataHash})`);
            // this.lastDataHash = currentDataHash;

            this.data = { logs, state };
            this.processGameData(logs, state);
        }
        catch (error) {
            console.error('Failed to retrieve game data:', error);
            this.addSystemMessage('无法加载游戏数据');
        }
    }

    calculateDataHash(logs, state) {
        // 简单的哈希函数来检测数据变化 - 不使用时间戳
        const dataStr = JSON.stringify({
            roundsCount: logs.length,
            winner: state.winner,
            lastLogContent: logs.length > 0 ? JSON.stringify(logs[logs.length - 1]).slice(0, 100) : ''
        });
        return btoa(dataStr).slice(0, 16);
    }

    safeBase64Encode(str) {
        try {
            // 首先尝试直接编码
            return btoa(str);
        } catch (e) {
            // 如果失败，使用UTF-8编码
            return btoa(unescape(encodeURIComponent(str)));
        }
    }
    processGameData(logs, state) {
        // 初始化玩家信息（每次都更新以获取最新状态）
        this.initializePlayers(state);
        // 保存旧的消息数量用于比较
        const oldMessageCount = this.messages.length;

        console.log(`[${new Date().toISOString()}] Processing game data: old messages=${oldMessageCount}, new logs=${logs.length}`);

        // 生成直播消息流
        this.generateLiveMessages(logs, state);

        console.log(`[${new Date().toISOString()}] Generated ${this.messages.length} messages (was ${oldMessageCount})`);

        // 只有当消息有变化时才更新界面
        if (this.messages.length !== oldMessageCount) {
            console.log(`[${new Date().toISOString()}] Updating UI - new messages available`);
            this.updateUI();
        } else {
            console.log(`[${new Date().toISOString()}] No UI update - same number of messages`);
        }

        // 如果游戏完成，添加完成消息
        if (state.winner && !this.messages.some(m => m.content.includes('游戏结束'))) {
            console.log(`[${new Date().toISOString()}] Game completed! Winner: ${state.winner}`);
            this.addSystemMessage(`🎉 游戏结束！获胜者：${state.winner}`);
            this.updateUI();
        }
    }
    initializePlayers(state) {
        // 先从游戏状态中获取所有玩家的初始信息
        this.players.clear();

        // 收集所有被淘汰的玩家（从 state.rounds 中获取）
        const eliminatedPlayers = new Set();
        if (state.rounds && Array.isArray(state.rounds)) {
            for (const round of state.rounds) {
                if (round.eliminated) {
                    eliminatedPlayers.add(round.eliminated);
                }
                if (round.exiled) {
                    eliminatedPlayers.add(round.exiled);
                }
            }
        }

        let aliveCount = 0;
        let eliminatedCount = 0;

        // 处理所有玩家
        for (const [name, playerData] of Object.entries(state.players)) {
            const player = playerData;
            const isAlive = !eliminatedPlayers.has(name);

            this.players.set(name, {
                name: player.name,
                role: player.role,
                avatar: `static/${name}.png`,
                status: isAlive ? 'alive' : 'eliminated',
                model: player.model || 'Unknown'
            });

            if (isAlive) {
                aliveCount++;
            } else {
                eliminatedCount++;
            }
        }

        // 更新玩家数量统计
        this.stats.aliveCount = aliveCount;
        this.stats.eliminatedCount = eliminatedCount;
        this.updatePlayersList();
    }
    generateLiveMessages(logs, state) {
        console.log(`[${new Date().toISOString()}] Generating messages: logs.length=${logs.length}, current.messages=${this.messages.length}`);

        // 暂时总是重新生成消息以确保更新
        console.log(`[${new Date().toISOString()}] Regenerating all messages from scratch`);
        this.messages = [];
        let currentTime = new Date();
        currentTime.setHours(14, 30, 0, 0); // 从14:30开始
        for (let round = 0; round < logs.length; round++) {
            const roundLog = logs[round];
            const roundState = state.rounds && state.rounds[round] ? state.rounds[round] : null;
            this.stats.currentRound = round;

            // 夜间阶段
            this.stats.currentPhase = 'night';
            this.updatePhaseDisplay();
            // 处理夜间行动
            if (roundLog.eliminate) {
                currentTime = this.addMinutes(currentTime, 1);
                this.addNightMessage(currentTime, 'Werewolf', `击杀目标：${roundLog.eliminate.result?.remove || '未知'}`, roundLog.eliminate);
            }
            if (roundLog.protect) {
                currentTime = this.addMinutes(currentTime, 1);
                this.addNightMessage(currentTime, 'Doctor', `保护目标：${roundLog.protect.result?.protect || '未知'}`, roundLog.protect);
            }
            if (roundLog.investigate) {
                currentTime = this.addMinutes(currentTime, 1);
                this.addNightMessage(currentTime, 'Seer', `查验目标：${roundLog.investigate.result?.investigate || '未知'}`, roundLog.investigate);
            }
            // 天亮公告 - 从 roundState 获取被淘汰的玩家
            currentTime = this.addMinutes(currentTime, 2);
            this.stats.currentPhase = 'day';
            this.updatePhaseDisplay();
            const eliminatedPlayer = roundState?.eliminated;
            this.addSystemMessage(
                `天亮了！昨晚${eliminatedPlayer ? eliminatedPlayer + '被淘汰了' : '是平安夜'}`,
                currentTime
            );
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
                // 显示投票结果和被驱逐的玩家
                currentTime = this.addMinutes(currentTime, 2);
                this.displayVotingResults(finalVotes, currentTime);

                // 添加驱逐公告
                const exiledPlayer = roundState?.exiled;
                if (exiledPlayer) {
                    this.addSystemMessage(`${exiledPlayer}被驱逐出局`, currentTime);
                }
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
    addMinutes(date, minutes) {
        const newDate = new Date(date);
        newDate.setMinutes(newDate.getMinutes() + minutes);
        return newDate;
    }
    addNightMessage(timestamp, player, content, data) {
        const role = this.getRoleByPlayer(player);
        const message = {
            id: `night_${timestamp.getTime()}`,
            timestamp: this.formatTime(timestamp),
            player: role || player,
            type: 'night',
            content: `🌙 夜间行动：${content}`,
            data
        };
        this.messages.push(message);
    }
    addBidMessage(timestamp, player, data) {
        const message = {
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
    addDebateMessage(timestamp, player, data) {
        const message = {
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
    addVoteMessage(timestamp, player, data) {
        const message = {
            id: `vote_${timestamp.getTime()}`,
            timestamp: this.formatTime(timestamp),
            player,
            type: 'vote',
            content: `🗳️ 投票给：${data.result?.vote || '未知'}`,
            data
        };
        this.messages.push(message);
    }
    addSummaryMessage(timestamp, player, data) {
        const message = {
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
    addSystemMessage(content, timestamp) {
        const message = {
            id: `system_${Date.now()}`,
            timestamp: timestamp ? this.formatTime(timestamp) : this.formatTime(new Date()),
            player: '系统',
            type: 'system',
            content: `📢 ${content}`
        };
        this.messages.push(message);
    }
    getRoleByPlayer(playerName) {
        if (!this.data?.state)
            return null;
        const state = this.data.state;
        if (state.doctor?.name === playerName)
            return 'Doctor';
        if (state.seer?.name === playerName)
            return 'Seer';
        if (state.werewolves?.some((w) => w.name === playerName))
            return 'Werewolf';
        return null;
    }
    updateUI() {
        this.renderMessages();
        this.updateStats();
    }
    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container)
            return;

        // 如果消息列表为空，清空容器
        if (this.messages.length === 0) {
            container.innerHTML = '';
            return;
        }

        // 检查是否已有消息
        if (container.children.length > 0) {
            const lastMessageId = container.lastElementChild?.getAttribute('data-message-id');
            const lastRenderedIndex = this.messages.findIndex(m => m.id === lastMessageId);

            // 如果找到最后渲染的消息，且还有新消息，则只添加新消息
            if (lastRenderedIndex !== -1 && lastRenderedIndex < this.messages.length - 1) {
                for (let i = lastRenderedIndex + 1; i < this.messages.length; i++) {
                    setTimeout(() => {
                        this.addMessageToUI(this.messages[i]);
                        this.scrollToBottom();
                    }, (i - lastRenderedIndex) * 50); // 减少延迟从100ms到50ms
                }
                return;
            }

            // 如果最后的消息ID不匹配，说明消息列表已重新生成，需要完全重新渲染
            if (lastRenderedIndex === -1 && this.messages.length > container.children.length) {
                // 找到容器中最后一条消息在新消息列表中的位置
                let foundIndex = -1;
                for (let i = container.children.length - 1; i >= 0; i--) {
                    const msgId = container.children[i].getAttribute('data-message-id');
                    foundIndex = this.messages.findIndex(m => m.id === msgId);
                    if (foundIndex !== -1) break;
                }

                // 如果找到匹配的消息，只添加后续的新消息
                if (foundIndex !== -1 && foundIndex < this.messages.length - 1) {
                    for (let i = foundIndex + 1; i < this.messages.length; i++) {
                        setTimeout(() => {
                            this.addMessageToUI(this.messages[i]);
                            this.scrollToBottom();
                        }, (i - foundIndex) * 50);
                    }
                    return;
                }
            }
        }

        // 首次渲染或需要完全重新渲染所有消息
        container.innerHTML = '';
        this.messages.forEach((message, index) => {
            setTimeout(() => {
                this.addMessageToUI(message);
                this.scrollToBottom();
            }, index * 50); // 减少延迟从100ms到50ms
        });
    }
    addMessageToUI(message) {
        const container = document.getElementById('chat-messages');
        if (!container)
            return;
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.setAttribute('data-message-id', message.id);
        const playerInfo = this.players.get(message.player);
        const avatarSrc = playerInfo?.avatar || 'static/default.png';
        messageElement.innerHTML = `
      <div class="message-time">${message.timestamp}</div>
      <div class="message-content">
        <img class="message-avatar" src="${avatarSrc}" alt="${message.player}"
             onerror="this.src='data:image/svg+xml;base64,${this.safeBase64Encode(this.generateAvatarSVG(message.player))}'">
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
    generateAvatarSVG(name) {
        const colors = ['#dc3545', '#28a745', '#007bff', '#ffc107', '#6f42c1', '#fd7e14'];
        const colorIndex = name.charCodeAt(0) % colors.length;
        return `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${colors[colorIndex]}"/>
        <text x="20" y="27" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${name.charAt(0).toUpperCase()}</text>
      </svg>
    `;
    }
    getTypeDisplayName(type) {
        const typeNames = {
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
        if (!container)
            return;
        container.innerHTML = '';
        this.players.forEach((player) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            const avatarSrc = player.avatar;
            playerElement.innerHTML = `
        <img class="player-avatar" src="${avatarSrc}" alt="${player.name}"
             onerror="this.src='data:image/svg+xml;base64,${this.safeBase64Encode(this.generateAvatarSVG(player.name))}'">
        <div class="player-info">
          <div class="player-name">${player.name}</div>
          <div class="player-status ${player.status}">${this.getRoleDisplayName(player.role)} • ${player.status === 'alive' ? '存活' : '淘汰'}</div>
        </div>
      `;
            container.appendChild(playerElement);
        });
    }
    getRoleDisplayName(role) {
        const roleNames = {
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
        if (aliveCount)
            aliveCount.textContent = this.stats.aliveCount.toString();
        if (eliminatedCount)
            eliminatedCount.textContent = this.stats.eliminatedCount.toString();
    }
    updatePhaseDisplay() {
        const phaseElement = document.getElementById('current-phase');
        if (!phaseElement)
            return;
        const phaseIcon = phaseElement.querySelector('.phase-icon');
        const phaseText = phaseElement.querySelector('.phase-text');
        if (phaseIcon && phaseText) {
            phaseIcon.textContent = this.stats.currentPhase === 'night' ? '🌙' : '☀️';
            phaseText.textContent = `第${this.stats.currentRound}轮 - ${this.stats.currentPhase === 'night' ? '夜间' : '白天'}阶段`;
        }
    }
    displayVotingResults(votes, timestamp) {
        console.log('处理投票结果:', votes);

        // 统计投票结果
        const voteCount = {};
        const totalVotes = votes.length;

        if (totalVotes === 0) {
            console.log('没有投票数据，跳过显示投票结果');
            return;
        }

        votes.forEach((vote) => {
            const target = vote.log?.result?.vote || 'unknown';
            voteCount[target] = (voteCount[target] || 0) + 1;
        });

        console.log('统计后的投票数据:', { voteCount, totalVotes });

        // 显示投票结果
        const resultMessage = `📊 投票结果：${Object.entries(voteCount)
            .map(([target, count]) => `${target} (${count}票)`)
            .join(', ')}`;
        this.addSystemMessage(resultMessage, timestamp);

        // 在右侧面板显示详细统计
        this.showVotingChart(voteCount, totalVotes);
    }
    showVotingChart(voteCount, totalVotes) {
        const chartContainer = document.getElementById('vote-chart');
        const votingPanel = document.getElementById('voting-results');
        if (!chartContainer || !votingPanel) {
            console.warn('投票统计容器未找到');
            return;
        }

        console.log('显示投票统计:', { voteCount, totalVotes });

        votingPanel.classList.remove('hidden');
        chartContainer.innerHTML = '';

        // 如果没有投票数据，显示提示信息
        if (Object.keys(voteCount).length === 0) {
            chartContainer.innerHTML = '<div style="color: #9ca3af; text-align: center; padding: 20px;">暂无投票数据</div>';
            return;
        }

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
    showDebugInfo(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message || !message.data)
            return;
        const debugPanel = document.getElementById('debug-panel');
        const debugContent = document.getElementById('debug-content');
        if (!debugPanel || !debugContent)
            return;
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

    // 测试投票统计显示功能
    testVotingChart() {
        console.log('测试投票统计显示');
        const mockVoteCount = {
            'Alice': 3,
            'Bob': 2,
            'Charlie': 1
        };
        const totalVotes = 6;
        this.showVotingChart(mockVoteCount, totalVotes);
    }

    // 游戏控制相关方法
    async stopGame() {
        if (!this.sessionId) return;

        const stopBtn = document.getElementById('stop-game-btn');
        const statusText = document.getElementById('status-text');
        const statusDot = document.getElementById('status-dot');

        try {
            stopBtn.disabled = true;
            stopBtn.textContent = '⏹️ 停止中...';
            statusText.textContent = '停止中';
            statusDot.className = 'status-dot stopping';

            const response = await fetch(`/stop-game/${this.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                this.gameStatus = 'stopped';
                statusText.textContent = '已停止';
                statusDot.className = 'status-dot stopped';
                stopBtn.textContent = '⏹️ 已停止';

                // 添加系统消息
                this.addSystemMessage('🛑 游戏已被用户停止');

                // 停止数据更新
                this.isLive = false;

                // 更新LIVE指示器
                const liveIndicator = document.getElementById('live-indicator');
                if (liveIndicator) {
                    liveIndicator.style.display = 'none';
                }
            } else {
                throw new Error(result.error || '停止游戏失败');
            }
        } catch (error) {
            console.error('停止游戏失败:', error);
            statusText.textContent = '停止失败';
            stopBtn.disabled = false;
            stopBtn.textContent = '⏹️ 停止';

            // 显示错误消息
            this.addSystemMessage(`❌ 停止游戏失败: ${error.message}`);
        }
    }

    async restartGame() {
        // 重新开始游戏 - 跳转到主页
        if (confirm('确定要重新开始游戏吗？这将跳转到主页创建新游戏。')) {
            window.location.href = '/home.html';
        }
    }

    startGameStatusPolling() {
        // 每5秒检查一次游戏状态
        setInterval(async () => {
            await this.checkGameStatus();
        }, 5000);
    }

    async checkGameStatus() {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`/game-status/${this.sessionId}`);
            const result = await response.json();

            if (result.success) {
                this.updateGameControls(result.status);
            }
        } catch (error) {
            console.error('检查游戏状态失败:', error);
        }
    }

    updateGameControls(status) {
        const stopBtn = document.getElementById('stop-game-btn');
        const restartBtn = document.getElementById('restart-game-btn');
        const statusText = document.getElementById('status-text');
        const statusDot = document.getElementById('status-dot');

        if (!stopBtn || !statusText || !statusDot) return;

        this.gameStatus = status;

        switch (status) {
            case 'initializing':
                statusText.textContent = '初始化中';
                statusDot.className = 'status-dot';
                stopBtn.disabled = false;
                stopBtn.textContent = '⏹️ 停止';
                break;
            case 'running':
                statusText.textContent = '运行中';
                statusDot.className = 'status-dot';
                stopBtn.disabled = false;
                stopBtn.textContent = '⏹️ 停止';
                this.isLive = true;
                break;
            case 'stopping':
                statusText.textContent = '停止中';
                statusDot.className = 'status-dot stopping';
                stopBtn.disabled = true;
                stopBtn.textContent = '⏹️ 停止中...';
                break;
            case 'stopped':
                statusText.textContent = '已停止';
                statusDot.className = 'status-dot stopped';
                stopBtn.disabled = true;
                stopBtn.textContent = '⏹️ 已停止';
                this.isLive = false;
                break;
            case 'completed':
                statusText.textContent = '已完成';
                statusDot.className = 'status-dot';
                stopBtn.disabled = true;
                stopBtn.textContent = '⏹️ 已完成';
                this.isLive = false;
                break;
            case 'error':
                statusText.textContent = '错误';
                statusDot.className = 'status-dot stopped';
                stopBtn.disabled = true;
                stopBtn.textContent = '⏹️ 错误';
                this.isLive = false;
                break;
            default:
                statusText.textContent = '未知';
                statusDot.className = 'status-dot';
        }
    }
}
// 初始化直播流
let liveStream;
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
        // 定期更新（模拟实时）
        setInterval(() => {
            liveStream.retrieveData();
        }, 3000); // 每3秒更新一次，减少频率
    }
    catch (error) {
        console.error('Failed to initialize live stream:', error);
        document.body.innerHTML = '<div style="color: white; text-align: center; margin-top: 100px;">加载失败，请检查游戏会话ID是否正确</div>';
    }
});

// 添加全局测试函数，方便在控制台中使用
window.testVotingChart = function() {
    if (liveStream) {
        liveStream.testVotingChart();
    } else {
        console.error('直播流未初始化');
    }
};

console.log('投票统计测试功能已加载。使用 testVotingChart() 来测试投票统计显示。');
