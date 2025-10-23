import { makeAutoObservable, runInAction } from 'mobx';
import { Symbol } from './models/Symbol';
import type { Timeframe } from '../types/candle';

/**
 * Symbols Store - manages all symbols in the application
 * Following proper MobX pattern: Application.symbols
 */
export class SymbolsStore {
  // Observable map of symbol ticker -> Symbol object
  symbols: Map<string, Symbol> = new Map();

  // List of symbols in watchlist
  watchlist: string[] = [];

  // Currently selected symbol
  selectedSymbol: string | null = null;

  // Loading and error states
  isLoadingWatchlist = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Get or create a Symbol object
   */
  getSymbol(ticker: string): Symbol {
    if (!this.symbols.has(ticker)) {
      this.symbols.set(ticker, new Symbol(ticker));
    }
    return this.symbols.get(ticker)!;
  }

  /**
   * Check if symbol exists in collection
   */
  hasSymbol(ticker: string): boolean {
    return this.symbols.has(ticker);
  }

  /**
   * Select a symbol
   */
  selectSymbol(ticker: string) {
    this.selectedSymbol = ticker;

    // Ensure symbol object exists
    if (!this.hasSymbol(ticker)) {
      this.getSymbol(ticker);
    }
  }

  /**
   * Get the currently selected Symbol object
   */
  get selected(): Symbol | null {
    if (!this.selectedSymbol) return null;
    return this.getSymbol(this.selectedSymbol);
  }

  /**
   * Load watchlist from API
   */
  async loadWatchlist() {
    this.isLoadingWatchlist = true;
    this.error = null;

    try {
      const response = await fetch('http://localhost:3000/api/symbols');

      if (!response.ok) {
        throw new Error('Failed to load watchlist');
      }

      const data = await response.json();

      runInAction(() => {
        this.watchlist = data.symbols || [];
        this.isLoadingWatchlist = false;

        // Create Symbol objects for each symbol in watchlist
        this.watchlist.forEach(ticker => {
          if (!this.hasSymbol(ticker)) {
            this.getSymbol(ticker);
          }
        });

        // Auto-select first symbol if none selected
        if (!this.selectedSymbol && this.watchlist.length > 0) {
          this.selectSymbol(this.watchlist[0]);
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.isLoadingWatchlist = false;
      });
    }
  }

  /**
   * Add a symbol to watchlist
   */
  async addSymbol(ticker: string) {
    this.error = null;

    try {
      const response = await fetch('http://localhost:3000/api/symbols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ticker.toUpperCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add symbol');
      }

      runInAction(() => {
        const upperTicker = ticker.toUpperCase();
        if (!this.watchlist.includes(upperTicker)) {
          this.watchlist.push(upperTicker);
          this.getSymbol(upperTicker); // Create Symbol object
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
      throw error;
    }
  }

  /**
   * Remove a symbol from watchlist
   */
  async removeSymbol(ticker: string) {
    this.error = null;

    try {
      const response = await fetch(`http://localhost:3000/api/symbols/${ticker}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove symbol');
      }

      runInAction(() => {
        this.watchlist = this.watchlist.filter(s => s !== ticker);

        // If removed symbol was selected, select another one
        if (this.selectedSymbol === ticker) {
          this.selectedSymbol = this.watchlist.length > 0 ? this.watchlist[0] : null;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
      throw error;
    }
  }

  /**
   * Fetch candles for a symbol/timeframe
   */
  async fetchCandles(ticker: string, timeframe: Timeframe, limit = 200, startDate?: Date, endDate?: Date) {
    const symbol = this.getSymbol(ticker);
    symbol.setLoading(timeframe, true);
    symbol.setError(null);

    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(
        `http://localhost:3000/api/candles/${ticker}/${timeframe}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch candles');
      }

      const data = await response.json();

      runInAction(() => {
        symbol.mergeCandles(timeframe, data.candles || []);
        symbol.setLoading(timeframe, false);
      });
    } catch (error) {
      runInAction(() => {
        symbol.setError(error instanceof Error ? error.message : 'Unknown error');
        symbol.setLoading(timeframe, false);
      });
    }
  }

  /**
   * Clear error
   */
  clearError() {
    this.error = null;
  }
}
