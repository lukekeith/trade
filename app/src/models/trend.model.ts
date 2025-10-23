import pool from '../config/database';
import { Timeframe } from '../types';

export interface Trend {
  id: number;
  symbol: string;
  timeframe: Timeframe;
  trend: 'up' | 'down';
  reliability: 'low' | 'medium' | 'high';
  timestamp: Date;
  created_at: Date;
}

export class TrendModel {
  /**
   * Upsert a trend (insert or update)
   */
  static async upsert(
    symbol: string,
    timeframe: Timeframe,
    trend: 'up' | 'down',
    reliability: 'low' | 'medium' | 'high' = 'low',
    timestamp: Date = new Date()
  ): Promise<Trend> {
    const query = `
      INSERT INTO trends (symbol, timeframe, trend, reliability, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (symbol, timeframe, reliability)
      DO UPDATE SET
        trend = EXCLUDED.trend,
        timestamp = EXCLUDED.timestamp,
        created_at = NOW()
      RETURNING *
    `;

    const values = [symbol, timeframe, trend, reliability, timestamp];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get trend for a symbol/timeframe/reliability
   */
  static async findOne(
    symbol: string,
    timeframe: Timeframe,
    reliability: 'low' | 'medium' | 'high' = 'low'
  ): Promise<Trend | null> {
    const query = `
      SELECT * FROM trends
      WHERE symbol = $1 AND timeframe = $2 AND reliability = $3
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [symbol, timeframe, reliability]);
    return result.rows[0] || null;
  }

  /**
   * Get all trends for a symbol across timeframes
   */
  static async findBySymbol(
    symbol: string,
    reliability: 'low' | 'medium' | 'high' = 'low'
  ): Promise<Trend[]> {
    const query = `
      SELECT * FROM trends
      WHERE symbol = $1 AND reliability = $2
      ORDER BY timeframe
    `;

    const result = await pool.query(query, [symbol, reliability]);
    return result.rows;
  }

  /**
   * Get trends for all symbols in a timeframe
   */
  static async findByTimeframe(
    timeframe: Timeframe,
    reliability: 'low' | 'medium' | 'high' = 'low'
  ): Promise<Trend[]> {
    const query = `
      SELECT * FROM trends
      WHERE timeframe = $1 AND reliability = $2
      ORDER BY symbol
    `;

    const result = await pool.query(query, [timeframe, reliability]);
    return result.rows;
  }

  /**
   * Get all trends (for a given reliability level)
   */
  static async findAll(reliability: 'low' | 'medium' | 'high' = 'low'): Promise<Trend[]> {
    const query = `
      SELECT * FROM trends
      WHERE reliability = $1
      ORDER BY symbol, timeframe
    `;

    const result = await pool.query(query, [reliability]);
    return result.rows;
  }

  /**
   * Delete trends for a symbol
   */
  static async deleteBySymbol(symbol: string): Promise<number> {
    const query = `DELETE FROM trends WHERE symbol = $1`;
    const result = await pool.query(query, [symbol]);
    return result.rowCount || 0;
  }
}
