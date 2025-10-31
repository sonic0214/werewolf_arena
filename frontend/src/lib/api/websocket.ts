import { io, Socket } from 'socket.io-client';
import {
  WebSocketMessage,
  GameUpdateMessage,
  RoundCompleteMessage,
  GameCompleteMessage,
} from '@/types/game';

type WebSocketEventHandler = (data: any) => void;
type WebSocketErrorHandler = (error: Error) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url?: string) {
    this.url = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  }

  // Connect to WebSocket server
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        this.disconnect();
      }

      const wsUrl = `${this.url}${sessionId}`;
      console.log(`[WS] Connecting to ${wsUrl}`);

      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('[WS] Connected successfully');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WS] Connection error:', error);
        this.handleReconnect();
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WS] Disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          this.socket = null;
        } else {
          // Try to reconnect
          this.handleReconnect();
        }
      });

      // Handle incoming messages
      this.socket.on('message', (data: WebSocketMessage) => {
        this.handleMessage(data);
      });

      // Handle specific events
      this.setupEventHandlers();
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      console.log('[WS] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Send message to server
  send(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[WS] Cannot send message, not connected');
    }
  }

  // Event handlers
  private onGameUpdate?: WebSocketEventHandler;
  private onRoundComplete?: WebSocketEventHandler;
  private onGameComplete?: WebSocketEventHandler;
  private onError?: WebSocketErrorHandler;
  private onConnect?: WebSocketEventHandler;
  private onDisconnect?: WebSocketEventHandler;

  // Set event handlers
  on(event: 'game_update', handler: (data: GameUpdateMessage) => void): void;
  on(event: 'round_complete', handler: (data: RoundCompleteMessage) => void): void;
  on(event: 'game_complete', handler: (data: GameCompleteMessage) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'connect', handler: () => void): void;
  on(event: 'disconnect', handler: (reason: string) => void): void;
  on(event: string, handler: WebSocketEventHandler): void {
    switch (event) {
      case 'game_update':
        this.onGameUpdate = handler as (data: GameUpdateMessage) => void;
        break;
      case 'round_complete':
        this.onRoundComplete = handler as (data: RoundCompleteMessage) => void;
        break;
      case 'game_complete':
        this.onGameComplete = handler as (data: GameCompleteMessage) => void;
        break;
      case 'error':
        this.onError = handler as WebSocketErrorHandler;
        break;
      case 'connect':
        this.onConnect = handler;
        break;
      case 'disconnect':
        this.onDisconnect = handler;
        break;
    }
  }

  // Remove event handlers
  off(event: string): void {
    switch (event) {
      case 'game_update':
        this.onGameUpdate = undefined;
        break;
      case 'round_complete':
        this.onRoundComplete = undefined;
        break;
      case 'game_complete':
        this.onGameComplete = undefined;
        break;
      case 'error':
        this.onError = undefined;
        break;
      case 'connect':
        this.onConnect = undefined;
        break;
      case 'disconnect':
        this.onDisconnect = undefined;
        break;
    }
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    console.log('[WS] Received message:', message.type, message.data);

    try {
      switch (message.type) {
        case 'game_update':
          if (this.onGameUpdate) {
            this.onGameUpdate(message as GameUpdateMessage);
          }
          break;
        case 'round_complete':
          if (this.onRoundComplete) {
            this.onRoundComplete(message as RoundCompleteMessage);
          }
          break;
        case 'game_complete':
          if (this.onGameComplete) {
            this.onGameComplete(message as GameCompleteMessage);
          }
          break;
        case 'error':
          if (this.onError) {
            this.onError(new Error(message.data?.message || 'WebSocket error'));
          }
          break;
      }
    } catch (error) {
      console.error('[WS] Error handling message:', error);
      if (this.onError) {
        this.onError(error as Error);
      }
    }
  }

  // Setup specific event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('game_update', (data) => {
      if (this.onGameUpdate) {
        this.onGameUpdate(data);
      }
    });

    this.socket.on('round_complete', (data) => {
      if (this.onRoundComplete) {
        this.onRoundComplete(data);
      }
    });

    this.socket.on('game_complete', (data) => {
      if (this.onGameComplete) {
        this.onGameComplete(data);
      }
    });

    this.socket.on('error', (error) => {
      if (this.onError) {
        this.onError(error);
      }
    });
  }

  // Handle reconnection logic
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('[WS] Max reconnection attempts reached');
      if (this.onError) {
        this.onError(new Error('Max reconnection attempts reached'));
      }
    }
  }

  // Get connection status
  getStatus(): 'disconnected' | 'connecting' | 'connected' | 'reconnecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.socket.connecting || this.reconnectAttempts > 0) return 'connecting';
    return 'disconnected';
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient();

// Export class for custom instances
export { WebSocketClient };