import { useEffect, useRef, useCallback } from 'react';
import { wsClient } from '@/lib/api/websocket';
import { useGameActions } from '@/lib/store/gameStore';
import { WebSocketMessage } from '@/types/game';

export function useWebSocket(sessionId?: string) {
  const { setWebSocketConnected, setError, setMessage } = useGameActions();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Handle connection
  const connect = useCallback(async () => {
    if (!sessionId) {
      console.warn('[useWebSocket] No sessionId provided, skipping connection');
      return false;
    }

    console.log('[useWebSocket] Attempting to connect with sessionId:', sessionId);

    try {
      await wsClient.connect(sessionId);
      reconnectAttempts.current = 0;
      console.log('[useWebSocket] Connection successful');
      return true;
    } catch (error) {
      console.error('[useWebSocket] Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to game';
      setError(errorMessage);
      return false;
    }
  }, [sessionId, setError]);

  // Handle disconnection
  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setWebSocketConnected(false);
  }, [setWebSocketConnected]);

  // Send message
  const sendMessage = useCallback((event: string, data?: any) => {
    wsClient.send(event, data);
  }, []);

  // Set up event handlers
  useEffect(() => {
    if (!sessionId) return;

    console.log('[useWebSocket] Setting up event handlers');

    // Game update handler
    wsClient.on('game_update', (message: WebSocketMessage) => {
      console.log('Game update received:', message);
      // Game store handles this in useGame hook
    });

    // Connection handlers
    wsClient.on('connect', () => {
      console.log('WebSocket connected');
      setWebSocketConnected(true);
      setMessage('Connected to game');
    });

    wsClient.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      setWebSocketConnected(false);

      if (reason === 'io server disconnect') {
        // Server disconnected, don't try to reconnect
        setMessage('Connection closed by server');
      } else {
        // Try to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setMessage(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          setTimeout(() => connect(), 1000 * reconnectAttempts.current);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      }
    });

    wsClient.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      setError(error.message);
    });

    return () => {
      console.log('[useWebSocket] Cleaning up event handlers');
      wsClient.off('game_update');
      wsClient.off('connect');
      wsClient.off('disconnect');
      wsClient.off('error');
    };
    // Only depend on sessionId and store setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-connect when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    console.log('[useWebSocket] useEffect triggered, connecting...');
    connect();

    return () => {
      console.log('[useWebSocket] useEffect cleanup, disconnecting...');
      wsClient.disconnect();
      setWebSocketConnected(false);
    };
    // Only depend on sessionId, not on connect/disconnect functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: wsClient.isConnected(),
    status: wsClient.getStatus(),
  };
}