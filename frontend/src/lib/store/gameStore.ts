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

          set({
            loading: 'success',
            currentGame: response.game_view.game_state,
            gameView: response.game_view,
            isGameRunning: true,
            message: 'Game started successfully!',
          });

          // Add to history
          get().addToHistory(response.game_view.game_state);

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
        const { gamesAPI } = await import('@/lib/api/games');

        try {
          const response = await gamesAPI.getGameStatus(sessionId);

          set({
            currentGame: response.game_state || null,
            gameView: response.game_view || null,
            isGameRunning: response.status === 'running',
            currentRound: response.game_state?.current_round?.id ?
              parseInt(response.game_state.current_round.id) : 0,
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
export const useGameActions = () => useGameStore((state) => ({
  setGameSettings: state.setGameSettings,
  setCurrentGame: state.setCurrentGame,
  setGameView: state.setGameView,
  setLoading: state.setLoading,
  setError: state.setError,
  setMessage: state.setMessage,
  setSelectedPlayer: state.setSelectedPlayer,
  startGame: state.startGame,
  stopGame: state.stopGame,
  getGameStatus: state.getGameStatus,
  reset: state.reset,
}));