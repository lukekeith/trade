export interface Candle {
  id?: number;
  symbol: string;
  timeframe: Timeframe;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  created_at?: Date;
}

export type Timeframe = '1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '1d';

export type TrendDirection = 'up' | 'down';

export interface Trend {
  symbol: string;
  timeframe: Timeframe;
  direction: TrendDirection;
  timestamp: Date;
}

export interface UserSettings {
  id?: number;
  user_id?: number | null;
  settings: {
    theme?: 'dark' | 'light';
    defaultSymbols?: string[];
    trendReliability?: 'low' | 'medium' | 'high';
    enabledTimeframes?: Timeframe[];
  };
  created_at?: Date;
  updated_at?: Date;
}

export interface PanelConfig {
  id?: number;
  user_id?: number | null;
  panel_id: string;
  widget_type: 'trends' | 'chart';
  config: {
    // For trends widget
    enabledTimeframes?: Timeframe[];

    // For chart widget
    movingAverages?: {
      period: number;
      color: string;
      weight: number;
      style: 'solid' | 'dashed' | 'dotted';
    }[];

    // Chart state persistence
    zoom?: number;
    pan?: { x: number; y: number };
  };
  created_at?: Date;
  updated_at?: Date;
}

export interface Watchlist {
  id?: number;
  user_id?: number | null;
  symbols: string[];
  created_at?: Date;
  updated_at?: Date;
}
