'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TimelineEvent {
  id: string;
  type: 'round_start' | 'phase_change' | 'death' | 'vote' | 'action' | 'game_end';
  timestamp: string;
  round: number;
  phase?: string;
  title: string;
  description: string;
  players?: string[];
  isLatest?: boolean;
}

interface GameTimelineProps {
  events: TimelineEvent[];
  maxHeight?: string;
}

export function GameTimeline({ events, maxHeight = '500px' }: GameTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    const icons = {
      round_start: '[START]',
      phase_change: '[PHASE]',
      death: '[DEATH]',
      vote: '[VOTE]',
      action: '[ACTION]',
      game_end: '[END]'
    };
    return icons[type] || '[EVENT]';
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    const colors = {
      round_start: 'bg-blue-500',
      phase_change: 'bg-purple-500',
      death: 'bg-red-500',
      vote: 'bg-yellow-500',
      action: 'bg-green-500',
      game_end: 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Game Timeline</h2>
          <Badge variant="secondary" size="sm">
            {events.length} events
          </Badge>
        </div>

        <div className="relative" style={{ maxHeight, overflowY: 'auto' }}>
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={`relative pl-14 pb-4 ${event.isLatest ? 'animate-pulse' : ''}`}
              >
                <div
                  className={`absolute left-4 top-1 w-5 h-5 rounded-full ${getEventColor(
                    event.type
                  )} border-4 border-gray-900 flex items-center justify-center text-xs`}
                >
                  {event.isLatest && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-75" />
                  )}
                </div>

                <div
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-750 ${
                    event.isLatest ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-400">{getEventIcon(event.type)}</span>
                      <h3 className="font-semibold text-white">{event.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" size="sm">
                        Round {event.round}
                      </Badge>
                      {event.phase && (
                        <Badge variant="secondary" size="sm">
                          {event.phase}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-2">{event.description}</p>

                  {expandedEvents.has(event.id) && event.players && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-400 mb-2">
                        Related Players:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {event.players.map((player, idx) => (
                          <Badge key={idx} variant="primary" size="sm">
                            {player}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {events.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <p>No events yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function generateTimelineEvents(gameState: any): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (!gameState) return events;

  events.push({
    id: 'game-start',
    type: 'round_start',
    timestamp: gameState.created_at || new Date().toISOString(),
    round: 0,
    title: 'Game Start',
    description: `Game started with ${gameState.players?.length || 0} players`,
    players: gameState.players?.map((p: any) => p.name),
  });

  gameState.rounds?.forEach((round: any, roundIndex: number) => {
    const roundNumber = roundIndex + 1;

    events.push({
      id: `round-${round.id}-start`,
      type: 'round_start',
      timestamp: gameState.updated_at,
      round: roundNumber,
      title: `Round ${roundNumber} Start`,
      description: `Entering round ${roundNumber}`,
    });

    if (round.phase) {
      events.push({
        id: `round-${round.id}-phase`,
        type: 'phase_change',
        timestamp: gameState.updated_at,
        round: roundNumber,
        phase: round.phase.name,
        title: `Phase Change`,
        description: `Entering ${round.phase.name}`,
      });
    }

    round.night_actions?.forEach((action: any, actionIndex: number) => {
      const player = gameState.players.find((p: any) => p.id === action.player_id);
      const target = action.target_id
        ? gameState.players.find((p: any) => p.id === action.target_id)
        : null;

      let actionDescription = '';
      if (action.action === 'kill') {
        actionDescription = `${player?.name} killed ${target?.name}`;
      } else if (action.action === 'save') {
        actionDescription = `${player?.name} protected ${target?.name}`;
      } else if (action.action === 'check') {
        actionDescription = `${player?.name} investigated ${target?.name}`;
      } else {
        actionDescription = `${player?.name} used ${action.action}`;
      }

      events.push({
        id: `action-${round.id}-${actionIndex}`,
        type: 'action',
        timestamp: gameState.updated_at,
        round: roundNumber,
        phase: round.phase?.name,
        title: 'Night Action',
        description: actionDescription,
        players: target ? [player?.name, target?.name] : [player?.name],
      });
    });

    round.votes?.forEach((vote: any, voteIndex: number) => {
      const voter = gameState.players.find((p: any) => p.id === vote.voter_id);
      const target = gameState.players.find((p: any) => p.id === vote.target_id);

      events.push({
        id: `vote-${round.id}-${voteIndex}`,
        type: 'vote',
        timestamp: gameState.updated_at,
        round: roundNumber,
        phase: round.phase?.name,
        title: 'Vote',
        description: `${voter?.name} voted for ${target?.name}`,
        players: [voter?.name, target?.name],
      });
    });

    const previousPlayers = roundIndex > 0 ? gameState.rounds[roundIndex - 1].players : gameState.players.map((p: any) => p.name);
    const currentPlayers = round.players || [];
    const deadPlayers = previousPlayers.filter((p: string) => !currentPlayers.includes(p));

    deadPlayers.forEach((playerName: string) => {
      events.push({
        id: `death-${round.id}-${playerName}`,
        type: 'death',
        timestamp: gameState.updated_at,
        round: roundNumber,
        phase: round.phase?.name,
        title: 'Player Eliminated',
        description: `${playerName} was eliminated`,
        players: [playerName],
      });
    });
  });

  if (gameState.status === 'finished' && gameState.winner) {
    events.push({
      id: 'game-end',
      type: 'game_end',
      timestamp: gameState.updated_at || new Date().toISOString(),
      round: gameState.rounds?.length || 0,
      title: 'Game End',
      description: `${gameState.winner === 'werewolf' ? 'Werewolf' : 'Villager'} team wins!`,
    });
  }

  if (events.length > 0) {
    events[events.length - 1].isLatest = true;
  }

  return events;
}
