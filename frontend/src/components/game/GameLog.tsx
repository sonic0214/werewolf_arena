'use client';

import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'action' | 'vote' | 'death' | 'game_start' | 'game_end' | 'phase_change';
  message: string;
  player_id?: number;
  player_name?: string;
  round_number?: number;
  phase?: string;
}

interface GameLogProps {
  logs: LogEntry[];
  autoScroll?: boolean;
  maxHeight?: string;
}

export function GameLog({ logs, autoScroll = true, maxHeight = '400px' }: GameLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      const container = logContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return 'text-blue-400';
      case 'action': return 'text-green-400';
      case 'vote': return 'text-yellow-400';
      case 'death': return 'text-red-400';
      case 'game_start': return 'text-purple-400';
      case 'game_end': return 'text-orange-400';
      case 'phase_change': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getLogTypeBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return { variant: 'info' as const, label: '信息' };
      case 'action': return { variant: 'success' as const, label: '行动' };
      case 'vote': return { variant: 'warning' as const, label: '投票' };
      case 'death': return { variant: 'danger' as const, label: '淘汰' };
      case 'game_start': return { variant: 'primary' as const, label: '开始' };
      case 'game_end': return { variant: 'secondary' as const, label: '结束' };
      case 'phase_change': return { variant: 'info' as const, label: '阶段' };
      default: return { variant: 'secondary' as const, label: '其他' };
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: zhCN
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">游戏日志</h2>
          <Badge variant="secondary" size="sm">
            {logs.length} 条记录
          </Badge>
        </div>

        <div
          ref={logContainerRef}
          className="space-y-2 overflow-y-auto pr-2"
          style={{ maxHeight }}
        >
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>暂无游戏日志</p>
            </div>
          ) : (
            logs.map((log) => {
              const badgeConfig = getLogTypeBadge(log.type);
              return (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex-shrink-0 pt-1">
                    <Badge variant={badgeConfig.variant} size="sm">
                      {badgeConfig.label}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {log.player_name && (
                        <span className="font-semibold text-yellow-400">
                          {log.player_name}
                        </span>
                      )}
                      <span className={`text-sm ${getLogTypeColor(log.type)}`}>
                        {log.message}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatTime(log.timestamp)}</span>
                      {log.round_number && (
                        <span>第 {log.round_number} 回合</span>
                      )}
                      {log.phase && (
                        <span>{log.phase}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

// Hook to parse game logs from game state
export function useGameLogs(gameState: any): LogEntry[] {
  const logs: LogEntry[] = [];

  if (!gameState) return logs;

  try {
    // Add game start log
    logs.push({
      id: 'game-start',
      timestamp: gameState.created_at || new Date().toISOString(),
      type: 'game_start',
      message: '游戏开始',
      round_number: 0,
    });

  // Add logs for each round
  gameState.rounds?.forEach((round: any, roundIndex: number) => {
    const roundNumber = roundIndex + 1;

    // Phase change log
    logs.push({
      id: `phase-${round.id}`,
      timestamp: gameState.updated_at, // This should be more precise
      type: 'phase_change',
      message: `进入${round.phase.name}阶段`,
      round_number: roundNumber,
      phase: round.phase.name,
    });

    // Discussion logs
    round.discussions?.forEach((discussion: any, discussionIndex: number) => {
      const player = gameState.players.find((p: any) => p.id === discussion.player_id);
      logs.push({
        id: `discussion-${round.id}-${discussionIndex}`,
        timestamp: discussion.timestamp,
        type: 'info',
        message: discussion.message,
        player_id: discussion.player_id,
        player_name: player?.name,
        round_number: roundNumber,
        phase: round.phase.name,
      });
    });

    // Vote logs
    round.votes?.forEach((vote: any, voteIndex: number) => {
      const voter = gameState.players.find((p: any) => p.id === vote.voter_id);
      const target = gameState.players.find((p: any) => p.id === vote.target_id);
      logs.push({
        id: `vote-${round.id}-${voteIndex}`,
        timestamp: gameState.updated_at, // This should be more precise
        type: 'vote',
        message: `投票给 ${target?.name}`,
        player_id: vote.voter_id,
        player_name: voter?.name,
        round_number: roundNumber,
        phase: round.phase.name,
      });
    });

    // Night action logs
    round.night_actions?.forEach((action: any, actionIndex: number) => {
      const player = gameState.players.find((p: any) => p.id === action.player_id);
      const target = action.target_id
        ? gameState.players.find((p: any) => p.id === action.target_id)
        : null;

      let actionMessage = '';
      switch (action.action) {
        case 'kill':
          actionMessage = `击杀了 ${target?.name}`;
          break;
        case 'save':
          actionMessage = `保护了 ${target?.name}`;
          break;
        case 'check':
          actionMessage = `查验了 ${target?.name}，结果是 ${action.result}`;
          break;
        default:
          actionMessage = `使用了 ${action.action}`;
      }

      logs.push({
        id: `action-${round.id}-${actionIndex}`,
        timestamp: gameState.updated_at, // This should be more precise
        type: action.action === 'kill' ? 'death' : 'action',
        message: actionMessage,
        player_id: action.player_id,
        player_name: player?.name,
        round_number: roundNumber,
        phase: round.phase.name,
      });
    });
  });

  // Add game end log if finished
  if (gameState.status === 'finished' && gameState.winner) {
    logs.push({
      id: 'game-end',
      timestamp: gameState.updated_at || new Date().toISOString(),
      type: 'game_end',
      message: `游戏结束！${gameState.winner === 'werewolf' ? '狼人' : '好人'}阵营获胜！`,
      round_number: gameState.rounds?.length || 0,
    });
  }

  } catch (error) {
    console.error('Error parsing game logs:', error);
    // Add error log entry
    logs.push({
      id: 'error',
      timestamp: new Date().toISOString(),
      type: 'info',
      message: '游戏日志解析错误',
      round_number: 0,
    });
  }

  return logs;
}