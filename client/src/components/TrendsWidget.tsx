import { observer } from 'mobx-react-lite';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Application } from '../stores/Application';
import { WidgetHeader } from './WidgetHeader';
import type { Timeframe } from '../types/candle';
import type { WidgetType } from '../types/widget';
import './TrendsWidget.scss';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '1d'];

interface TrendsWidgetProps {
  onWidgetChange?: (newType: WidgetType) => void;
}

export const TrendsWidget = observer(({ onWidgetChange }: TrendsWidgetProps) => {
  const { watchlist, selectedSymbol } = Application.symbols;

  const handleSymbolClick = (ticker: string) => {
    Application.symbols.selectedSymbol = ticker;
  };

  const handleWidgetChange = (newType: WidgetType) => {
    if (onWidgetChange) {
      onWidgetChange(newType);
    }
  };

  return (
    <div className="WidgetTrends">
      <WidgetHeader
        widgetType="trends"
        onWidgetChange={handleWidgetChange}
      />

      <div className="WidgetTrends__Content">
        {/* Header row with timeframes */}
        <div className="WidgetTrends__TableHeader">
          <div className="WidgetTrends__SymbolColumn">Symbol</div>
          {TIMEFRAMES.map((tf) => (
            <div key={tf} className="WidgetTrends__TimeframeColumn">
              {tf}
            </div>
          ))}
        </div>

        {/* Symbol rows */}
        <div className="WidgetTrends__TableBody">
          {watchlist.length === 0 ? (
            <div className="WidgetTrends__Empty">No symbols in watchlist</div>
          ) : (
            watchlist.map((ticker) => (
              <div
                key={ticker}
                className={`WidgetTrends__Row ${ticker === selectedSymbol ? 'WidgetTrends__Row--selected' : ''}`}
                onClick={() => handleSymbolClick(ticker)}
              >
                <div className="WidgetTrends__SymbolColumn">{ticker}</div>
                {TIMEFRAMES.map((tf) => {
                  // Access observable data directly in render for proper MobX reactivity
                  const symbolObj = Application.symbols.getSymbol(ticker);
                  const trendData = symbolObj.getTrendData(tf);

                  return (
                    <div key={tf} className="WidgetTrends__TimeframeColumn">
                      {!trendData || trendData.trend === 'neutral' || trendData.percentChange === null ? (
                        <span className="WidgetTrends__Arrow WidgetTrends__Arrow--neutral">—</span>
                      ) : (
                        <span className={`WidgetTrends__Arrow WidgetTrends__Arrow--${trendData.trend}`} title={`${trendData.percentChange.toFixed(2)}%`}>
                          {trendData.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
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
