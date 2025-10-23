export interface CandleData {
  symbol: string;
  timeframe: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleUpdate {
  symbol: string;
  timeframe: string;
  candle: CandleData;
  timestamp: string;
}

export type Timeframe = '1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '1d';
