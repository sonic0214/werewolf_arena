'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Interaction {
  from: string;
  to: string;
  type: 'vote' | 'attack' | 'protect' | 'investigate';
  round: number;
  timestamp: string;
}

interface PlayerInteractionsProps {
  players: any[];
  interactions: Interaction[];
  currentRound?: number;
}

export function PlayerInteractions({
  players,
  interactions,
  currentRound,
}: PlayerInteractionsProps) {
  const interactionCounts: Record<string, Record<string, number>> = {};

  interactions.forEach((interaction) => {
    if (!interactionCounts[interaction.from]) {
      interactionCounts[interaction.from] = {};
    }
    if (!interactionCounts[interaction.from][interaction.to]) {
      interactionCounts[interaction.from][interaction.to] = 0;
    }
    interactionCounts[interaction.from][interaction.to]++;
  });

  const getInteractionIcon = (type: Interaction['type']) => {
    const icons = {
      vote: '[VOTE]',
      attack: '[ATK]',
      protect: '[DEF]',
      investigate: '[INV]'
    };
    return icons[type] || '[?]';
  };

  const getInteractionColor = (type: Interaction['type']) => {
    const colors = {
      vote: 'text-yellow-400',
      attack: 'text-red-400',
      protect: 'text-green-400',
      investigate: 'text-blue-400'
    };
    return colors[type] || 'text-gray-400';
  };

  const recentInteractions = interactions
    .slice(-10)
    .reverse();

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Player Interactions</h2>
          <Badge variant="secondary" size="sm">
            {interactions.length} interactions
          </Badge>
        </div>

        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Interaction Network</h3>
          <div className="space-y-2">
            {players.map((player) => {
              const outgoingInteractions = Object.entries(
                interactionCounts[player.name] || {}
              );

              if (outgoingInteractions.length === 0) return null;

              return (
                <div key={player.id} className="flex items-center space-x-2">
                  <Badge
                    variant={player.alive ? 'primary' : 'danger'}
                    size="sm"
                    className="w-24 justify-center"
                  >
                    {player.name}
                  </Badge>
                  <div className="flex-1 flex items-center space-x-1 overflow-x-auto">
                    {outgoingInteractions.map(([target, count]) => (
                      <div
                        key={target}
                        className="flex items-center space-x-1 bg-gray-700 rounded px-2 py-1"
                      >
                        <span className="text-gray-400">-&gt;</span>
                        <span className="text-sm">{target}</span>
                        {count > 1 && (
                          <Badge variant="secondary" size="sm">
                            x{count}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Interactions</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentInteractions.map((interaction, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 rounded p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className={`text-lg ${getInteractionColor(interaction.type)}`}>
                    {getInteractionIcon(interaction.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-400">
                        {interaction.from}
                      </span>
                      <span className="text-gray-500">-&gt;</span>
                      <span className="font-semibold text-yellow-400">
                        {interaction.to}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getInteractionDescription(interaction)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" size="sm">
                    R{interaction.round}
                  </Badge>
                </div>
              </div>
            ))}

            {recentInteractions.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>No interactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function getInteractionDescription(interaction: Interaction): string {
  const time = new Date(interaction.timestamp).toLocaleTimeString();

  const descriptions: Record<string, string> = {
    vote: `Vote - ${time}`,
    attack: `Attack - ${time}`,
    protect: `Protect - ${time}`,
    investigate: `Investigate - ${time}`
  };

  return descriptions[interaction.type] || time;
}

export function generateInteractions(gameState: any): Interaction[] {
  const interactions: Interaction[] = [];

  if (!gameState || !gameState.rounds) return interactions;

  gameState.rounds.forEach((round: any, roundIndex: number) => {
    const roundNumber = roundIndex + 1;

    round.votes?.forEach((vote: any) => {
      const voter = gameState.players?.find((p: any) => p.id === vote.voter_id);
      const target = gameState.players?.find((p: any) => p.id === vote.target_id);

      if (voter && target) {
        interactions.push({
          from: voter.name,
          to: target.name,
          type: 'vote',
          round: roundNumber,
          timestamp: gameState.updated_at || new Date().toISOString(),
        });
      }
    });

    round.night_actions?.forEach((action: any) => {
      const player = gameState.players?.find((p: any) => p.id === action.player_id);
      const target = action.target_id
        ? gameState.players?.find((p: any) => p.id === action.target_id)
        : null;

      if (player && target) {
        let type: Interaction['type'] = 'attack';

        if (action.action === 'kill') {
          type = 'attack';
        } else if (action.action === 'save') {
          type = 'protect';
        } else if (action.action === 'check') {
          type = 'investigate';
        }

        interactions.push({
          from: player.name,
          to: target.name,
          type,
          round: roundNumber,
          timestamp: gameState.updated_at || new Date().toISOString(),
        });
      }
    });
  });

  return interactions;
}
