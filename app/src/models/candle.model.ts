import pool from '../config/database';
import { Candle, Timeframe } from '../types';

export class CandleModel {
  /**
   * Insert a new candle into the database
   * Uses ON CONFLICT to handle duplicate timestamps
   */
  static async create(candle: Omit<Candle, 'id' | 'created_at'>): Promise<Candle> {
    const query = `
      INSERT INTO candles (symbol, timeframe, timestamp, open, high, low, close, volume)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (symbol, timeframe, timestamp)
      DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume
      RETURNING *
    `;

    const values = [
      candle.symbol,
      candle.timeframe,
      candle.timestamp,
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.volume
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Insert multiple candles in a single transaction
   */
  static async createMany(candles: Omit<Candle, 'id' | 'created_at'>[]): Promise<Candle[]> {
    if (candles.length === 0) return [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedCandles: Candle[] = [];

      for (const candle of candles) {
        const query = `
          INSERT INTO candles (symbol, timeframe, timestamp, open, high, low, close, volume)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (symbol, timeframe, timestamp)
          DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume
          RETURNING *
        `;

        const values = [
          candle.symbol,
          candle.timeframe,
          candle.timestamp,
          candle.open,
          candle.high,
          candle.low,
          candle.close,
          candle.volume
        ];

        const result = await client.query(query, values);
        insertedCandles.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return insertedCandles;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get candles for a symbol and timeframe
   */
  static async findBySymbolAndTimeframe(
    symbol: string,
    timeframe: Timeframe,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<Candle[]> {
    let query = `
      SELECT * FROM candles
      WHERE symbol = $1 AND timeframe = $2
    `;

    const values: any[] = [symbol, timeframe];
    let paramCount = 2;

    if (options?.startDate) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      values.push(options.startDate);
    }

    if (options?.endDate) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      values.push(options.endDate);
    }

    query += ` ORDER BY timestamp DESC`;

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get the latest candle for a symbol and timeframe
   */
  static async findLatest(symbol: string, timeframe: Timeframe): Promise<Candle | null> {
    const query = `
      SELECT * FROM candles
      WHERE symbol = $1 AND timeframe = $2
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [symbol, timeframe]);
    return result.rows[0] || null;
  }

  /**
   * Delete old candles based on retention policy
   * For 1-minute candles, keep only last 30 days
   */
  static async deleteOldCandles(timeframe: Timeframe, daysToKeep: number): Promise<number> {
    const query = `
      DELETE FROM candles
      WHERE timeframe = $1
        AND timestamp < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await pool.query(query, [timeframe]);
    return result.rowCount || 0;
  }

  /**
   * Get count of candles for a symbol and timeframe
   */
  static async count(symbol: string, timeframe: Timeframe): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM candles
      WHERE symbol = $1 AND timeframe = $2
    `;

    const result = await pool.query(query, [symbol, timeframe]);
    return parseInt(result.rows[0].count);
  }
}
