import { Router, Request, Response } from 'express';
import { CandleModel } from '../models/candle.model';
import { YahooFinanceService } from '../services/yahoo-finance.service';
import { Timeframe } from '../types';

const router = Router();

const VALID_TIMEFRAMES: Timeframe[] = ['1m', '2m', '5m', '10m', '15m', '30m', '1h', '2h', '1d'];

/**
 * GET /api/candles/:symbol/:timeframe
 * Get historical candle data for a symbol and timeframe
 */
router.get('/:symbol/:timeframe', async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe } = req.params;
    const { startDate, endDate, limit } = req.query;

    // Validate timeframe
    if (!VALID_TIMEFRAMES.includes(timeframe as Timeframe)) {
      return res.status(400).json({
        error: 'Invalid timeframe',
        validTimeframes: VALID_TIMEFRAMES
      });
    }

    // Build options
    const options: any = {};

    if (startDate) {
      options.startDate = new Date(startDate as string);
    }

    if (endDate) {
      options.endDate = new Date(endDate as string);
    }

    if (limit) {
      options.limit = parseInt(limit as string);
    }

    // First, check how many candles we have in the database
    const totalCandlesInDb = await CandleModel.count(
      symbol.toUpperCase(),
      timeframe as Timeframe
    );

    // If we don't have enough candles or limit is specified and we need more, fetch from Yahoo
    const requestedLimit = options.limit || 200;
    const needsHistoricalData = totalCandlesInDb < requestedLimit;

    if (needsHistoricalData) {
      console.log(`Need more data for ${symbol}:${timeframe} (have ${totalCandlesInDb}, need ${requestedLimit}), fetching from Yahoo Finance...`);

      try {
        const fetchedCandles = await YahooFinanceService.getHistoricalData(
          symbol,
          timeframe as Timeframe,
          {
            period1: options.startDate,
            period2: options.endDate
          }
        );

        // Store in database
        if (fetchedCandles.length > 0) {
          await CandleModel.createMany(fetchedCandles);
          console.log(`Stored ${fetchedCandles.length} candles for ${symbol}:${timeframe}`);
        }
      } catch (error) {
        console.error(`Error fetching from Yahoo Finance:`, error);
        // Don't return error, just use what we have in DB
      }
    }

    // Now get candles from database with filters applied
    let candles = await CandleModel.findBySymbolAndTimeframe(
      symbol.toUpperCase(),
      timeframe as Timeframe,
      options
    );

    res.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      count: candles.length,
      candles
    });
  } catch (error) {
    console.error('Error fetching candles:', error);
    res.status(500).json({ error: 'Failed to fetch candle data' });
  }
});

/**
 * GET /api/candles/:symbol/:timeframe/latest
 * Get the latest candle for a symbol and timeframe
 */
router.get('/:symbol/:timeframe/latest', async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe } = req.params;

    // Validate timeframe
    if (!VALID_TIMEFRAMES.includes(timeframe as Timeframe)) {
      return res.status(400).json({
        error: 'Invalid timeframe',
        validTimeframes: VALID_TIMEFRAMES
      });
    }

    const candle = await CandleModel.findLatest(
      symbol.toUpperCase(),
      timeframe as Timeframe
    );

    if (!candle) {
      return res.status(404).json({ error: 'No candle data found' });
    }

    res.json({ candle });
  } catch (error) {
    console.error('Error fetching latest candle:', error);
    res.status(500).json({ error: 'Failed to fetch latest candle' });
  }
});

export default router;
