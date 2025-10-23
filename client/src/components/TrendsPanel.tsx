import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Application } from '../stores/Application';
import '../styles/TrendsPanel.scss';

export const TrendsPanel = observer(() => {
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

  return (
    <div className="trends-panel">
      <div className="trends-header">
        <h2>Watchlist</h2>
        <button
          className="add-symbol-btn"
          onClick={() => setShowAddInput(true)}
          title="Add Symbol"
        >
          +
        </button>
      </div>

      {Application.symbols.error && (
        <div className="error-message">
          {Application.symbols.error}
          <button onClick={() => Application.symbols.clearError()}>×</button>
        </div>
      )}

      {showAddInput && (
        <div className="add-symbol-input">
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

      <div className="symbols-list">
        {Application.symbols.isLoadingWatchlist && Application.symbols.watchlist.length === 0 ? (
          <div className="loading">Loading symbols...</div>
        ) : Application.symbols.watchlist.length === 0 ? (
          <div className="empty-state">No symbols in watchlist</div>
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
                className={`symbol-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectSymbol(ticker)}
              >
                <div className="symbol-info">
                  <span className="symbol-name">{ticker}</span>
                  <span className="symbol-price">
                    {latestCandle ? `$${Number(latestCandle.close).toFixed(2)}` : '—'}
                  </span>
                </div>

                {priceChange && (
                  <div className={`price-change ${priceChange.isPositive ? 'positive' : 'negative'}`}>
                    {priceChange.isPositive ? '▲' : '▼'} {Math.abs(priceChange.value).toFixed(2)}%
                  </div>
                )}

                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSymbol(ticker);
                  }}
                  title="Remove symbol"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
