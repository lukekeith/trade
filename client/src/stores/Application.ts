import { SymbolsStore } from './SymbolsStore';
import { UIStore } from './UIStore';
import { websocketService } from '../services/websocket';
import type { CandleUpdate } from '../types/candle';

/**
 * Root Application Store
 * Following proper MobX pattern with namespaced sub-stores
 *
 * Usage:
 * - Application.symbols - access symbols and watchlist
 * - Application.ui - access UI state
 * - Application.user - (future) access user data
 */
class ApplicationStore {
  // Sub-stores
  symbols: SymbolsStore;
  ui: UIStore;
  // user: UserStore; // Future

  constructor() {
    this.symbols = new SymbolsStore();
    this.ui = new UIStore();

    // Initialize
    this.init();
  }

  /**
   * Initialize the application
   */
  private async init() {
    // Load watchlist
    await this.symbols.loadWatchlist();

    // Load all required candle data for watchlist symbols
    // This ensures Python has data to calculate trends and daily changes work
    await this.loadAllRequiredCandleData();

    // Fetch initial trend data calculated by Python from database
    await this.symbols.fetchAllTrendData();

    // Setup WebSocket listeners for real-time updates (including trends every 60s)
    this.setupWebSocket();
  }

  /**
   * Load all required candle data for visible widgets
   * Ensures database has data and frontend can display all required metrics
   */
  private async loadAllRequiredCandleData() {
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '1d'];

    // Load candles for all watchlist symbols in parallel
    const promises = this.symbols.watchlist.flatMap(symbol =>
      timeframes.map(timeframe =>
        this.symbols.fetchCandles(symbol, timeframe as any, 200)
      )
    );

    await Promise.all(promises);
    console.log('✅ Loaded all required candle data for', this.symbols.watchlist.length, 'symbols');
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocket() {
    // Connect to WebSocket server
    const socket = websocketService.connect();

    if (socket) {
      // Monitor connection status
      socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.ui.setConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        this.ui.setConnected(false);
      });

      // Check connection status after a brief delay to allow connection to establish
      setTimeout(() => {
        const isConnected = websocketService.isConnected();
        console.log('🔌 WebSocket connection status:', isConnected);
        this.ui.setConnected(isConnected);
      }, 1000);
    }

    // Listen for candle updates
    websocketService.onCandleUpdate((data: CandleUpdate) => {
      const { symbol, timeframe, candle } = data;

      // Get the Symbol object and update it
      const symbolObj = this.symbols.getSymbol(symbol);
      symbolObj.upsertCandle(timeframe as any, candle);

      console.log(`📊 Real-time update: ${symbol}:${timeframe} - Close: $${candle.close}`);
    });

    // Listen for initial candle data
    websocketService.onCandlesInitial((data) => {
      const { symbol, timeframe, candles } = data;

      const symbolObj = this.symbols.getSymbol(symbol);
      symbolObj.setCandles(timeframe as any, candles);

      console.log(`📊 Loaded ${candles.length} candles for ${symbol}:${timeframe}`);
    });

    // Listen for candle responses
    websocketService.onCandlesResponse((data) => {
      const { symbol, timeframe, candles } = data;

      const symbolObj = this.symbols.getSymbol(symbol);
      symbolObj.setCandles(timeframe as any, candles);

      console.log(`📊 Loaded ${candles.length} candles for ${symbol}:${timeframe}`);
    });

    // Listen for trend updates via WebSocket (real-time from Python via Node)
    websocketService.onTrendsUpdate((trendsData: any) => {
      console.log('📈 Received real-time trend update via WebSocket');
      this.symbols.updateTrendsFromWebSocket(trendsData);
    });
  }
}

// Export singleton instance
export const Application = new ApplicationStore();
