import { useEffect, useRef, useCallback } from 'react';
import { wsClient } from '@/lib/api/websocket';
import { useGameActions } from '@/lib/store/gameStore';
import { WebSocketMessage } from '@/types/game';

export function useWebSocket(sessionId?: string) {
  const actions = useGameActions();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Handle connection
  const connect = useCallback(async () => {
    if (!sessionId) return false;

    try {
      await wsClient.connect(sessionId);
      reconnectAttempts.current = 0;
      return true;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      actions.setError('Failed to connect to game');
      return false;
    }
  }, [sessionId, actions]);

  // Handle disconnection
  const disconnect = useCallback(() => {
    wsClient.disconnect();
    actions.setWebSocketConnected(false);
  }, [actions]);

  // Send message
  const sendMessage = useCallback((event: string, data?: any) => {
    wsClient.send(event, data);
  }, []);

  // Set up event handlers
  useEffect(() => {
    if (!sessionId) return;

    // Game update handler
    wsClient.on('game_update', (message: WebSocketMessage) => {
      console.log('Game update received:', message);
      // Game store handles this in useGame hook
    });

    // Connection handlers
    wsClient.on('connect', () => {
      console.log('WebSocket connected');
      actions.setWebSocketConnected(true);
      actions.setMessage('Connected to game');
    });

    wsClient.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      actions.setWebSocketConnected(false);

      if (reason === 'io server disconnect') {
        // Server disconnected, don't try to reconnect
        actions.setMessage('Connection closed by server');
      } else {
        // Try to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          actions.setMessage(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          setTimeout(connect, 1000 * reconnectAttempts.current);
        } else {
          actions.setError('Connection lost. Please refresh the page.');
        }
      }
    });

    wsClient.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      actions.setError(error.message);
    });

    return () => {
      wsClient.off('game_update');
      wsClient.off('connect');
      wsClient.off('disconnect');
      wsClient.off('error');
    };
  }, [sessionId, connect, actions]);

  // Auto-connect when sessionId changes
  useEffect(() => {
    if (sessionId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: wsClient.isConnected(),
    status: wsClient.getStatus(),
  };
}