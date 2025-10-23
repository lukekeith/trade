import axios from 'axios';
import { Timeframe } from '../types';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface EMAResponse {
  ema_values: (number | null)[];
}

interface TrendResponse {
  trend: 'up' | 'down';
  ema_values: (number | null)[];
  timestamp: string;
}

type ReliabilityLevel = 'low' | 'medium' | 'high';

/**
 * Service for calling Python calculation endpoints
 */
export class PythonCalculationService {
  /**
   * Calculate EMA values for given candles
   */
  static async calculateEMA(candles: CandleData[], period: number): Promise<(number | null)[]> {
    try {
      const response = await axios.post<EMAResponse>(
        `${PYTHON_SERVICE_URL}/calculate-ema`,
        {
          candles,
          period
        },
        {
          timeout: 10000 // 10 second timeout
        }
      );

      return response.data.ema_values;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error calculating EMA:`, error.response?.data || error.message);
      } else {
        console.error(`Error calculating EMA:`, error);
      }
      throw error;
    }
  }

  /**
   * Calculate trend direction for symbol/timeframe
   */
  static async calculateTrend(
    symbol: string,
    timeframe: Timeframe,
    candles: CandleData[],
    reliability: ReliabilityLevel = 'low',
    emaPeriod: number = 20
  ): Promise<TrendResponse> {
    try {
      const response = await axios.post<TrendResponse>(
        `${PYTHON_SERVICE_URL}/calculate-trend`,
        {
          symbol,
          timeframe,
          candles,
          ema_period: emaPeriod,
          reliability
        },
        {
          timeout: 10000 // 10 second timeout
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          `Error calculating trend for ${symbol}:${timeframe}:`,
          error.response?.data || error.message
        );
      } else {
        console.error(`Error calculating trend for ${symbol}:${timeframe}:`, error);
      }
      throw error;
    }
  }

  /**
   * Check if Python service is healthy
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Python service health check failed:', error);
      return false;
    }
  }
}
