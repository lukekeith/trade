import { Server as SocketIOServer, Socket } from 'socket.io';
import { CandleModel } from '../models/candle.model';
import { WatchlistModel } from '../models/watchlist.model';
import { Timeframe } from '../types';

/**
 * WebSocket service for managing client connections and subscriptions
 */
export class WebSocketService {
  private io: SocketIOServer;
  private subscriptions: Map<string, Set<string>> = new Map(); // socketId -> Set<symbol>

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Initialize subscriptions for this socket
      this.subscriptions.set(socket.id, new Set());

      // Handle subscription requests
      socket.on('subscribe', async (data: { symbols?: string[], symbol?: string }) => {
        await this.handleSubscribe(socket, data);
      });

      // Handle unsubscribe requests
      socket.on('unsubscribe', (data: { symbols?: string[], symbol?: string }) => {
        this.handleUnsubscribe(socket, data);
      });

      // Handle requests for historical data
      socket.on('candles:request', async (data: { symbol: string, timeframe: Timeframe, limit?: number }) => {
        await this.handleCandleRequest(socket, data);
      });

      // Handle watchlist requests
      socket.on('watchlist:request', async () => {
        await this.handleWatchlistRequest(socket);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Trade platform',
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    console.log('WebSocket service initialized');
  }

  /**
   * Handle client subscription to symbols
   */
  private async handleSubscribe(socket: Socket, data: { symbols?: string[], symbol?: string }) {
    try {
      const symbols = data.symbols || (data.symbol ? [data.symbol] : []);

      if (symbols.length === 0) {
        socket.emit('error', { message: 'No symbols provided' });
        return;
      }

      const socketSubscriptions = this.subscriptions.get(socket.id);
      if (!socketSubscriptions) return;

      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();

        // Add to socket's subscriptions
        socketSubscriptions.add(upperSymbol);

        // Join symbol-specific room
        socket.join(`symbol:${upperSymbol}`);

        console.log(`Client ${socket.id} subscribed to ${upperSymbol}`);
      }

      // Send confirmation
      socket.emit('subscribed', {
        symbols,
        subscriptions: Array.from(socketSubscriptions)
      });

      // Send initial data for subscribed symbols
      for (const symbol of symbols) {
        await this.sendInitialData(socket, symbol.toUpperCase());
      }

    } catch (error) {
      console.error('Error handling subscribe:', error);
      socket.emit('error', { message: 'Failed to subscribe to symbols' });
    }
  }

  /**
   * Handle client unsubscribe from symbols
   */
  private handleUnsubscribe(socket: Socket, data: { symbols?: string[], symbol?: string }) {
    try {
      const symbols = data.symbols || (data.symbol ? [data.symbol] : []);
      const socketSubscriptions = this.subscriptions.get(socket.id);

      if (!socketSubscriptions) return;

      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();

        // Remove from socket's subscriptions
        socketSubscriptions.delete(upperSymbol);

        // Leave symbol-specific room
        socket.leave(`symbol:${upperSymbol}`);

        console.log(`Client ${socket.id} unsubscribed from ${upperSymbol}`);
      }

      // Send confirmation
      socket.emit('unsubscribed', {
        symbols,
        subscriptions: Array.from(socketSubscriptions)
      });

    } catch (error) {
      console.error('Error handling unsubscribe:', error);
      socket.emit('error', { message: 'Failed to unsubscribe from symbols' });
    }
  }

  /**
   * Send initial data for a symbol to a client
   */
  private async sendInitialData(socket: Socket, symbol: string) {
    try {
      // Fetch latest candles for each timeframe
      const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '1d'];

      for (const timeframe of timeframes) {
        const candles = await CandleModel.findBySymbolAndTimeframe(symbol, timeframe, { limit: 100 });

        if (candles.length > 0) {
          socket.emit('candles:initial', {
            symbol,
            timeframe,
            candles
          });
        }
      }

    } catch (error) {
      console.error(`Error sending initial data for ${symbol}:`, error);
    }
  }

  /**
   * Handle candle data requests
   */
  private async handleCandleRequest(socket: Socket, data: { symbol: string, timeframe: Timeframe, limit?: number }) {
    try {
      const { symbol, timeframe, limit = 100 } = data;

      const candles = await CandleModel.findBySymbolAndTimeframe(
        symbol.toUpperCase(),
        timeframe,
        { limit }
      );

      socket.emit('candles:response', {
        symbol: symbol.toUpperCase(),
        timeframe,
        candles,
        count: candles.length
      });

    } catch (error) {
      console.error('Error handling candle request:', error);
      socket.emit('error', { message: 'Failed to fetch candle data' });
    }
  }

  /**
   * Handle watchlist requests
   */
  private async handleWatchlistRequest(socket: Socket) {
    try {
      const symbols = await WatchlistModel.getSymbols();

      socket.emit('watchlist:response', {
        symbols,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling watchlist request:', error);
      socket.emit('error', { message: 'Failed to fetch watchlist' });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);

    // Clean up subscriptions
    this.subscriptions.delete(socket.id);
  }

  /**
   * Broadcast candle update to all subscribed clients
   */
  broadcastCandle(symbol: string, timeframe: Timeframe, candle: any) {
    this.io.to(`symbol:${symbol}`).emit('candle:update', {
      symbol,
      timeframe,
      candle,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Broadcast trend updates to all connected clients
   */
  broadcastTrends(trendsData: any) {
    this.io.emit('trends:update', trendsData);
    console.log('📊 Broadcast trends to', this.subscriptions.size, 'clients');
  }

  /**
   * Get current subscription stats
   */
  getStats() {
    const totalClients = this.subscriptions.size;
    const subscriptionCounts: Record<string, number> = {};

    this.subscriptions.forEach((symbols) => {
      symbols.forEach((symbol) => {
        subscriptionCounts[symbol] = (subscriptionCounts[symbol] || 0) + 1;
      });
    });

    return {
      totalClients,
      subscriptionCounts
    };
  }
}
