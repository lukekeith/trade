import cron, { ScheduledTask } from 'node-cron';
import { YahooFinanceService } from './yahoo-finance.service';
import { PythonCalculationService } from './python-calculation.service';
import { CandleModel } from '../models/candle.model';
import { TrendModel } from '../models/trend.model';
import { WatchlistModel } from '../models/watchlist.model';
import { Timeframe } from '../types';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Polling service to fetch latest market data at regular intervals
 */
export class PollingService {
  private static cronJob: ScheduledTask | null = null;
  private static io: SocketIOServer | null = null;
  private static isPolling: boolean = false;
  private static lastFetchTime: Map<string, number> = new Map();
  private static readonly MIN_FETCH_INTERVAL = 5000; // 5 seconds minimum between fetches

  /**
   * Initialize the polling service with Socket.IO server
   */
  static init(io: SocketIOServer) {
    this.io = io;
    console.log('Polling service initialized');
  }

  /**
   * Start polling for price updates
   * @param interval - Cron expression (default: every 5 seconds)
   */
  static start(interval: string = '*/5 * * * * *') {
    if (this.cronJob) {
      console.log('Polling service already running');
      return;
    }

    console.log(`Starting polling service with interval: ${interval}`);

    this.cronJob = cron.schedule(interval, async () => {
      if (this.isPolling) {
        console.log('Previous polling still in progress, skipping...');
        return;
      }

      this.isPolling = true;
      try {
        await this.pollMarketData();
      } catch (error) {
        console.error('Error during polling:', error);
      } finally {
        this.isPolling = false;
      }
    });

    console.log('Polling service started');
  }

  /**
   * Stop the polling service
   */
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Polling service stopped');
    }
  }

  /**
   * Poll market data for all symbols in watchlist
   */
  private static async pollMarketData() {
    try {
      // Get all symbols from watchlist
      const symbols = await WatchlistModel.getSymbols();

      if (!symbols || symbols.length === 0) {
        console.log('No symbols in watchlist to poll');
        return;
      }

      console.log(`Polling data for ${symbols.length} symbols: ${symbols.join(', ')}`);

      // Fetch data for each symbol with rate limiting
      const promises = symbols.map((symbol: string) => this.fetchSymbolData(symbol));
      const results = await Promise.allSettled(promises);

      // Log results
      const successful = results.filter((r: PromiseSettledResult<void>) => r.status === 'fulfilled').length;
      const failed = results.filter((r: PromiseSettledResult<void>) => r.status === 'rejected').length;
      console.log(`Polling complete: ${successful} successful, ${failed} failed`);

    } catch (error) {
      console.error('Error polling market data:', error);
    }
  }

  /**
   * Fetch data for a single symbol with rate limiting
   */
  private static async fetchSymbolData(symbol: string): Promise<void> {
    try {
      // Check rate limiting
      const now = Date.now();
      const lastFetch = this.lastFetchTime.get(symbol) || 0;

      if (now - lastFetch < this.MIN_FETCH_INTERVAL) {
        console.log(`Rate limiting: Skipping ${symbol} (last fetch ${now - lastFetch}ms ago)`);
        return;
      }

      // Fetch latest candle data for multiple timeframes
      const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '1d'];

      for (const timeframe of timeframes) {
        try {
          const candles = await YahooFinanceService.getHistoricalData(symbol, timeframe, {
            period2: new Date() // Up to now
          });

          if (candles.length === 0) {
            console.log(`No new data for ${symbol}:${timeframe}`);
            continue;
          }

          // Get the latest candle
          const latestCandle = candles[candles.length - 1];

          // Save to database (upsert)
          await CandleModel.create(latestCandle);

          // Broadcast to WebSocket clients
          this.broadcastCandle(symbol, timeframe, latestCandle);

          console.log(`Updated ${symbol}:${timeframe} - Close: $${latestCandle.close.toFixed(2)}`);

          // Calculate and store trend for this symbol/timeframe
          await this.calculateAndStoreTrend(symbol, timeframe, candles);
        } catch (error) {
          console.error(`Error fetching ${symbol}:${timeframe}:`, error);
        }
      }

      // Update last fetch time
      this.lastFetchTime.set(symbol, now);

    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Calculate and store trend using Python service
   */
  private static async calculateAndStoreTrend(
    symbol: string,
    timeframe: Timeframe,
    candles: any[]
  ): Promise<void> {
    try {
      // We need at least 20 candles for low reliability trend detection
      if (candles.length < 20) {
        return;
      }

      // Format candles for Python service
      const formattedCandles = candles.map(candle => ({
        timestamp: candle.timestamp.toISOString(),
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        volume: Number(candle.volume)
      }));

      // Calculate trend using Python service (default: low reliability)
      const trendData = await PythonCalculationService.calculateTrend(
        symbol,
        timeframe,
        formattedCandles,
        'low' // Using low reliability for now
      );

      // Store in database
      await TrendModel.upsert(
        symbol,
        timeframe,
        trendData.trend,
        'low',
        new Date(trendData.timestamp)
      );

      // Broadcast trend update
      this.broadcastTrend(symbol, timeframe, trendData.trend);

      console.log(`📊 Trend ${symbol}:${timeframe} = ${trendData.trend.toUpperCase()}`);
    } catch (error) {
      console.error(`Error calculating trend for ${symbol}:${timeframe}:`, error);
    }
  }

  /**
   * Broadcast candle update to WebSocket clients
   */
  private static broadcastCandle(symbol: string, timeframe: Timeframe, candle: any) {
    if (!this.io) {
      console.warn('Socket.IO not initialized, cannot broadcast');
      return;
    }

    // Broadcast to all clients subscribed to this symbol
    this.io.emit('candle:update', {
      symbol,
      timeframe,
      candle
    });

    // Also broadcast to symbol-specific room
    this.io.to(`symbol:${symbol}`).emit('candle:update', {
      symbol,
      timeframe,
      candle
    });
  }

  /**
   * Broadcast trend update to WebSocket clients
   */
  private static broadcastTrend(symbol: string, timeframe: Timeframe, trend: 'up' | 'down') {
    if (!this.io) {
      console.warn('Socket.IO not initialized, cannot broadcast');
      return;
    }

    // Broadcast to all clients
    this.io.emit('trend:update', {
      symbol,
      timeframe,
      trend,
      timestamp: new Date().toISOString()
    });

    // Also broadcast to symbol-specific room
    this.io.to(`symbol:${symbol}`).emit('trend:update', {
      symbol,
      timeframe,
      trend,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Manually trigger a poll (useful for testing)
   */
  static async triggerPoll() {
    console.log('Manually triggering poll...');
    await this.pollMarketData();
  }

  /**
   * Get polling status
   */
  static getStatus() {
    return {
      isRunning: this.cronJob !== null,
      isPolling: this.isPolling,
      lastFetchTimes: Object.fromEntries(this.lastFetchTime)
    };
  }
}
