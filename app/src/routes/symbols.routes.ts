import { Router, Request, Response } from 'express';
import { WatchlistModel } from '../models/watchlist.model';
import { YahooFinanceService } from '../services/yahoo-finance.service';

const router = Router();

/**
 * GET /api/symbols
 * Get all symbols in the watchlist
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const symbols = await WatchlistModel.getSymbols();
    res.json({ symbols });
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({ error: 'Failed to fetch symbols' });
  }
});

/**
 * POST /api/symbols
 * Add a new symbol to the watchlist
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Validate symbol exists in Yahoo Finance
    const isValid = await YahooFinanceService.validateSymbol(symbol);

    if (!isValid) {
      return res.status(404).json({ error: `Symbol '${symbol}' not found` });
    }

    const watchlist = await WatchlistModel.addSymbol(symbol);
    res.status(201).json({ symbols: watchlist.symbols });
  } catch (error) {
    console.error('Error adding symbol:', error);
    res.status(500).json({ error: 'Failed to add symbol' });
  }
});

/**
 * PUT /api/symbols/:oldSymbol
 * Update/replace a symbol in the watchlist
 */
router.put('/:oldSymbol', async (req: Request, res: Response) => {
  try {
    const { oldSymbol } = req.params;
    const { newSymbol } = req.body;

    if (!newSymbol || typeof newSymbol !== 'string') {
      return res.status(400).json({ error: 'New symbol is required' });
    }

    // Validate new symbol exists
    const isValid = await YahooFinanceService.validateSymbol(newSymbol);

    if (!isValid) {
      return res.status(404).json({ error: `Symbol '${newSymbol}' not found` });
    }

    const watchlist = await WatchlistModel.updateSymbol(oldSymbol, newSymbol);

    if (!watchlist) {
      return res.status(404).json({ error: `Symbol '${oldSymbol}' not found in watchlist` });
    }

    res.json({ symbols: watchlist.symbols });
  } catch (error) {
    console.error('Error updating symbol:', error);
    res.status(500).json({ error: 'Failed to update symbol' });
  }
});

/**
 * DELETE /api/symbols/:symbol
 * Remove a symbol from the watchlist
 */
router.delete('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    const watchlist = await WatchlistModel.removeSymbol(symbol);

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.json({ symbols: watchlist.symbols });
  } catch (error) {
    console.error('Error removing symbol:', error);
    res.status(500).json({ error: 'Failed to remove symbol' });
  }
});

export default router;
