import { makeAutoObservable } from 'mobx';
import type { CandleData, Timeframe } from '../../types/candle';

/**
 * Observable Symbol model
 * Each symbol has its own loading state and candle data per timeframe
 */
export class Symbol {
  symbol: string;
  candles: Map<Timeframe, CandleData[]> = new Map();
  loading: Map<Timeframe, boolean> = new Map();
  error: string | null = null;

  constructor(symbol: string) {
    this.symbol = symbol;
    makeAutoObservable(this);
  }

  /**
   * Set candles for a specific timeframe
   */
  setCandles(timeframe: Timeframe, candles: CandleData[]) {
    this.candles.set(timeframe, candles);
  }

  /**
   * Get candles for a specific timeframe
   */
  getCandles(timeframe: Timeframe): CandleData[] {
    return this.candles.get(timeframe) || [];
  }

  /**
   * Get the latest candle for a timeframe
   */
  getLatestCandle(timeframe: Timeframe): CandleData | null {
    const candles = this.getCandles(timeframe);
    return candles.length > 0 ? candles[candles.length - 1] : null;
  }

  /**
   * Set loading state for a timeframe
   */
  setLoading(timeframe: Timeframe, loading: boolean) {
    this.loading.set(timeframe, loading);
  }

  /**
   * Check if a timeframe is loading
   */
  isLoading(timeframe: Timeframe): boolean {
    return this.loading.get(timeframe) || false;
  }

  /**
   * Add or update a single candle
   */
  upsertCandle(timeframe: Timeframe, candle: CandleData) {
    const candles = this.getCandles(timeframe);
    const existingIndex = candles.findIndex(
      (c) => new Date(c.timestamp).getTime() === new Date(candle.timestamp).getTime()
    );

    if (existingIndex >= 0) {
      // Update existing
      candles[existingIndex] = candle;
    } else {
      // Add new and sort
      candles.push(candle);
      candles.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    this.setCandles(timeframe, candles);
  }

  /**
   * Merge new candles with existing ones
   */
  mergeCandles(timeframe: Timeframe, newCandles: CandleData[]) {
    const existing = this.getCandles(timeframe);
    const candleMap = new Map<number, CandleData>();

    // Add existing candles
    existing.forEach(candle => {
      const timestamp = new Date(candle.timestamp).getTime();
      candleMap.set(timestamp, candle);
    });

    // Add/update with new candles
    newCandles.forEach(candle => {
      const timestamp = new Date(candle.timestamp).getTime();
      candleMap.set(timestamp, candle);
    });

    // Convert back to sorted array
    const merged = Array.from(candleMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    this.setCandles(timeframe, merged);
  }

  /**
   * Set error state
   */
  setError(error: string | null) {
    this.error = error;
  }

  /**
   * Clear all data for this symbol
   */
  clear() {
    this.candles.clear();
    this.loading.clear();
    this.error = null;
  }
}
