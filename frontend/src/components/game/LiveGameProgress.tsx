'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface CurrentActivity {
  type: 'waiting' | 'discussion' | 'voting' | 'night_action' | 'result';
  phase: string;
  round: number;
  description: string;
  participants?: string[];
  progress?: number;
}

interface LiveGameProgressProps {
  gameState: any;
  recentLogs?: any[];
}

export function LiveGameProgress({ gameState, recentLogs = [] }: LiveGameProgressProps) {
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (!gameState) return;

    const activity = analyzeCurrentActivity(gameState, recentLogs);
    setCurrentActivity(activity);

    setPulseAnimation(true);
    const timer = setTimeout(() => setPulseAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, [gameState, recentLogs]);

  if (!currentActivity) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          <p>Waiting for game to start...</p>
        </div>
      </Card>
    );
  }

  const getActivityIcon = () => {
    const icons = {
      waiting: '[WAIT]',
      discussion: '[TALK]',
      voting: '[VOTE]',
      night_action: '[NIGHT]',
      result: '[END]'
    };
    return icons[currentActivity.type] || '[GAME]';
  };

  const getActivityColor = () => {
    const colors = {
      waiting: 'bg-gray-600',
      discussion: 'bg-blue-600',
      voting: 'bg-yellow-600',
      night_action: 'bg-purple-600',
      result: 'bg-green-600'
    };
    return colors[currentActivity.type] || 'bg-gray-600';
  };

  return (
    <Card className={pulseAnimation ? 'ring-2 ring-blue-500 animate-pulse' : ''}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Current Progress</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getActivityColor()} animate-pulse`} />
            <Badge variant="secondary" size="sm">
              Round {currentActivity.round}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl font-mono text-gray-400">{getActivityIcon()}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{currentActivity.phase}</h3>
                <p className="text-sm text-gray-400">{currentActivity.description}</p>
              </div>
            </div>

            {currentActivity.progress !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{currentActivity.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getActivityColor()} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${currentActivity.progress}%` }}
                  />
                </div>
              </div>
            )}

            {currentActivity.participants && currentActivity.participants.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">
                  Active Players
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentActivity.participants.map((participant, idx) => (
                    <Badge key={idx} variant="primary" size="sm">
                      {participant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {recentLogs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Activity</h3>
              <div className="space-y-2">
                {recentLogs.slice(-3).reverse().map((log, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/50 rounded p-2 text-sm flex items-start space-x-2"
                  >
                    <span className="text-gray-500">{getLogIcon(log.type)}</span>
                    <div className="flex-1">
                      <p className="text-gray-300">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function analyzeCurrentActivity(gameState: any, recentLogs: any[]): CurrentActivity | null {
  if (!gameState) return null;

  const currentRound = gameState.current_round;
  const roundNumber = gameState.rounds?.length || 0;

  if (gameState.status === 'finished') {
    return {
      type: 'result',
      phase: 'Game Over',
      round: roundNumber,
      description: `${gameState.winner === 'werewolf' ? 'Werewolf' : 'Villager'} team wins!`,
    };
  }

  if (!currentRound) {
    return {
      type: 'waiting',
      phase: 'Preparing',
      round: roundNumber,
      description: 'Game is initializing...',
    };
  }

  const phase = currentRound.phase;
  if (!phase) {
    return {
      type: 'waiting',
      phase: 'Waiting',
      round: roundNumber,
      description: 'Waiting for next phase...',
    };
  }

  if (phase.type === 'night') {
    const nightActions = currentRound.night_actions || [];
    const totalNightActions = gameState.players?.filter((p: any) =>
      p.alive && (p.role === 'werewolf' || p.role === 'seer' || p.role === 'doctor')
    ).length || 0;

    return {
      type: 'night_action',
      phase: phase.name || 'Night',
      round: roundNumber,
      description: 'Players are performing night actions...',
      progress: totalNightActions > 0 ? Math.round((nightActions.length / totalNightActions) * 100) : 0,
      participants: nightActions.map((a: any) => {
        const player = gameState.players?.find((p: any) => p.id === a.player_id);
        return player?.name;
      }).filter(Boolean),
    };
  }

  if (phase.name?.includes('Discussion') || phase.name?.includes('discussion')) {
    const discussions = currentRound.discussions || [];
    const alivePlayers = gameState.players?.filter((p: any) => p.alive) || [];

    return {
      type: 'discussion',
      phase: phase.name || 'Day Discussion',
      round: roundNumber,
      description: 'Players are discussing...',
      progress: alivePlayers.length > 0 ? Math.round((discussions.length / alivePlayers.length) * 100) : 0,
      participants: discussions.map((d: any) => {
        const player = gameState.players?.find((p: any) => p.id === d.player_id);
        return player?.name;
      }).filter(Boolean),
    };
  }

  if (phase.name?.includes('Vote') || phase.name?.includes('vote') || phase.name?.includes('Voting')) {
    const votes = currentRound.votes || [];
    const alivePlayers = gameState.players?.filter((p: any) => p.alive) || [];

    return {
      type: 'voting',
      phase: phase.name || 'Voting',
      round: roundNumber,
      description: 'Players are voting...',
      progress: alivePlayers.length > 0 ? Math.round((votes.length / alivePlayers.length) * 100) : 0,
      participants: votes.map((v: any) => {
        const player = gameState.players?.find((p: any) => p.id === v.voter_id);
        return player?.name;
      }).filter(Boolean),
    };
  }

  return {
    type: 'waiting',
    phase: phase.name || 'Game in Progress',
    round: roundNumber,
    description: 'Game is running...',
  };
}

function getLogIcon(type: string): string {
  const icons: Record<string, string> = {
    action: '[ACT]',
    vote: '[VOTE]',
    death: '[X]',
    phase_change: '[>>]'
  };
  return icons[type] || '[LOG]';
}
