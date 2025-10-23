import axios from 'axios';
import { Candle, Timeframe } from '../types';

/**
 * Common currency codes for forex detection
 */
const CURRENCY_CODES = [
  'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR'
];

/**
 * Detect if a symbol is likely a forex pair
 * Examples: USDJPY, EURUSD, GBPUSD
 */
function isLikelyForexPair(symbol: string): boolean {
  // Already has =X suffix
  if (symbol.endsWith('=X')) {
    return true;
  }

  // Check if it's 6 characters and consists of two valid currency codes
  if (symbol.length === 6) {
    const base = symbol.substring(0, 3).toUpperCase();
    const quote = symbol.substring(3, 6).toUpperCase();
    return CURRENCY_CODES.includes(base) && CURRENCY_CODES.includes(quote);
  }

  return false;
}

/**
 * Normalize symbol for Yahoo Finance API
 * Forex pairs need =X suffix (e.g., USDJPY → USDJPY=X)
 */
function normalizeSymbolForYahoo(symbol: string): string {
  // Already has =X, return as is
  if (symbol.endsWith('=X')) {
    return symbol.toUpperCase();
  }

  // If it looks like a forex pair, add =X
  if (isLikelyForexPair(symbol)) {
    return `${symbol.toUpperCase()}=X`;
  }

  // Otherwise, just uppercase it (stocks, ETFs, etc.)
  return symbol.toUpperCase();
}

/**
 * Get the display symbol (remove =X suffix for user display)
 */
function getDisplaySymbol(symbol: string): string {
  return symbol.replace('=X', '');
}

/**
 * Map our timeframes to Yahoo Finance intervals
 */
const TIMEFRAME_TO_INTERVAL: Record<Timeframe, string> = {
  '1m': '1m',
  '2m': '2m',
  '5m': '5m',
  '10m': '15m', // Yahoo doesn't have 10m, use 15m
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '1h', // Yahoo doesn't have 2h, we'll fetch 1h and aggregate
  '1d': '1d'
};

/**
 * Get period range for Yahoo Finance API based on timeframe
 */
function getPeriodRange(timeframe: Timeframe): { range: string } {
  switch (timeframe) {
    case '1m':
    case '2m':
    case '5m':
      return { range: '1d' }; // Last 1 day for minute intervals
    case '10m':
    case '15m':
    case '30m':
      return { range: '5d' }; // Last 5 days
    case '1h':
    case '2h':
      return { range: '1mo' }; // Last month
    case '1d':
      return { range: '1y' }; // Last year
    default:
      return { range: '1d' };
  }
}

export class YahooFinanceService {
  private static readonly BASE_URL = 'https://query1.finance.yahoo.com/v8/finance';

  /**
   * Validate if a symbol exists by trying to fetch a small amount of historical data
   */
  static async validateSymbol(symbol: string): Promise<boolean> {
    try {
      // Normalize the symbol (add =X for forex, uppercase, etc.)
      const normalizedSymbol = normalizeSymbolForYahoo(symbol);

      const url = `${this.BASE_URL}/chart/${normalizedSymbol}`;
      const response = await axios.get(url, {
        params: {
          interval: '1d',
          range: '1d'
        }
      });

      return response.data?.chart?.result && response.data.chart.result.length > 0;
    } catch (error) {
      console.error(`Error validating symbol ${symbol}:`, error);
      return false;
    }
  }

  /**
   * Get historical data for a symbol
   */
  static async getHistoricalData(
    symbol: string,
    timeframe: Timeframe,
    options?: {
      period1?: Date;
      period2?: Date;
    }
  ): Promise<Candle[]> {
    try {
      // Normalize symbol for Yahoo Finance (add =X for forex, uppercase, etc.)
      const normalizedSymbol = normalizeSymbolForYahoo(symbol);
      // Get display symbol (remove =X for storage)
      const displaySymbol = getDisplaySymbol(symbol);

      const interval = TIMEFRAME_TO_INTERVAL[timeframe];
      const { range } = getPeriodRange(timeframe);

      const period1 = options?.period1 ? Math.floor(options.period1.getTime() / 1000) : undefined;
      const period2 = options?.period2 ? Math.floor(options.period2.getTime() / 1000) : Math.floor(Date.now() / 1000);

      const url = `${this.BASE_URL}/chart/${normalizedSymbol}`;
      const params: any = {
        interval,
        range: period1 ? undefined : range,
        period1,
        period2
      };

      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await axios.get(url, { params });

      if (!response.data?.chart?.result || response.data.chart.result.length === 0) {
        return [];
      }

      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators?.quote?.[0];

      if (!timestamps || !quote) {
        return [];
      }

      // Convert Yahoo Finance format to our Candle format
      // Use display symbol (without =X) for storage
      const candles: Candle[] = timestamps.map((timestamp: number, index: number) => ({
        symbol: displaySymbol.toUpperCase(),
        timeframe,
        timestamp: new Date(timestamp * 1000),
        open: quote.open[index],
        high: quote.high[index],
        low: quote.low[index],
        close: quote.close[index],
        volume: quote.volume[index]
      })).filter((candle: Candle) =>
        // Filter out invalid candles (sometimes Yahoo returns null values)
        candle.open !== null &&
        candle.high !== null &&
        candle.low !== null &&
        candle.close !== null
      );

      return candles;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get latest quote for a symbol
   */
  static async getQuote(symbol: string) {
    try {
      // Normalize symbol for Yahoo Finance
      const normalizedSymbol = normalizeSymbolForYahoo(symbol);

      const url = `${this.BASE_URL}/quote`;
      const response = await axios.get(url, {
        params: {
          symbols: normalizedSymbol
        }
      });

      const quotes = response.data?.quoteResponse?.result;
      if (!quotes || quotes.length === 0) {
        throw new Error(`No quote data for ${symbol}`);
      }

      return quotes[0];
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get latest candle data for multiple symbols
   */
  static async getLatestCandles(symbols: string[], timeframe: Timeframe): Promise<Candle[]> {
    const promises = symbols.map(symbol =>
      this.getHistoricalData(symbol, timeframe).catch(error => {
        console.error(`Failed to fetch ${symbol}:`, error);
        return [];
      })
    );

    const results = await Promise.all(promises);
    return results.flat();
  }
}
