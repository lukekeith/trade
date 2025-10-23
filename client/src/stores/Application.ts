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

    // Setup WebSocket listeners
    this.setupWebSocket();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocket() {
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
  }
}

// Export singleton instance
export const Application = new ApplicationStore();
