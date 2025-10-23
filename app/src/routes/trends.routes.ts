import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { WatchlistModel } from '../models/watchlist.model';

const router = Router();

/**
 * GET /api/trends/:symbol
 * Returns all trend data for all timeframes in a single response
 * Calculates trends from the last 2 candles for each timeframe
 */
router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '1d'];

    const trends: Record<string, { trend: 'up' | 'down' | 'neutral', percentChange: number | null }> = {};

    // Fetch the latest 2 candles for each timeframe in parallel
    const promises = timeframes.map(async (timeframe) => {
      const result = await pool.query(
        `SELECT * FROM candles
         WHERE symbol = $1 AND timeframe = $2
         ORDER BY timestamp DESC
         LIMIT 2`,
        [symbol.toUpperCase(), timeframe]
      );

      if (result.rows.length < 2) {
        trends[timeframe] = { trend: 'neutral', percentChange: null };
        return;
      }

      const [latest, previous] = result.rows;
      const latestClose = parseFloat(latest.close);
      const previousClose = parseFloat(previous.close);
      const percentChange = ((latestClose - previousClose) / previousClose) * 100;

      let trend: 'up' | 'down' | 'neutral';
      if (percentChange > 0.1) {
        trend = 'up';
      } else if (percentChange < -0.1) {
        trend = 'down';
      } else {
        trend = 'neutral';
      }

      trends[timeframe] = { trend, percentChange };
    });

    await Promise.all(promises);

    res.json({
      symbol: symbol.toUpperCase(),
      trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/**
 * GET /api/trends
 * Proxy to Python service for trend calculations
 * Python calculates trends from database - no Yahoo Finance data used
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/trends`);

    if (!response.ok) {
      throw new Error(`Python service returned ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching trends from Python service:', error);
    res.status(500).json({ error: 'Failed to fetch trends from calculation service' });
  }
});

export default router;
