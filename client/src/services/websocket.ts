import { io, Socket } from 'socket.io-client';
import type { CandleData, CandleUpdate } from '../types/candle';

// Re-export types for convenience
export type { CandleData, CandleUpdate } from '../types/candle';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('connected', (data) => {
      console.log('Server acknowledged connection:', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToSymbols(symbols: string[]) {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    console.log('📡 Subscribing to symbols:', symbols);
    this.socket.emit('subscribe', { symbols });
  }

  unsubscribeFromSymbols(symbols: string[]) {
    if (!this.socket?.connected) {
      console.warn('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    console.log('📡 Unsubscribing from symbols:', symbols);
    this.socket.emit('unsubscribe', { symbols });
  }

  requestWatchlist() {
    if (!this.socket?.connected) {
      console.warn('Cannot request watchlist: WebSocket not connected');
      return;
    }

    this.socket.emit('watchlist:request');
  }

  requestCandles(symbol: string, timeframe: string, limit = 100) {
    if (!this.socket?.connected) {
      console.warn('Cannot request candles: WebSocket not connected');
      return;
    }

    this.socket.emit('candles:request', { symbol, timeframe, limit });
  }

  onCandleUpdate(callback: (data: CandleUpdate) => void) {
    if (!this.socket) return;

    this.socket.on('candle:update', callback);
    return () => this.socket?.off('candle:update', callback);
  }

  onCandlesInitial(callback: (data: { symbol: string; timeframe: string; candles: CandleData[] }) => void) {
    if (!this.socket) return;

    this.socket.on('candles:initial', callback);
    return () => this.socket?.off('candles:initial', callback);
  }

  onCandlesResponse(callback: (data: { symbol: string; timeframe: string; candles: CandleData[]; count: number }) => void) {
    if (!this.socket) return;

    this.socket.on('candles:response', callback);
    return () => this.socket?.off('candles:response', callback);
  }

  onWatchlistResponse(callback: (data: { symbols: string[]; timestamp: string }) => void) {
    if (!this.socket) return;

    this.socket.on('watchlist:response', callback);
    return () => this.socket?.off('watchlist:response', callback);
  }

  onSubscribed(callback: (data: { symbols: string[]; subscriptions: string[] }) => void) {
    if (!this.socket) return;

    this.socket.on('subscribed', callback);
    return () => this.socket?.off('subscribed', callback);
  }

  onError(callback: (data: { message: string }) => void) {
    if (!this.socket) return;

    this.socket.on('error', callback);
    return () => this.socket?.off('error', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
