import { makeAutoObservable, runInAction } from 'mobx';
import { websocketService } from '../services/websocket';
import type { CandleData, CandleUpdate, Timeframe } from '../types/candle';

export type { Timeframe } from '../types/candle';

export class CandleStore {
  // Map: symbol -> timeframe -> candles[]
  candles: Map<string, Map<Timeframe, CandleData[]>> = new Map();
  selectedTimeframe: Timeframe = '1d';
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // Listen for real-time candle updates
    websocketService.onCandleUpdate((data: CandleUpdate) => {
      this.handleCandleUpdate(data);
    });

    // Listen for initial candle data when subscribing
    websocketService.onCandlesInitial((data) => {
      this.handleInitialCandles(data.symbol, data.timeframe as Timeframe, data.candles);
    });

    // Listen for candle responses
    websocketService.onCandlesResponse((data) => {
      this.handleInitialCandles(data.symbol, data.timeframe as Timeframe, data.candles);
    });
  }

  async fetchCandles(
    symbol: string,
    timeframe: Timeframe,
    limit = 100,
    startDate?: Date,
    endDate?: Date
  ) {
    this.isLoading = true;
    this.error = null;

    try {
      const params = new URLSearchParams({ limit: limit.toString() });

      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }

      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(
        `http://localhost:3000/api/candles/${symbol}/${timeframe}?${params.toString()}`
      );

      if (!response.ok) throw new Error('Failed to fetch candles');

      const data = await response.json();
      runInAction(() => {
        // Merge new candles with existing ones
        this.mergeCandlesForSymbol(symbol, timeframe, data.candles || []);
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.isLoading = false;
      });
    }
  }

  private handleCandleUpdate(update: CandleUpdate) {
    const { symbol, timeframe, candle } = update;

    runInAction(() => {
      if (!this.candles.has(symbol)) {
        this.candles.set(symbol, new Map());
      }

      const symbolCandles = this.candles.get(symbol)!;
      const tf = timeframe as Timeframe;

      if (!symbolCandles.has(tf)) {
        symbolCandles.set(tf, []);
      }

      const candles = symbolCandles.get(tf)!;

      // Find if we already have this candle (by timestamp)
      const existingIndex = candles.findIndex(
        (c) => new Date(c.timestamp).getTime() === new Date(candle.timestamp).getTime()
      );

      if (existingIndex >= 0) {
        // Update existing candle
        candles[existingIndex] = candle;
      } else {
        // Add new candle and keep sorted by timestamp
        candles.push(candle);
        candles.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }

      console.log(`📊 Updated ${symbol}:${timeframe} - Close: $${candle.close.toFixed(2)}`);
    });
  }

  private handleInitialCandles(symbol: string, timeframe: Timeframe, candles: CandleData[]) {
    runInAction(() => {
      this.setCandlesForSymbol(symbol, timeframe, candles);
      console.log(`📊 Loaded ${candles.length} candles for ${symbol}:${timeframe}`);
    });
  }

  private setCandlesForSymbol(symbol: string, timeframe: Timeframe, candles: CandleData[]) {
    if (!this.candles.has(symbol)) {
      this.candles.set(symbol, new Map());
    }

    const symbolCandles = this.candles.get(symbol)!;
    symbolCandles.set(timeframe, candles);
  }

  private mergeCandlesForSymbol(symbol: string, timeframe: Timeframe, newCandles: CandleData[]) {
    if (!this.candles.has(symbol)) {
      this.candles.set(symbol, new Map());
    }

    const symbolCandles = this.candles.get(symbol)!;
    const existingCandles = symbolCandles.get(timeframe) || [];

    // Create a map of existing candles by timestamp for quick lookup
    const candleMap = new Map<number, CandleData>();

    existingCandles.forEach(candle => {
      const timestamp = new Date(candle.timestamp).getTime();
      candleMap.set(timestamp, candle);
    });

    // Add or update with new candles
    newCandles.forEach(candle => {
      const timestamp = new Date(candle.timestamp).getTime();
      candleMap.set(timestamp, candle);
    });

    // Convert back to sorted array
    const mergedCandles = Array.from(candleMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    symbolCandles.set(timeframe, mergedCandles);
  }

  getCandlesForSymbol(symbol: string, timeframe: Timeframe): CandleData[] {
    return this.candles.get(symbol)?.get(timeframe) || [];
  }

  getLatestCandle(symbol: string, timeframe: Timeframe): CandleData | null {
    const candles = this.getCandlesForSymbol(symbol, timeframe);
    return candles.length > 0 ? candles[candles.length - 1] : null;
  }

  setTimeframe(timeframe: Timeframe) {
    this.selectedTimeframe = timeframe;
  }

  clearError() {
    this.error = null;
  }
}

export const candleStore = new CandleStore();
