import { observer } from 'mobx-react-lite';
import { Application } from '../stores/Application';
import type { Timeframe } from '../types/candle';
import './TrendsWidget.scss';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '1d'];

export const TrendsWidget = observer(() => {
  const { watchlist, selectedSymbol } = Application.symbols;

  const handleSymbolClick = (ticker: string) => {
    Application.symbols.selectedSymbol = ticker;
  };

  return (
    <div className="trends-widget">
      <div className="widget-title">
        <span>Trends</span>
      </div>

      <div className="trends-content">
        {/* Header row with timeframes */}
        <div className="trends-header">
          <div className="symbol-column">Symbol</div>
          {TIMEFRAMES.map((tf) => (
            <div key={tf} className="timeframe-column">
              {tf}
            </div>
          ))}
        </div>

        {/* Symbol rows */}
        <div className="trends-body">
          {watchlist.length === 0 ? (
            <div className="empty-state">No symbols in watchlist</div>
          ) : (
            watchlist.map((ticker) => (
              <div
                key={ticker}
                className={`trend-row ${ticker === selectedSymbol ? 'selected' : ''}`}
                onClick={() => handleSymbolClick(ticker)}
              >
                <div className="symbol-column">{ticker}</div>
                {TIMEFRAMES.map((tf) => {
                  // Access observable data directly in render for proper MobX reactivity
                  const symbolObj = Application.symbols.getSymbol(ticker);
                  const trendData = symbolObj.getTrendData(tf);

                  return (
                    <div key={tf} className="timeframe-column">
                      {!trendData || trendData.trend === 'neutral' || trendData.percentChange === null ? (
                        <span className="trend-arrow neutral">—</span>
                      ) : (
                        <span className={`trend-arrow ${trendData.trend}`} title={`${trendData.percentChange.toFixed(2)}%`}>
                          {trendData.trend === 'up' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
