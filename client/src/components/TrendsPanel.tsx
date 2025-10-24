import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Plus, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Application } from '../stores/Application';
import { WidgetHeader } from './WidgetHeader';
import type { WidgetType } from '../types/widget';
import '../styles/TrendsPanel.scss';

interface TrendsPanelProps {
  onWidgetChange?: (newType: WidgetType) => void;
}

export const TrendsPanel = observer(({ onWidgetChange }: TrendsPanelProps) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const handleAddSymbol = async () => {
    if (!newSymbol.trim()) return;

    try {
      await Application.symbols.addSymbol(newSymbol.trim());
      setNewSymbol('');
      setShowAddInput(false);
    } catch (error) {
      // Error is already set in the store
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    if (confirm(`Remove ${symbol} from watchlist?`)) {
      await Application.symbols.removeSymbol(symbol);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    Application.symbols.selectSymbol(symbol);
  };

  const handleWidgetChange = (newType: WidgetType) => {
    if (onWidgetChange) {
      onWidgetChange(newType);
    }
  };

  return (
    <div className="WidgetWatchlist">
      <WidgetHeader
        widgetType="watchlist"
        onWidgetChange={handleWidgetChange}
        actions={
          <button
            className="WidgetWatchlist__AddButton"
            onClick={() => setShowAddInput(true)}
            title="Add Symbol"
          >
            <Plus size={16} />
          </button>
        }
      />

      {Application.symbols.error && (
        <div className="WidgetWatchlist__Error">
          {Application.symbols.error}
          <button onClick={() => Application.symbols.clearError()}>
            <X size={16} />
          </button>
        </div>
      )}

      {showAddInput && (
        <div className="WidgetWatchlist__AddInput">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
            placeholder="Enter symbol (e.g., MSFT)"
            autoFocus
          />
          <button onClick={handleAddSymbol}>Add</button>
          <button onClick={() => { setShowAddInput(false); setNewSymbol(''); }}>Cancel</button>
        </div>
      )}

      <div className="WidgetWatchlist__List">
        {Application.symbols.isLoadingWatchlist && Application.symbols.watchlist.length === 0 ? (
          <div className="WidgetWatchlist__Loading">Loading symbols...</div>
        ) : Application.symbols.watchlist.length === 0 ? (
          <div className="WidgetWatchlist__Empty">No symbols in watchlist</div>
        ) : (
          Application.symbols.watchlist.map((ticker) => {
            // Access observable data directly in render for proper MobX reactivity
            const symbolObj = Application.symbols.getSymbol(ticker);
            const latestCandle = symbolObj.getLatestCandle('1d');
            const priceChange = symbolObj.getDailyChange();
            const isSelected = ticker === Application.symbols.selectedSymbol;

            return (
              <div
                key={ticker}
                className={`WidgetWatchlist__Symbol ${isSelected ? 'WidgetWatchlist__Symbol--selected' : ''}`}
                onClick={() => handleSelectSymbol(ticker)}
              >
                <span className="WidgetWatchlist__SymbolName">{ticker}</span>
                <span className={`WidgetWatchlist__SymbolPrice ${priceChange ? (priceChange.isPositive ? 'WidgetWatchlist__SymbolPrice--positive' : 'WidgetWatchlist__SymbolPrice--negative') : ''}`}>
                  {latestCandle ? `$${Number(latestCandle.close).toFixed(2)}` : '—'}
                </span>
                {priceChange && (
                  <span className={`WidgetWatchlist__SymbolChange ${priceChange.isPositive ? 'WidgetWatchlist__SymbolChange--positive' : 'WidgetWatchlist__SymbolChange--negative'}`}>
                    {priceChange.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(priceChange.value).toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
