'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'action' | 'vote' | 'death' | 'game_start' | 'game_end' | 'phase_change' | 'debug' | 'error';
  level?: string;
  message: string;
  player_id?: number;
  player_name?: string;
  round_number?: number;
  phase?: string;
  metadata?: Record<string, any>;
}

interface GameLogProps {
  logs: LogEntry[];
  autoScroll?: boolean;
  maxHeight?: string;
  showFilters?: boolean;
  onExport?: () => void;
}

export function GameLog({
  logs,
  autoScroll = true,
  maxHeight = '400px',
  showFilters = false,
  onExport
}: GameLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      const container = logContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filter logs based on type and search
  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'all' || log.type === filter;
    const matchesSearch = searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.player_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return 'text-blue-400';
      case 'action': return 'text-green-400';
      case 'vote': return 'text-yellow-400';
      case 'death': return 'text-red-400';
      case 'game_start': return 'text-purple-400';
      case 'game_end': return 'text-orange-400';
      case 'phase_change': return 'text-cyan-400';
      case 'debug': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getLogTypeBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return { variant: 'secondary' as const, label: 'Info' };
      case 'action': return { variant: 'success' as const, label: 'Action' };
      case 'vote': return { variant: 'warning' as const, label: 'Vote' };
      case 'death': return { variant: 'danger' as const, label: 'Death' };
      case 'game_start': return { variant: 'primary' as const, label: 'Start' };
      case 'game_end': return { variant: 'secondary' as const, label: 'End' };
      case 'phase_change': return { variant: 'primary' as const, label: 'Phase' };
      case 'debug': return { variant: 'secondary' as const, label: 'Debug' };
      case 'error': return { variant: 'danger' as const, label: 'Error' };
      default: return { variant: 'secondary' as const, label: 'Other' };
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
          <h2 className="text-xl font-bold">Game Logs</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" size="sm">
              {filteredLogs.length} / {logs.length}
            </Badge>
            {onExport && (
              <Button variant="secondary" size="sm" onClick={onExport}>
                Export
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="action">Action</option>
                <option value="vote">Vote</option>
                <option value="death">Death</option>
                <option value="phase_change">Phase</option>
                <option value="game_start">Start</option>
                <option value="game_end">End</option>
                <option value="debug">Debug</option>
                <option value="error">Error</option>
              </select>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
              />
            </div>
          </div>
        )}

        <div
          ref={logContainerRef}
          className="space-y-2 overflow-y-auto pr-2"
          style={{ maxHeight }}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>{logs.length === 0 ? 'No logs yet' : 'No matching logs'}</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
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
                        <span>Round {log.round_number}</span>
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
    logs.push({
      id: 'game-start',
      timestamp: gameState.created_at || new Date().toISOString(),
      type: 'game_start',
      message: 'Game Started',
      round_number: 0,
    });

  gameState.rounds?.forEach((round: any, roundIndex: number) => {
    const roundNumber = roundIndex + 1;

    logs.push({
      id: `phase-${round.id}`,
      timestamp: gameState.updated_at,
      type: 'phase_change',
      message: `Entering ${round.phase?.name || 'new phase'}`,
      round_number: roundNumber,
      phase: round.phase?.name,
    });

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
        phase: round.phase?.name,
      });
    });

    round.votes?.forEach((vote: any, voteIndex: number) => {
      const voter = gameState.players.find((p: any) => p.id === vote.voter_id);
      const target = gameState.players.find((p: any) => p.id === vote.target_id);
      logs.push({
        id: `vote-${round.id}-${voteIndex}`,
        timestamp: gameState.updated_at,
        type: 'vote',
        message: `voted for ${target?.name}`,
        player_id: vote.voter_id,
        player_name: voter?.name,
        round_number: roundNumber,
        phase: round.phase?.name,
      });
    });

    round.night_actions?.forEach((action: any, actionIndex: number) => {
      const player = gameState.players.find((p: any) => p.id === action.player_id);
      const target = action.target_id
        ? gameState.players.find((p: any) => p.id === action.target_id)
        : null;

      let actionMessage = '';
      switch (action.action) {
        case 'kill':
          actionMessage = `killed ${target?.name}`;
          break;
        case 'save':
          actionMessage = `protected ${target?.name}`;
          break;
        case 'check':
          actionMessage = `investigated ${target?.name}, result: ${action.result}`;
          break;
        default:
          actionMessage = `used ${action.action}`;
      }

      logs.push({
        id: `action-${round.id}-${actionIndex}`,
        timestamp: gameState.updated_at,
        type: action.action === 'kill' ? 'death' : 'action',
        message: actionMessage,
        player_id: action.player_id,
        player_name: player?.name,
        round_number: roundNumber,
        phase: round.phase?.name,
      });
    });
  });

  if (gameState.status === 'finished' && gameState.winner) {
    logs.push({
      id: 'game-end',
      timestamp: gameState.updated_at || new Date().toISOString(),
      type: 'game_end',
      message: `Game Over! ${gameState.winner === 'werewolf' ? 'Werewolf' : 'Villager'} team wins!`,
      round_number: gameState.rounds?.length || 0,
    });
  }

  } catch (error) {
    console.error('Error parsing game logs:', error);
    logs.push({
      id: 'error',
      timestamp: new Date().toISOString(),
      type: 'error',
      message: 'Error parsing game logs',
      round_number: 0,
    });
  }

  return logs;
}