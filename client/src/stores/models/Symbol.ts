import { makeAutoObservable, observable } from 'mobx';
import type { CandleData, Timeframe } from '../../types/candle';

/**
 * Observable Symbol model
 * Each symbol has its own loading state and candle data per timeframe
 */
export class Symbol {
  symbol: string;
  candles: Map<Timeframe, CandleData[]>;
  loading: Map<Timeframe, boolean>;
  trends: Map<Timeframe, { trend: 'up' | 'down' | 'neutral', percentChange: number | null }>;
  error: string | null = null;

  constructor(symbol: string) {
    this.symbol = symbol;
    // Use MobX observable maps for proper reactivity
    this.candles = observable.map();
    this.loading = observable.map();
    this.trends = observable.map();
    makeAutoObservable(this, {
      candles: false, // Already made observable above
      loading: false,
      trends: false,
    });
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

  /**
   * Calculate trend direction for a timeframe
   * Returns: 'up' | 'down' | 'neutral'
   */
  getTrend(timeframe: Timeframe): 'up' | 'down' | 'neutral' {
    const candles = this.getCandles(timeframe);
    if (candles.length < 2) return 'neutral';

    const latest = candles[candles.length - 1];
    const previous = candles[candles.length - 2];

    const percentChange = ((latest.close - previous.close) / previous.close) * 100;

    // Consider > 0.1% as up, < -0.1% as down
    if (percentChange > 0.1) return 'up';
    if (percentChange < -0.1) return 'down';
    return 'neutral';
  }

  /**
   * Get percent change for a timeframe
   */
  getPercentChange(timeframe: Timeframe): number | null {
    const candles = this.getCandles(timeframe);
    if (candles.length < 2) return null;

    const latest = candles[candles.length - 1];
    const previous = candles[candles.length - 2];

    return ((latest.close - previous.close) / previous.close) * 100;
  }

  /**
   * Set pre-calculated trend data from backend
   */
  setTrendData(timeframe: Timeframe, trend: 'up' | 'down' | 'neutral', percentChange: number | null) {
    this.trends.set(timeframe, { trend, percentChange });
  }

  /**
   * Get cached trend data (from backend calculation)
   * Fallback to calculating from candles if not available
   */
  getTrendData(timeframe: Timeframe): { trend: 'up' | 'down' | 'neutral', percentChange: number | null } | null {
    // First check if we have cached trend data from backend
    const cachedTrend = this.trends.get(timeframe);
    if (cachedTrend) {
      return cachedTrend;
    }

    // Fallback to calculating from candles
    const trend = this.getTrend(timeframe);
    const percentChange = this.getPercentChange(timeframe);
    return { trend, percentChange };
  }

  /**
   * Get daily change percentage (comparing current price vs yesterday's close)
   * Uses the most recent price vs the close of the previous trading day
   */
  getDailyChange(): { value: number; isPositive: boolean } | null {
    // Get current price from latest available data (prefer intraday for real-time)
    let currentPrice: number | null = null;

    // Try intraday timeframes first for most current price
    for (const tf of ['1m', '5m', '15m', '30m', '1h'] as Timeframe[]) {
      const candles = this.getCandles(tf);
      if (candles.length > 0) {
        currentPrice = candles[candles.length - 1].close;
        break;
      }
    }

    // Fallback to daily if no intraday data
    if (currentPrice === null) {
      const dailyCandles = this.getCandles('1d');
      if (dailyCandles.length > 0) {
        currentPrice = dailyCandles[dailyCandles.length - 1].close;
      }
    }

    if (currentPrice === null) return null;

    // Get yesterday's close from daily candles
    const dailyCandles = this.getCandles('1d');
    if (dailyCandles.length === 0) return null;

    // Check if today is a trading day by comparing timestamps
    const now = new Date();
    const latestDaily = dailyCandles[dailyCandles.length - 1];
    const latestDailyDate = new Date(latestDaily.timestamp);

    // If the latest daily candle is from today, use previous day's close
    // Otherwise, the latest daily candle IS yesterday's close
    let yesterdayClose: number;

    const isToday =
      latestDailyDate.getFullYear() === now.getFullYear() &&
      latestDailyDate.getMonth() === now.getMonth() &&
      latestDailyDate.getDate() === now.getDate();

    if (isToday && dailyCandles.length >= 2) {
      // Today's candle exists, use previous day's close
      yesterdayClose = dailyCandles[dailyCandles.length - 2].close;
    } else {
      // Latest candle is yesterday or older
      yesterdayClose = latestDaily.close;
    }

    const change = ((currentPrice - yesterdayClose) / yesterdayClose) * 100;

    return {
      value: change,
      isPositive: change >= 0,
    };
  }
}
