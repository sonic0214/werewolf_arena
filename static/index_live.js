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

        // 阶段状态管理
        this.phaseState = {
            type: 'night',
            status: 'initializing', // initializing, active, completed
            startTime: null,
            currentAction: null,
            progress: 0,
            totalSteps: 0
        };

        // AI思考状态管理
        this.aiThinkingState = {
            players: new Map(), // 存储每个AI玩家的状态
            summary: 'AI正在准备中...',
            lastUpdate: null
        };

        // 天亮公告防重复机制
        this.dawnAnnouncements = new Set(); // 记录已显示天亮公告的轮次

        // 夜间行动防重复机制
        this.nightActions = new Set(); // 记录已显示的夜间行动

        if (this.sessionId.length == 0)
            throw new Error('No session specified');
        this.initializeEventListeners();
        this.startClock();
        this.startGameStatusPolling(); // 开始轮询游戏状态
        this.startPhaseStatusUpdater(); // 开始更新阶段状态
        this.startAIStatusUpdates(); // 开始更新AI状态
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

            // 从新后端API获取游戏状态
            const gameStateResponse = await fetch(`http://localhost:8081/game-status/${this.sessionId}`);
            if (!gameStateResponse.ok) {
                throw new Error(`Failed to fetch game state: ${gameStateResponse.status}`);
            }
            const gameState = await gameStateResponse.json();
            console.log(`[${new Date().toISOString()}] Retrieved game state, status: ${gameState.status}`);

            // 尝试获取日志文件（通过后端日志目录）
            let logs = [];
            try {
                const logsResponse = await fetch(`http://localhost:8081/api/v1/games/${this.sessionId}/logs`);
                if (logsResponse.ok) {
                    logs = await logsResponse.json();
                    console.log(`[${new Date().toISOString()}] Retrieved ${logs.length} rounds of logs`);
                } else {
                    console.log(`[${new Date().toISOString()}] No logs available yet`);
                }
            } catch (logsError) {
                console.log(`[${new Date().toISOString()}] Logs not available: ${logsError.message}`);
            }

            // 使用游戏状态作为state数据
            const state = gameState;
            console.log(`[${new Date().toISOString()}] Using game state, current_round: ${state.current_round || 'none'}`);

            // 暂时禁用数据哈希检查，直接处理所有数据
            // const currentDataHash = this.calculateDataHash(logs, state);
            // if (this.lastDataHash === currentDataHash) {
            //     console.log(`[${new Date().toISOString()}] Data unchanged, skipping processing`);
            //     return;
            // }
            // console.log(`[${new Date().toISOString()}] Data changed (hash: ${this.lastDataHash} -> ${currentDataHash})`);
            // this.lastDataHash = currentDataHash;

            this.data = { logs, state };
            // 保存当前游戏日志和状态，供AI状态提取使用
            this.currentGameLog = logs;
            this.currentGameState = state;
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

        // 处理新后端的players数据格式
        const playersData = {};
        if (state.players && Array.isArray(state.players)) {
            // 新后端格式：players 是对象数组
            for (const player of state.players) {
                playersData[player.name] = {
                    role: player.role,
                    model: player.model
                };
            }
        } else {
            // 兼容原格式
            Object.assign(playersData, state.players || {});
        }

        let aliveCount = 0;
        let eliminatedCount = 0;

        // 处理所有玩家
        for (const [name, playerData] of Object.entries(playersData)) {
            const player = playerData;
            const isAlive = !eliminatedPlayers.has(name);

            this.players.set(name, {
                name: name,
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
        this.dawnAnnouncements.clear(); // 清空天亮公告记录，重新开始
        this.nightActions.clear(); // 清空夜间行动记录，重新开始
        let currentTime = new Date();
        currentTime.setHours(14, 30, 0, 0); // 从14:30开始

        // 找出当前正在进行的阶段
        const currentPhase = this.findCurrentPhase(logs, state);

        for (let round = 0; round < logs.length; round++) {
            const roundLog = logs[round];
            const roundState = state.rounds && state.rounds[round] ? state.rounds[round] : null;
            this.stats.currentRound = round;

            // 夜间阶段
            this.stats.currentPhase = 'night';
            const nightActions = [
                roundLog.investigate ? 'investigate' : null,
                roundLog.eliminate ? 'eliminate' : null,
                roundLog.protect ? 'protect' : null
            ].filter(action => action !== null);

            this.updatePhaseState('night', 'active', '夜间行动开始', nightActions.length);
            this.updatePhaseDisplay();

            // 处理夜间行动 - 按照游戏时间顺序：预言家查验 → 狼人击杀 → 医生保护
            // 添加防重复机制
            if (roundLog.investigate && !this.nightActions.has(`investigate_${round}`)) {
                this.updatePhaseState('investigate', 'active', '预言家查验行动中', 1);
                currentTime = this.addMinutes(currentTime, 1);
                this.addNightMessage(currentTime, 'Seer', `查验目标：${roundLog.investigate.result?.investigate || '未知'}`, roundLog.investigate);
                this.updatePhaseState('investigate', 'completed', '查验行动完成', 1);
                this.nightActions.add(`investigate_${round}`);
            }
            if (roundLog.eliminate && !this.nightActions.has(`eliminate_${round}`)) {
                this.updatePhaseState('eliminate', 'active', '狼人击杀行动中', 1);
                currentTime = this.addMinutes(currentTime, 1);
                this.addNightMessage(currentTime, 'Werewolf', `击杀目标：${roundLog.eliminate.result?.remove || '未知'}`, roundLog.eliminate);
                this.updatePhaseState('eliminate', 'completed', '击杀行动完成', 1);
                this.nightActions.add(`eliminate_${round}`);
            }
            if (roundLog.protect && !this.nightActions.has(`protect_${round}`)) {
                this.updatePhaseState('protect', 'active', '医生保护行动中', 1);
                currentTime = this.addMinutes(currentTime, 1);
                this.addNightMessage(currentTime, 'Doctor', `保护目标：${roundLog.protect.result?.protect || '未知'}`, roundLog.protect);
                this.updatePhaseState('protect', 'completed', '保护行动完成', 1);
                this.nightActions.add(`protect_${round}`);
            }

            // 夜间阶段完成，准备进入白天
            this.updatePhaseState('night', 'completed', '夜间行动完成', nightActions.length);
            currentTime = this.addMinutes(currentTime, 1); // 夜间到白天的过渡时间

            // 天亮公告 - 确保夜间行动真正完成后才显示（每个轮次只显示一次）
            // 严格验证夜间行动完整性
            const nightActionsComplete = (
                (roundLog.investigate && roundLog.investigate.result) ||
                (roundLog.eliminate && roundLog.eliminate.result) ||
                (roundLog.protect && roundLog.protect.result)
            );

            // 验证游戏已进入白天阶段（有竞拍/辩论/投票等白天活动）
            const hasDaytimeActivities = (
                (roundLog.bid && roundLog.bid.length > 0) ||
                (roundLog.debate && roundLog.debate.length > 0) ||
                (roundLog.votes && roundLog.votes.length > 0)
            );

            // 只有同时满足以下条件才显示天亮公告：
            // 1. 夜间行动完成 2. 有淘汰信息 3. 已进入白天阶段或游戏完成 4. 该轮次未显示过
            if (nightActionsComplete &&
                roundState?.eliminated !== undefined &&
                (hasDaytimeActivities || state.winner) &&
                !this.hasDawnAnnouncementForRound(round)) {

                currentTime = this.addMinutes(currentTime, 2);
                this.stats.currentPhase = 'day';
                this.updatePhaseState('day', 'active', '白天阶段开始', 1);
                this.updatePhaseDisplay();
                const eliminatedPlayer = roundState?.eliminated;
                this.addSystemMessage(
                    `天亮了！昨晚${eliminatedPlayer ? eliminatedPlayer + '被淘汰了' : '是平安夜'}`,
                    currentTime
                );
                this.markDawnAnnouncementForRound(round);
            }

            // 白天阶段 - 竞拍发言权
            if (roundLog.bid && Array.isArray(roundLog.bid)) {
                this.updatePhaseState('bid', 'active', '竞拍发言权', roundLog.bid.length);
                for (let turn = 0; turn < roundLog.bid.length; turn++) {
                    const bidTurn = roundLog.bid[turn];
                    if (Array.isArray(bidTurn)) {
                        for (const [name, bidData] of bidTurn) {
                            currentTime = this.addMinutes(currentTime, 2);
                            this.addBidMessage(currentTime, name, bidData);
                        }
                    }
                    currentTime = this.addMinutes(currentTime, 1);
                    this.updatePhaseProgress(turn + 1, roundLog.bid.length);
                }
                this.updatePhaseState('bid', 'completed', '竞拍发言权结束', roundLog.bid.length);
            }

            // 辩论发言
            if (roundLog.debate && Array.isArray(roundLog.debate)) {
                this.updatePhaseState('debate', 'active', '辩论发言中', roundLog.debate.length);
                for (let i = 0; i < roundLog.debate.length; i++) {
                    const [name, debateData] = roundLog.debate[i];
                    currentTime = this.addMinutes(currentTime, 3);
                    this.addDebateMessage(currentTime, name, debateData);
                    this.updatePhaseProgress(i + 1, roundLog.debate.length);
                }
                this.updatePhaseState('debate', 'completed', '辩论发言结束', roundLog.debate.length);
            }

            // 投票阶段
            if (roundLog.votes && roundLog.votes.length > 0) {
                this.updatePhaseState('vote', 'active', '投票进行中', roundLog.votes.length);
                currentTime = this.addMinutes(currentTime, 2);
                this.addSystemMessage('开始投票', currentTime);
                const finalVotes = roundLog.votes[roundLog.votes.length - 1];
                for (let i = 0; i < finalVotes.length; i++) {
                    const vote = finalVotes[i];
                    currentTime = this.addMinutes(currentTime, 1);
                    this.addVoteMessage(currentTime, vote.player, vote.log);
                    this.updatePhaseProgress(i + 1, finalVotes.length);
                }
                // 显示投票结果和被驱逐的玩家
                currentTime = this.addMinutes(currentTime, 2);
                this.displayVotingResults(finalVotes, currentTime);
                this.updatePhaseState('vote', 'completed', '投票结束', roundLog.votes.length);

                // 添加驱逐公告
                const exiledPlayer = roundState?.exiled;
                if (exiledPlayer) {
                    this.addSystemMessage(`${exiledPlayer}被驱逐出局`, currentTime);
                }
            }

            // 总结发言
            if (roundLog.summaries && Array.isArray(roundLog.summaries)) {
                this.updatePhaseState('summary', 'active', '总结发言中', roundLog.summaries.length);
                for (let i = 0; i < roundLog.summaries.length; i++) {
                    const [name, summaryData] = roundLog.summaries[i];
                    currentTime = this.addMinutes(currentTime, 3);
                    this.addSummaryMessage(currentTime, name, summaryData);
                    this.updatePhaseProgress(i + 1, roundLog.summaries.length);
                }
                this.updatePhaseState('summary', 'completed', '本轮结束', roundLog.summaries.length);
            }
        }

        // 设置当前阶段状态（重要：确保显示的是当前正在进行的阶段）
        if (currentPhase) {
            this.updatePhaseState(currentPhase.type, currentPhase.status, currentPhase.currentAction, currentPhase.totalSteps);
            this.phaseState.startTime = currentPhase.startTime || new Date();
            this.phaseState.progress = currentPhase.progress || 0;
            console.log(`[${new Date().toISOString()}] Set current phase to: ${currentPhase.type} - ${currentPhase.currentAction}`);
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

        // 处理新后端格式：从players数组中查找角色
        if (state.players && Array.isArray(state.players)) {
            const player = state.players.find(p => p.name === playerName);
            if (player) {
                return player.role;
            }
        }

        // 兼容原格式
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
        const phaseStatus = phaseElement.querySelector('#phase-status');

        if (phaseIcon && phaseText && phaseStatus) {
            phaseIcon.textContent = this.stats.currentPhase === 'night' ? '🌙' : '☀️';
            phaseText.textContent = `第${this.stats.currentRound}轮 - ${this.stats.currentPhase === 'night' ? '夜间' : '白天'}阶段`;

            // 更新阶段状态文本
            const statusText = this.getPhaseStatusText();
            phaseStatus.textContent = statusText;
            phaseStatus.className = `phase-status ${this.phaseState.type}`;
        }
    }

    startPhaseStatusUpdater() {
        // 每2秒更新一次阶段状态
        setInterval(() => {
            this.updatePhaseStatus();
        }, 2000);
    }

    updatePhaseStatus() {
        // 更新右侧栏的阶段状态面板
        this.updatePhasePanel();
    }

    updatePhaseState(type, status, currentAction, totalSteps) {
        this.phaseState = {
            type: type,
            status: status,
            startTime: new Date(),
            currentAction: currentAction,
            progress: status === 'completed' ? 100 : (status === 'initializing' ? 0 : 50),
            totalSteps: totalSteps
        };
        this.updatePhasePanel();
    }

    updatePhaseProgress(currentStep, totalSteps) {
        if (this.phaseState.status === 'active') {
            this.phaseState.progress = Math.round((currentStep / totalSteps) * 100);
            this.phaseState.currentAction = `进度: ${currentStep}/${totalSteps}`;
            this.updatePhasePanel();
        }
    }

    findCurrentPhase(logs, state) {
        // 检查游戏是否已完成
        if (state.winner) {
            return {
                type: 'summary',
                status: 'completed',
                currentAction: '游戏结束',
                totalSteps: 1,
                progress: 100,
                startTime: new Date()
            };
        }

        // 获取最后一轮的数据
        const lastRoundIndex = logs.length - 1;
        if (lastRoundIndex < 0) {
            return {
                type: 'night',
                status: 'initializing',
                currentAction: '游戏准备中',
                totalSteps: 1,
                progress: 0,
                startTime: new Date()
            };
        }

        const lastRound = logs[lastRoundIndex];
        const roundState = state.rounds && state.rounds[lastRoundIndex] ? state.rounds[lastRoundIndex] : null;

        // 按游戏阶段顺序检查哪个阶段正在进行
        const phases = [
            { key: 'investigate', name: '预言家查验', type: 'investigate' },
            { key: 'eliminate', name: '狼人击杀', type: 'eliminate' },
            { key: 'protect', name: '医生保护', type: 'protect' },
            { key: 'bid', name: '竞拍发言', type: 'bid' },
            { key: 'debate', name: '辩论发言', type: 'debate' },
            { key: 'votes', name: '投票', type: 'vote' },
            { key: 'summaries', name: '总结发言', type: 'summary' }
        ];

        // 检查每个阶段的完成情况
        for (const phase of phases) {
            const phaseData = lastRound[phase.key];

            if (!phaseData) {
                // 如果这个阶段的数据不存在，说明是当前正在进行的阶段
                return {
                    type: phase.type,
                    status: 'active',
                    currentAction: `${phase.name}进行中...`,
                    totalSteps: 1,
                    progress: 50,
                    startTime: new Date()
                };
            }

            // 检查阶段是否完成
            if (Array.isArray(phaseData)) {
                if (phaseData.length === 0) {
                    // 阶段数据存在但为空，说明刚开始
                    return {
                        type: phase.type,
                        status: 'active',
                        currentAction: `${phase.name}开始...`,
                        totalSteps: 1,
                        progress: 10,
                        startTime: new Date()
                    };
                }
            } else if (phaseData && phaseData.result) {
                // 单个行动阶段（如 investigate, eliminate, protect）
                if (!phaseData.result.action || phaseData.result.action === 'pending') {
                    return {
                        type: phase.type,
                        status: 'active',
                        currentAction: `${phase.name}进行中...`,
                        totalSteps: 1,
                        progress: 50,
                        startTime: new Date()
                    };
                }
            }
        }

        // 如果所有阶段都完成了，检查是否有下一轮
        if (state.winner) {
            return {
                type: 'summary',
                status: 'completed',
                currentAction: '游戏结束',
                totalSteps: 1,
                progress: 100,
                startTime: new Date()
            };
        }

        // 当前轮已完成，等待下一轮开始
        return {
            type: 'night',
            status: 'completed',
            currentAction: '等待下一轮开始',
            totalSteps: 1,
            progress: 100,
            startTime: new Date()
        };
    }

    updatePhasePanel() {
        const phaseIcon = document.getElementById('phase-type-icon');
        const phaseName = document.getElementById('phase-type-name');
        const phaseStatus = document.getElementById('phase-status-detail');
        const phaseStartTime = document.getElementById('phase-start-time');
        const phaseRemaining = document.getElementById('phase-remaining');
        const progressBar = document.getElementById('phase-progress-bar');
        const phaseInfoPanel = document.getElementById('phase-info');

        if (!phaseIcon || !phaseName || !phaseStatus) return;

        // 更新阶段名称和图标
        const phaseInfo = this.getPhaseInfo(this.phaseState.type);
        phaseIcon.textContent = phaseInfo.icon;
        phaseName.textContent = phaseInfo.name;

        // 更新状态文本
        phaseStatus.textContent = this.getPhaseStatusText();

        // 更新开始时间
        if (this.phaseState.startTime) {
            phaseStartTime.textContent = this.formatTime(this.phaseState.startTime);
        }

        // 更新预计剩余时间
        const remainingTime = this.calculateRemainingTime();
        phaseRemaining.textContent = remainingTime;

        // 更新进度条
        if (progressBar && this.phaseState.totalSteps > 0) {
            progressBar.style.width = `${this.phaseState.progress}%`;
        }

        // 添加更新动画
        if (phaseInfoPanel) {
            phaseInfoPanel.classList.add('updating');
            setTimeout(() => {
                phaseInfoPanel.classList.remove('updating');
            }, 300);
        }
    }

    getPhaseInfo(phaseType) {
        const phaseTypes = {
            'night': { icon: '🌙', name: '夜间阶段' },
            'day': { icon: '☀️', name: '白天阶段' },
            'eliminate': { icon: '🗡️', name: '击杀行动' },
            'protect': { icon: '🛡️', name: '保护行动' },
            'investigate': { icon: '🔍', name: '查验行动' },
            'bid': { icon: '💰', name: '竞拍发言' },
            'debate': { icon: '🗣️', name: '辩论发言' },
            'vote': { icon: '🗳️', name: '投票阶段' },
            'summary': { icon: '📝', name: '总结发言' }
        };
        return phaseTypes[phaseType] || { icon: '🎯', name: '未知阶段' };
    }

    getPhaseStatusText() {
        const statusTexts = {
            'initializing': '准备中...',
            'active': this.phaseState.currentAction || '进行中...',
            'completed': '已完成'
        };
        return statusTexts[this.phaseState.status] || '未知状态';
    }

    calculateRemainingTime() {
        if (!this.phaseState.startTime || this.phaseState.status === 'completed') {
            return '--:--';
        }

        const elapsed = Date.now() - this.phaseState.startTime.getTime();
        const estimatedDuration = this.getEstimatedPhaseDuration(this.phaseState.type);
        const remaining = Math.max(0, estimatedDuration - elapsed);

        return this.formatDuration(remaining);
    }

    getEstimatedPhaseDuration(phaseType) {
        // 估算每个阶段的持续时间（毫秒）
        const durations = {
            'night': 30000,      // 30秒
            'eliminate': 10000,  // 10秒
            'protect': 10000,    // 10秒
            'investigate': 10000, // 10秒
            'bid': 20000,        // 20秒
            'debate': 60000,      // 60秒
            'vote': 30000,       // 30秒
            'summary': 40000     // 40秒
        };
        return durations[phaseType] || 30000;
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `0:${remainingSeconds.toString().padStart(2, '0')}`;
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
            // 检查游戏是否已结束
            if (this.currentGameState?.winner) {
                console.log('Game completed, stopping auto-scroll');
                // 显示游戏结束提示
                this.showGameEndMessage();
                return; // 游戏结束后不再自动滚动
            }

            // 使用平滑滚动
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    showGameEndMessage() {
        // 检查是否已经显示过游戏结束提示
        if (document.getElementById('game-end-banner')) {
            return;
        }

        const container = document.getElementById('chat-messages');
        if (!container) return;

        // 创建游戏结束横幅
        const endBanner = document.createElement('div');
        endBanner.id = 'game-end-banner';
        endBanner.style.cssText = `
            position: sticky;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: fadeInUp 0.5s ease-out;
            cursor: pointer;
            max-width: 300px;
            text-align: center;
        `;
        endBanner.innerHTML = `
            🎉 游戏已结束！获胜者：${this.currentGameState.winner}
            <br><small style="opacity: 0.8; font-size: 12px;">点击查看完整回顾</small>
        `;

        // 添加点击事件，滚动到游戏开始位置
        endBanner.addEventListener('click', () => {
            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // 添加淡入动画样式
        if (!document.getElementById('game-end-styles')) {
            const style = document.createElement('style');
            style.id = 'game-end-styles';
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(endBanner);

        // 5秒后自动消失
        setTimeout(() => {
            if (endBanner.parentNode) {
                endBanner.style.animation = 'fadeInUp 0.5s ease-out reverse';
                setTimeout(() => {
                    if (endBanner.parentNode) {
                        endBanner.remove();
                    }
                }, 500);
            }
        }, 8000);
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

            const response = await fetch(`http://localhost:8081/stop-game/${this.sessionId}`, {
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
        // 每8秒检查一次游戏状态，减少轮询频率
        setInterval(async () => {
            await this.checkGameStatus();
        }, 8000);
    }

    async checkGameStatus() {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`http://localhost:8081/game-status/${this.sessionId}`);
            const result = await response.json();

            if (result.status) {
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

    // AI思考状态管理方法
    /**
     * 从游戏日志提取AI思考状态 - 方案C实现
     * @param {Array} logs - 游戏日志
     * @param {Object} currentState - 当前游戏状态
     * @returns {Object} AI思考状态信息
     */
    extractAIThinkingStates(logs, currentState) {
        const aiStates = new Map();
        let globalSummary = 'AI正在准备中...';
        let lastActionTime = null;

        try {
            // 获取当前轮次和阶段
            const currentRound = currentState?.rounds?.length || 0;
            const currentPhase = this.findCurrentPhase(logs, currentState);

            // 分析最近的AI思考
            const recentLogs = logs.slice(-10); // 最近10条日志

            // 尝试从不同结构提取AI状态
            for (let i = logs.length - 1; i >= Math.max(0, logs.length - 3); i--) {
                const roundLog = logs[i];

                // 检查夜间行动
                if (roundLog.investigate && roundLog.investigate.player) {
                    const player = roundLog.investigate.player;
                    const role = '预言家';
                    const action = 'investigate';
                    const reasoning = roundLog.investigate.result?.reasoning || '正在查验目标身份...';

                    aiStates.set(player, {
                        role: role,
                        action: action,
                        reasoning: reasoning,
                        timestamp: new Date(),
                        status: this.getAIStatusFromAction(action),
                        progress: 90
                    });
                    lastActionTime = new Date();
                }

                if (roundLog.eliminate && roundLog.eliminate.player) {
                    const player = roundLog.eliminate.player;
                    const role = '狼人';
                    const action = 'eliminate';
                    const reasoning = roundLog.eliminate.result?.reasoning || '正在选择击杀目标...';

                    aiStates.set(player, {
                        role: role,
                        action: action,
                        reasoning: reasoning,
                        timestamp: new Date(),
                        status: this.getAIStatusFromAction(action),
                        progress: 75
                    });
                    lastActionTime = new Date();
                }

                if (roundLog.protect && roundLog.protect.player) {
                    const player = roundLog.protect.player;
                    const role = '医生';
                    const action = 'protect';
                    const reasoning = roundLog.protect.result?.reasoning || '正在选择保护目标...';

                    aiStates.set(player, {
                        role: role,
                        action: action,
                        reasoning: reasoning,
                        timestamp: new Date(),
                        status: this.getAIStatusFromAction(action),
                        progress: 85
                    });
                    lastActionTime = new Date();
                }

                // 检查白天阶段的发言和投票
                if (roundLog.debate && Array.isArray(roundLog.debate)) {
                    for (const [playerName, debateData] of roundLog.debate) {
                        const reasoning = debateData.result?.reasoning || '正在准备发言...';
                        aiStates.set(playerName, {
                            role: '村民',
                            action: 'debate',
                            reasoning: reasoning,
                            timestamp: new Date(),
                            status: this.getAIStatusFromAction('debate'),
                            progress: 70
                        });
                    }
                    lastActionTime = new Date();
                }
            }

            // 如果没有找到思考状态，尝试从原始日志提取
            if (aiStates.size === 0) {
                // 从game_logs.json中提取更详细的思考过程
                this.extractDetailedAIThinking(logs, aiStates, currentPhase);
            }

            // 生成全局摘要
            globalSummary = this.generateGlobalAISummary(aiStates, currentPhase);

        } catch (error) {
            console.warn('提取AI思考状态时出错:', error);
        }

        return {
            players: aiStates,
            summary: globalSummary,
            lastUpdate: lastActionTime || new Date()
        };
    }

    /**
     * 从原始游戏日志提取详细的AI思考过程
     */
    extractDetailedAIThinking(logs, aiStates, currentPhase) {
        // 这里可以进一步分析原始日志，提取prompt和raw_resp中的思考过程
        // 暂时使用基本实现
        const activePlayers = ['Alice', 'Bob', 'Charlie', 'Derek', 'Eve']; // 示例玩家

        for (const player of activePlayers) {
            if (Math.random() > 0.7) { // 模拟有些玩家正在思考
                aiStates.set(player, {
                    role: this.getRandomRole(),
                    action: this.getActionFromPhase(currentPhase),
                    reasoning: `正在分析当前局势，考虑最佳策略...`,
                    timestamp: new Date(),
                    status: '思考中',
                    progress: Math.floor(Math.random() * 100)
                });
            }
        }
    }

    /**
     * 根据动作类型获取AI状态
     */
    getAIStatusFromAction(action) {
        const statusMap = {
            'eliminate': '🎯 选择目标',
            'protect': '🛡️ 保护目标',
            'investigate': '🔍 查验身份',
            'bid': '💰 竞拍发言',
            'debate': '🗣️ 辩论发言',
            'vote': '🗳️ 投票决策',
            'summary': '📝 总结发言'
        };

        return statusMap[action] || '💭 思考中';
    }

    /**
     * 根据动作和阶段获取AI进度
     */
    getAIProgressFromAction(action, currentPhase) {
        // 根据不同动作返回不同的进度
        if (!currentPhase) return 0;

        // 模拟进度计算
        const baseProgress = {
            'investigate': 85,
            'eliminate': 75,
            'protect': 90,
            'bid': 60,
            'debate': 70,
            'vote': 80,
            'summary': 95
        };

        return baseProgress[action] || 50;
    }

    /**
     * 生成全局AI状态摘要
     */
    generateGlobalAISummary(aiStates, currentPhase) {
        if (aiStates.size === 0) {
            return (currentPhase && currentPhase.type) ?
                `${this.getPhaseDisplayName(currentPhase.type)}阶段，AI正在分析局势...` :
                'AI正在准备中...';
        }

        const activeRoles = new Set();
        for (const [player, state] of aiStates) {
            if (state.role) {
                activeRoles.add(state.role);
            }
        }

        if (activeRoles.size === 1) {
            const role = Array.from(activeRoles)[0];
            return `${role}正在思考决策...`;
        } else if (activeRoles.size > 1) {
            return `多个角色正在同时思考...`;
        }

        return 'AI正在分析当前局势...';
    }

    /**
     * 根据阶段获取可能的动作
     */
    getActionFromPhase(currentPhase) {
        if (!currentPhase) return 'thinking';

        const phaseActions = {
            'night_phase': ['investigate', 'eliminate', 'protect'],
            'bid_phase': ['bid'],
            'debate_phase': ['debate'],
            'voting_phase': ['vote'],
            'summary_phase': ['summary']
        };

        const actions = phaseActions[currentPhase.type] || ['thinking'];
        return actions[Math.floor(Math.random() * actions.length)];
    }

    /**
     * 获取随机角色（用于演示）
     */
    getRandomRole() {
        const roles = ['🐺 狼人', '👁️ 预言家', '💉 医生', '👥 村民', '🎭 猎人'];
        return roles[Math.floor(Math.random() * roles.length)];
    }

    /**
     * 更新AI思考状态面板 - 方案A实现
     */
    updateAIThinkingPanel() {
        const aiPanel = document.getElementById('ai-thinking-panel');
        const aiSummaryText = document.getElementById('ai-summary-text');
        const aiThinkingList = document.getElementById('ai-thinking-list');

        if (!aiPanel || !aiSummaryText || !aiThinkingList) return;

        try {
            // 更新全局摘要
            aiSummaryText.textContent = this.aiThinkingState.summary;

            // 清空现有列表
            aiThinkingList.innerHTML = '';

            // 按角色分组显示AI状态
            const roleGroups = new Map();
            for (const [player, state] of this.aiThinkingState.players) {
                const role = state.role || '未知角色';
                if (!roleGroups.has(role)) {
                    roleGroups.set(role, []);
                }
                roleGroups.get(role).push({ player, ...state });
            }

            // 为每个角色组创建显示元素
            for (const [role, players] of roleGroups) {
                const roleElement = this.createRoleGroupElement(role, players);
                aiThinkingList.appendChild(roleElement);
            }

            // 如果没有AI状态，显示默认信息
            if (this.aiThinkingState.players.size === 0) {
                const emptyElement = document.createElement('div');
                emptyElement.className = 'ai-status-empty';
                emptyElement.innerHTML = `
                    <div class="ai-status-item">
                        <span class="ai-status-thinking">💭 AI正在准备下一轮行动...</span>
                    </div>
                `;
                aiThinkingList.appendChild(emptyElement);
            }

            // 添加脉冲效果
            this.addAIPulseEffect();

        } catch (error) {
            console.error('更新AI思考面板时出错:', error);
        }
    }

    /**
     * 为角色组创建显示元素
     */
    createRoleGroupElement(role, players) {
        const roleDiv = document.createElement('div');
        roleDiv.className = 'ai-role-group';

        // 角色标题
        const roleTitle = document.createElement('div');
        roleTitle.className = 'ai-role-title';
        roleTitle.textContent = role;
        roleDiv.appendChild(roleTitle);

        // 该角色下的玩家列表
        const playersList = document.createElement('div');
        playersList.className = 'ai-players-list';

        for (const playerInfo of players) {
            const playerElement = this.createAIStatusItem(playerInfo);
            playersList.appendChild(playerElement);
        }

        roleDiv.appendChild(playersList);
        return roleDiv;
    }

    /**
     * 创建单个AI状态项
     */
    createAIStatusItem(playerInfo) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ai-status-item';

        const statusClass = playerInfo.status.includes('思考中') ? 'ai-status-thinking' : 'ai-status-decided';
        const progressBar = playerInfo.progress ?
            `<div class="ai-progress-bar">
                <div class="ai-progress-fill" style="width: ${playerInfo.progress}%"></div>
            </div>` : '';

        itemDiv.innerHTML = `
            <div class="${statusClass}">
                <span class="ai-action-icon">${playerInfo.status.split(' ')[0]}</span>
                <span class="ai-player-name">${playerInfo.player}</span>
                <span class="ai-action-text">${playerInfo.status.substring(2)}</span>
                ${progressBar}
            </div>
        `;

        // 添加思考过程显示（如果有的话）
        if (playerInfo.reasoning && playerInfo.reasoning.length > 20) {
            const reasoningDiv = document.createElement('div');
            reasoningDiv.className = 'ai-reasoning';
            reasoningDiv.textContent = playerInfo.reasoning.substring(0, 100) + '...';
            itemDiv.appendChild(reasoningDiv);
        }

        return itemDiv;
    }

    /**
     * 添加AI面板脉冲效果
     */
    addAIPulseEffect() {
        const aiPanel = document.getElementById('ai-thinking-panel');
        if (aiPanel) {
            aiPanel.classList.remove('ai-pulse');
            void aiPanel.offsetWidth; // 触发重排
            aiPanel.classList.add('ai-pulse');
        }
    }

    /**
     * 定期更新AI状态（每3秒）
     */
    startAIStatusUpdates() {
        // 每6秒更新一次AI状态，减少更新频率
        this.aiStatusInterval = setInterval(() => {
            this.updateAIStatusFromLogs();
        }, 6000);
    }

    /**
     * 从游戏日志更新AI状态
     */
    updateAIStatusFromLogs() {
        if (!this.currentGameLog || !this.currentGameState) return;

        try {
            const aiState = this.extractAIThinkingStates(this.currentGameLog, this.currentGameState);
            this.aiThinkingState = {
                players: aiState.players,
                summary: aiState.summary,
                lastUpdate: aiState.lastUpdate
            };

            // 更新UI
            this.updateAIThinkingPanel();

        } catch (error) {
            console.error('更新AI状态时出错:', error);
        }
    }

    /**
     * 获取阶段显示名称
     */
    getPhaseDisplayName(phaseType) {
        const displayNames = {
            'night': '夜间',
            'day': '白天',
            'investigate': '预言家查验',
            'eliminate': '狼人击杀',
            'protect': '医生保护',
            'bid': '竞拍发言',
            'debate': '辩论发言',
            'vote': '投票',
            'summary': '总结发言'
        };
        return displayNames[phaseType] || phaseType;
    }

    // 天亮公告防重复机制
    hasDawnAnnouncementForRound(round) {
        return this.dawnAnnouncements.has(round);
    }

    markDawnAnnouncementForRound(round) {
        this.dawnAnnouncements.add(round);
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
        }, 5000); // 每5秒更新一次，进一步降低频率
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
