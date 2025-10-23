import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { symbolStore } from '../stores/SymbolStore';
import type { Timeframe } from '../stores/CandleStore';
import { candleStore } from '../stores/CandleStore';
import '../styles/ChartPanel.scss';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '1d'];

// Map timeframes to their visible day ranges
const TIMEFRAME_RANGES: Record<Timeframe, number> = {
  '1m': 2,
  '2m': 2,
  '5m': 10,
  '10m': 20,
  '15m': 20,
  '30m': 30,
  '1h': 60,
  '2h': 60,
  '1d': 365, // 1 year
};

export const ChartPanel = observer(() => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const isFetchingMoreRef = useRef(false);
  const lastRenderedSymbolRef = useRef<string | null>(null);

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1d');
  const [isDataRendered, setIsDataRendered] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { color: '#121214' },
        textColor: '#e1e7ef',
      },
      grid: {
        vertLines: { color: '#5F5F61' },
        horzLines: { color: '#5F5F61' },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Subscribe to visible logical range changes to detect when user scrolls
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const logicalRange = chart.timeScale().getVisibleLogicalRange();

      if (!logicalRange || !symbolStore.selectedSymbol) return;

      // Check if we're near the left edge (viewing old data)
      const threshold = 20; // Fetch more when within 20 bars of the edge
      if (logicalRange.from < threshold && !isFetchingMoreRef.current) {
        const candles = candleStore.getCandlesForSymbol(symbolStore.selectedSymbol, selectedTimeframe);

        if (candles.length > 0) {
          const oldestCandle = candles[0];
          const oldestTime = new Date(oldestCandle.timestamp);

          console.log(`📊 Scrolling near edge, fetching more historical data before ${oldestTime.toISOString()}`);

          isFetchingMoreRef.current = true;

          // Fetch more historical data before the oldest candle
          candleStore.fetchCandles(
            symbolStore.selectedSymbol,
            selectedTimeframe,
            200,
            undefined,
            oldestTime
          ).finally(() => {
            isFetchingMoreRef.current = false;
          });
        }
      }
    });

    // Handle resize with ResizeObserver for more accurate container size tracking
    const handleResize = () => {
      if (container && chartRef.current) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        chartRef.current.applyOptions({
          width: width,
          height: height,
        });
      }
    };

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(container);

    // Also listen to window resize as backup
    window.addEventListener('resize', handleResize);

    // Initial resize to ensure correct size
    setTimeout(handleResize, 0);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Handle symbol and timeframe changes
  useEffect(() => {
    if (!symbolStore.selectedSymbol || !candlestickSeriesRef.current || !chartRef.current) return;

    // If symbol changed, clear the chart immediately
    if (lastRenderedSymbolRef.current !== symbolStore.selectedSymbol) {
      candlestickSeriesRef.current.setData([]);
      setIsDataRendered(false);
      lastRenderedSymbolRef.current = symbolStore.selectedSymbol;
    }

    // Calculate how many candles we need based on timeframe
    const daysToShow = TIMEFRAME_RANGES[selectedTimeframe] || 365;
    const candlesPerDay: Record<Timeframe, number> = {
      '1m': 390,
      '2m': 195,
      '5m': 78,
      '10m': 39,
      '15m': 26,
      '30m': 13,
      '1h': 6.5,
      '2h': 3.25,
      '1d': 1,
    };
    const candlesNeeded = Math.ceil(daysToShow * (candlesPerDay[selectedTimeframe] || 1));
    const limit = Math.max(200, candlesNeeded);

    // Fetch candles for selected symbol and timeframe
    candleStore.fetchCandles(symbolStore.selectedSymbol, selectedTimeframe, limit);

    // Check if we already have data for this symbol/timeframe
    const candles = candleStore.getCandlesForSymbol(symbolStore.selectedSymbol, selectedTimeframe);

    if (candles.length > 0) {
      // We have data, render it immediately
      const chartData: CandlestickData[] = candles
        .map((candle) => ({
          time: new Date(candle.timestamp).getTime() / 1000,
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
        }))
        .sort((a, b) => a.time - b.time);

      candlestickSeriesRef.current.setData(chartData);

      // Set visible range
      const now = Date.now() / 1000;
      const secondsToShow = daysToShow * 24 * 60 * 60;
      const fromTime = now - secondsToShow;

      chartRef.current.timeScale().setVisibleRange({
        from: fromTime as any,
        to: now as any,
      });

      setIsDataRendered(true);
    } else {
      setIsDataRendered(false);
    }
  }, [symbolStore.selectedSymbol, selectedTimeframe, candleStore.candles]);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
    candleStore.setTimeframe(timeframe);
  };

  const latestCandle = symbolStore.selectedSymbol
    ? candleStore.getLatestCandle(symbolStore.selectedSymbol, selectedTimeframe)
    : null;

  const candles = symbolStore.selectedSymbol
    ? candleStore.getCandlesForSymbol(symbolStore.selectedSymbol, selectedTimeframe)
    : [];

  // Show loading if:
  // 1. A symbol is selected AND
  // 2. (Data is still loading OR data hasn't been rendered yet OR no candles available)
  const showLoading = symbolStore.selectedSymbol && (!isDataRendered || candleStore.isLoading || candles.length === 0);
  const showEmpty = !symbolStore.selectedSymbol;

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div className="chart-title">
          <h2>{symbolStore.selectedSymbol || 'Select a symbol'}</h2>
          {latestCandle && (
            <div className="price-info">
              <span className="price">${Number(latestCandle.close).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="timeframe-selector">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`timeframe-btn ${tf === selectedTimeframe ? 'active' : ''}`}
              onClick={() => handleTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container" ref={chartContainerRef} />

      {showLoading && (
        <div className="chart-loading">Loading chart data...</div>
      )}

      {showEmpty && (
        <div className="chart-empty">
          Select a symbol from the watchlist to view chart
        </div>
      )}
    </div>
  );
});
