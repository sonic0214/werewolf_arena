import { useEffect, useCallback, useRef } from 'react';
import { useGameStore, useGameActions, useCurrentGame, useGameView } from '@/lib/store/gameStore';
import { wsClient } from '@/lib/api/websocket';
import { GameUpdateMessage, RoundCompleteMessage, GameCompleteMessage } from '@/types/game';

export function useGame(sessionId?: string) {
  const currentGame = useCurrentGame();
  const gameView = useGameView();
  const actions = useGameActions();
  const pollIntervalRef = useRef<(() => void) | null>(null);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!sessionId || !currentGame || currentGame.status !== 'running') {
      return;
    }

    const connectWebSocket = async () => {
      try {
        await wsClient.connect(sessionId);

        // Set up event handlers
        wsClient.on('game_update', (message: GameUpdateMessage) => {
          actions.setCurrentGame(message.data.game_state);
          if (message.data.game_view) {
            actions.setGameView(message.data.game_view);
          }
        });

        wsClient.on('round_complete', (message: RoundCompleteMessage) => {
          actions.setMessage(`Round ${message.data.round.id} completed!`);
          // You can add more handling here, like showing round results
        });

        wsClient.on('game_complete', (message: GameCompleteMessage) => {
          actions.setCurrentGame(message.data.game_state);
          actions.setMessage(`Game completed! ${message.data.winner} win!`);
          actions.addNotification({
            type: 'success',
            title: 'Game Complete',
            message: `${message.data.winner} team won the game!`,
          });
        });

        wsClient.on('error', (error: Error) => {
          actions.setError(error.message);
        });

        wsClient.on('connect', () => {
          actions.setWebSocketConnected(true);
        });

        wsClient.on('disconnect', () => {
          actions.setWebSocketConnected(false);
        });

        actions.setWebSocketConnected(true);

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        actions.setWebSocketConnected(false);
        // Fall back to polling
        startPolling();
      }
    };

    connectWebSocket();

    return () => {
      wsClient.disconnect();
      actions.setWebSocketConnected(false);
      if (pollIntervalRef.current) {
        pollIntervalRef.current();
        pollIntervalRef.current = null;
      }
    };
  }, [sessionId, currentGame?.status, actions]);

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (!sessionId || pollIntervalRef.current) return;

    const { gamesAPI } = require('@/lib/api/games');
    pollIntervalRef.current = gamesAPI.pollGameStatus(
      sessionId,
      (status) => {
        actions.setCurrentGame(status.game_state || null);
        actions.setGameView(status.game_view || null);
      }
    );
  }, [sessionId, actions]);

  // Game actions
  const startGame = useCallback(async (request: any) => {
    await actions.startGame(request);
  }, [actions]);

  const stopGame = useCallback(async () => {
    if (!sessionId) return;
    await actions.stopGame(sessionId);
  }, [sessionId, actions]);

  const refreshGameStatus = useCallback(async () => {
    if (!sessionId) return;
    await actions.getGameStatus(sessionId);
  }, [sessionId, actions]);

  // Get specific player from current game
  const getPlayer = useCallback((playerId: number) => {
    return currentGame?.players.find(p => p.id === playerId) || null;
  }, [currentGame]);

  // Get current player's view
  const getCurrentPlayer = useCallback(() => {
    if (!gameView) return null;
    return getPlayer(gameView.player_id);
  }, [gameView, getPlayer]);

  // Check if player can perform specific action
  const canPlayerAct = useCallback((playerId: number, action: string) => {
    if (!gameView) return false;
    return gameView.player_id === playerId &&
           gameView.available_actions.includes(action);
  }, [gameView]);

  // Get game statistics
  const getGameStats = useCallback(() => {
    if (!currentGame) return null;

    const alivePlayers = currentGame.players.filter(p => p.alive);
    const deadPlayers = currentGame.players.filter(p => !p.alive);
    const werewolves = alivePlayers.filter(p => p.role === 'werewolf');
    const villagers = alivePlayers.filter(p => p.role !== 'werewolf');

    return {
      totalPlayers: currentGame.players.length,
      alivePlayers: alivePlayers.length,
      deadPlayers: deadPlayers.length,
      werewolves: werewolves.length,
      villagers: villagers.length,
      currentRound: currentGame.current_round?.id || '0',
      totalRounds: currentGame.rounds.length,
    };
  }, [currentGame]);

  // Get round history
  const getRoundHistory = useCallback(() => {
    return currentGame?.rounds || [];
  }, [currentGame]);

  // Get winner
  const getWinner = useCallback(() => {
    return currentGame?.winner || null;
  }, [currentGame]);

  return {
    // Data
    game: currentGame,
    gameView,
    player: getCurrentPlayer(),

    // Computed values
    stats: getGameStats(),
    roundHistory: getRoundHistory(),
    winner: getWinner(),

    // Actions
    startGame,
    stopGame,
    refreshGameStatus,
    getPlayer,
    canPlayerAct,

    // Status
    isConnected: wsClient.isConnected(),
    isRunning: currentGame?.status === 'running',
    isFinished: currentGame?.status === 'finished',
  };
}