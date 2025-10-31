'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GameState, Player } from '@/types/game';

interface GameStatsProps {
  gameState: GameState;
}

export function GameStats({ gameState }: GameStatsProps) {
  const { players, rounds, current_round, winner, settings } = gameState;

  const alivePlayers = players.filter(p => p.alive);
  const deadPlayers = players.filter(p => !p.alive);
  const aliveWerewolves = alivePlayers.filter(p => p.role === 'werewolf');
  const aliveVillagers = alivePlayers.filter(p => p.role === 'villager' || p.role === 'seer' || p.role === 'doctor');

  const werewolfWinRate = players.length > 0 ? (aliveWerewolves.length / players.length) * 100 : 0;
  const villagerWinRate = players.length > 0 ? (aliveVillagers.length / players.length) * 100 : 0;

  const getCurrentPhaseStats = () => {
    if (!current_round) return null;

    const phase = current_round.phase;
    const stats = {
      discussions: current_round.discussions?.length || 0,
      votes: current_round.votes?.length || 0,
      nightActions: current_round.night_actions?.length || 0,
    };

    return { phase, stats };
  };

  const getRoleDistribution = () => {
    const distribution = players.reduce((acc, player) => {
      acc[player.role] = (acc[player.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([role, count]) => ({
      role,
      count,
      aliveCount: players.filter(p => p.role === role && p.alive).length,
      deadCount: players.filter(p => p.role === role && !p.alive).length,
    }));
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'werewolf': return '狼人';
      case 'seer': return '预言家';
      case 'doctor': return '医生';
      case 'villager': return '村民';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'werewolf': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'seer': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'doctor': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'villager': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const currentPhaseStats = getCurrentPhaseStats();
  const roleDistribution = getRoleDistribution();

  return (
    <div className="space-y-6">
      {/* Overall Game Stats */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">游戏统计</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {alivePlayers.length}
              </div>
              <div className="text-sm text-gray-400">存活玩家</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {deadPlayers.length}
              </div>
              <div className="text-sm text-gray-400">淘汰玩家</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {rounds.length}
              </div>
              <div className="text-sm text-gray-400">总回合数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {settings.discussion_time_minutes}m
              </div>
              <div className="text-sm text-gray-400">讨论时长</div>
            </div>
          </div>

          {/* Win Rate Bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-red-400">狼人势力</span>
                <span className="text-sm text-gray-400">{werewolfWinRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${werewolfWinRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-blue-400">好人势力</span>
                <span className="text-sm text-gray-400">{villagerWinRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${villagerWinRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Phase Stats */}
      {currentPhaseStats && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">当前阶段统计</h2>

            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Badge variant={currentPhaseStats.phase.type === 'day' ? 'warning' : 'info'}>
                  {currentPhaseStats.phase.type === 'day' ? '白天' : '黑夜'}
                </Badge>
                <span className="text-gray-300">
                  第 {currentPhaseStats.phase.number} 回合
                </span>
                <span className="text-gray-400">
                  {currentPhaseStats.phase.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">
                  {currentPhaseStats.stats.discussions}
                </div>
                <div className="text-sm text-gray-400">讨论发言</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">
                  {currentPhaseStats.stats.votes}
                </div>
                <div className="text-sm text-gray-400">投票数</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">
                  {currentPhaseStats.stats.nightActions}
                </div>
                <div className="text-sm text-gray-400">夜晚行动</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Role Distribution */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">角色分布</h2>

          <div className="space-y-3">
            {roleDistribution.map(({ role, count, aliveCount, deadCount }) => (
              <div key={role} className="border border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${getRoleColor(role).split(' ')[0]}`}>
                    {getRoleName(role)}
                  </span>
                  <span className="text-sm text-gray-400">
                    总计 {count} 人
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-400">存活: {aliveCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-red-400">淘汰: {deadCount}</span>
                  </div>
                </div>

                <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${count > 0 ? (aliveCount / count) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Game Progress */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">游戏进度</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">回合进度</span>
                <span className="text-sm text-gray-400">
                  {rounds.length} / {settings.max_rounds}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${settings.max_rounds > 0 ? (rounds.length / settings.max_rounds) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {winner && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <Badge variant="success" className="mb-2">
                    游戏结束
                  </Badge>
                  <p className="text-lg font-semibold text-green-400">
                    {winner === 'werewolf' ? '狼人' : '好人'}阵营获胜！
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}