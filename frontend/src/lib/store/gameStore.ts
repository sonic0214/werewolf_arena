import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  GameState,
  GameView,
  Player,
  Round,
  GameSettings,
  GameStartRequest
} from '@/types/game';
import { LoadingState, UIState } from '@/types';

interface GameStoreState extends UIState {
  // Game data
  currentGame: GameState | null;
  gameView: GameView | null;
  gameHistory: GameState[];

  // Settings
  gameSettings: GameSettings;

  // UI state
  isGameRunning: boolean;
  isWebSocketConnected: boolean;
  currentRound: number;
  selectedPlayerId: number | null;

  // Actions
  setGameSettings: (settings: Partial<GameSettings>) => void;
  setCurrentGame: (game: GameState | null) => void;
  setGameView: (view: GameView | null) => void;
  addToHistory: (game: GameState) => void;
  clearHistory: () => void;

  // UI actions
  setLoading: (loading: LoadingState) => void;
  setError: (error: string | undefined) => void;
  setMessage: (message: string | undefined) => void;
  setWebSocketConnected: (connected: boolean) => void;
  setSelectedPlayer: (playerId: number | null) => void;

  // Game actions
  startGame: (request: GameStartRequest) => Promise<void>;
  stopGame: (sessionId: string) => Promise<void>;
  getGameStatus: (sessionId: string) => Promise<void>;

  // Reset
  reset: () => void;
}

const initialState: Omit<GameStoreState, 'setGameSettings' | 'setCurrentGame' | 'setGameView' | 'addToHistory' | 'clearHistory' | 'setLoading' | 'setError' | 'setMessage' | 'setWebSocketConnected' | 'setSelectedPlayer' | 'startGame' | 'stopGame' | 'getGameStatus' | 'reset'> = {
  currentGame: null,
  gameView: null,
  gameHistory: [],
  gameSettings: {
    villager_models: [],
    werewolf_models: [],
    player_names: [],
    discussion_time_minutes: 5,
    max_rounds: 10,
  },
  isGameRunning: false,
  isWebSocketConnected: false,
  currentRound: 0,
  selectedPlayerId: null,
  loading: 'idle',
  error: undefined,
  message: undefined,
};

export const useGameStore = create<GameStoreState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // Settings actions
      setGameSettings: (newSettings) => {
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...newSettings },
        }));
      },

      // Game data actions
      setCurrentGame: (game) => {
        set({
          currentGame: game,
          isGameRunning: game?.status === 'running',
          currentRound: game?.current_round?.id ? parseInt(game.current_round.id) : 0,
        });
      },

      setGameView: (view) => {
        set({ gameView: view });
      },

      addToHistory: (game) => {
        set((state) => ({
          gameHistory: [game, ...state.gameHistory].slice(0, 10), // Keep last 10 games
        }));
      },

      clearHistory: () => {
        set({ gameHistory: [] });
      },

      // UI actions
      setLoading: (loading) => {
        set({ loading });
        if (loading === 'loading') {
          set({ error: undefined });
        }
      },

      setError: (error) => {
        set({ error, loading: 'error' });
      },

      setMessage: (message) => {
        set({ message });
      },

      setWebSocketConnected: (connected) => {
        set({ isWebSocketConnected: connected });
      },

      setSelectedPlayer: (playerId) => {
        set({ selectedPlayerId: playerId });
      },

      // Game actions
      startGame: async (request) => {
        const { gamesAPI } = await import('@/lib/api/games');

        set({ loading: 'loading', error: undefined });

        try {
          const response = await gamesAPI.startGame(request);

          // Create a basic game state from the start response
          const initialGameState = {
            session_id: response.session_id,
            status: 'running' as const,
            current_round: undefined,
            rounds: [],
            players: [],
            winner: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            settings: {
              villager_models: [request.villager_model],
              werewolf_models: [request.werewolf_model],
              player_names: request.player_names || [],
              discussion_time_minutes: request.discussion_time_minutes || 5,
              max_rounds: request.max_rounds || 10
            }
          };

          set({
            loading: 'success',
            currentGame: initialGameState,
            gameView: null, // API doesn't return game_view in current format
            isGameRunning: true,
            message: 'Game started successfully!',
          });

          // Add to history
          get().addToHistory(initialGameState);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
          set({
            loading: 'error',
            error: errorMessage,
            isGameRunning: false,
          });
        }
      },

      stopGame: async (sessionId) => {
        const { gamesAPI } = await import('@/lib/api/games');

        set({ loading: 'loading', error: undefined });

        try {
          await gamesAPI.stopGame(sessionId);

          set({
            loading: 'success',
            isGameRunning: false,
            message: 'Game stopped successfully',
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to stop game';
          set({
            loading: 'error',
            error: errorMessage,
          });
        }
      },

      getGameStatus: async (sessionId) => {
        console.log('getGameStatus called with sessionId:', sessionId);
        const { gamesAPI } = await import('@/lib/api/games');

        try {
          console.log('Calling gamesAPI.getGameStatus...');
          const response = await gamesAPI.getGameStatus(sessionId);
          console.log('API response:', response);

          if (!response) {
            console.log('No response from API');
            set({ error: 'No response from API' });
            return;
          }

          // Handle both wrapped and unwrapped API responses
          const data = response.data || response; // Handle both formats
          console.log('Processed data:', data);

          if (!data) {
            console.log('No data in response');
            set({ error: 'No data in API response' });
            return;
          }

          // Convert flat API response to GameState format
          const gameState = {
            session_id: data.session_id,
            status: data.status,
            current_round: data.current_round ? {
              id: data.current_round.toString(),
              phase: {
                name: 'Unknown',
                type: 'day',
                number: data.current_round
              }
            } : undefined,
            players: data.players?.map(p => ({
              id: Math.random(), // Generate temporary ID
              name: p.name,
              role: p.role.toLowerCase(),
              alive: p.alive,
              model: p.model
            })) || [],
            rounds: data.rounds?.map((r, idx) => ({
              id: r.round_number.toString(),
              phase: {
                name: 'Round ' + r.round_number,
                type: 'day',
                number: r.round_number
              },
              players: r.players_alive || [],
              discussions: [],
              votes: [],
              night_actions: []
            })) || [],
            winner: data.winner || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            settings: {
              villager_models: [],
              werewolf_models: [],
              player_names: data.players?.map(p => p.name) || [],
              discussion_time_minutes: 5,
              max_rounds: 10
            }
          };

          set({
            currentGame: gameState,
            gameView: null, // API doesn't return game_view in current format
            isGameRunning: data.status === 'running',
            currentRound: data.current_round || 0,
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get game status';
          set({ error: errorMessage });
        }
      },

      // Reset store
      reset: () => {
        set(initialState);
      },
    })),
    {
      name: 'game-store',
    }
  )
);

// Selectors
export const useCurrentGame = () => useGameStore((state) => state.currentGame);
export const useGameView = () => useGameStore((state) => state.gameView);
export const useGameSettings = () => useGameStore((state) => state.gameSettings);
export const useIsGameRunning = () => useGameStore((state) => state.isGameRunning);
export const useGameLoading = () => useGameStore((state) => state.loading);
export const useGameError = () => useGameStore((state) => state.error);
export const useGameMessage = () => useGameStore((state) => state.message);
export const useSelectedPlayer = () => useGameStore((state) => state.selectedPlayerId);
export const useCurrentRound = () => useGameStore((state) => state.currentRound);
export const useGameHistory = () => useGameStore((state) => state.gameHistory);
export const useWebSocketStatus = () => useGameStore((state) => state.isWebSocketConnected);

// Actions
export const useGameActions = () => {
  const setGameSettings = useGameStore((state) => state.setGameSettings);
  const setCurrentGame = useGameStore((state) => state.setCurrentGame);
  const setGameView = useGameStore((state) => state.setGameView);
  const setLoading = useGameStore((state) => state.setLoading);
  const setError = useGameStore((state) => state.setError);
  const setMessage = useGameStore((state) => state.setMessage);
  const setWebSocketConnected = useGameStore((state) => state.setWebSocketConnected);
  const setSelectedPlayer = useGameStore((state) => state.setSelectedPlayer);
  const startGame = useGameStore((state) => state.startGame);
  const stopGame = useGameStore((state) => state.stopGame);
  const getGameStatus = useGameStore((state) => state.getGameStatus);
  const reset = useGameStore((state) => state.reset);

  return {
    setGameSettings,
    setCurrentGame,
    setGameView,
    setLoading,
    setError,
    setMessage,
    setWebSocketConnected,
    setSelectedPlayer,
    startGame,
    stopGame,
    getGameStatus,
    reset,
  };
};