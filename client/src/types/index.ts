export interface Candle {
  symbol: string;
  timeframe: Timeframe;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '1d';

export type TrendDirection = 'up' | 'down';

export interface Trend {
  symbol: string;
  timeframe: Timeframe;
  direction: TrendDirection;
  timestamp: Date;
}

export interface MovingAverage {
  period: number;
  color: string;
  weight: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface PanelConfig {
  panel_id: string;
  widget_type: 'trends' | 'chart';
  config: {
    // For trends widget
    enabledTimeframes?: Timeframe[];

    // For chart widget
    movingAverages?: MovingAverage[];

    // Chart state persistence
    zoom?: number;
    pan?: { x: number; y: number };
  };
}

export interface UserSettings {
  theme: 'dark' | 'light';
  defaultSymbols: string[];
  trendReliability: 'low' | 'medium' | 'high';
  enabledTimeframes: Timeframe[];
}
