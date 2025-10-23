import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { symbolStore } from '../stores/SymbolStore';
import { candleStore } from '../stores/CandleStore';
import '../styles/TrendsPanel.scss';

export const TrendsPanel = observer(() => {
  const [newSymbol, setNewSymbol] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    // Fetch symbols on mount
    symbolStore.fetchSymbols();
  }, []);

  const handleAddSymbol = async () => {
    if (!newSymbol.trim()) return;

    const success = await symbolStore.addSymbol(newSymbol.trim());
    if (success) {
      setNewSymbol('');
      setShowAddInput(false);
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    if (confirm(`Remove ${symbol} from watchlist?`)) {
      await symbolStore.removeSymbol(symbol);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    symbolStore.selectSymbol(symbol);
  };

  const getLatestPrice = (symbol: string) => {
    const candle = candleStore.getLatestCandle(symbol, '1d');
    return candle ? `$${Number(candle.close).toFixed(2)}` : '—';
  };

  const getPriceChange = (symbol: string) => {
    const candles = candleStore.getCandlesForSymbol(symbol, '1d');
    if (candles.length < 2) return null;

    const latest = candles[candles.length - 1];
    const previous = candles[candles.length - 2];
    const latestClose = Number(latest.close);
    const previousClose = Number(previous.close);
    const change = ((latestClose - previousClose) / previousClose) * 100;

    return {
      value: change.toFixed(2),
      isPositive: change >= 0,
    };
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

      {symbolStore.error && (
        <div className="error-message">
          {symbolStore.error}
          <button onClick={() => symbolStore.clearError()}>×</button>
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
        {symbolStore.isLoading && symbolStore.symbols.length === 0 ? (
          <div className="loading">Loading symbols...</div>
        ) : symbolStore.symbols.length === 0 ? (
          <div className="empty-state">No symbols in watchlist</div>
        ) : (
          symbolStore.symbols.map((symbol) => {
            const priceChange = getPriceChange(symbol);
            const isSelected = symbol === symbolStore.selectedSymbol;

            return (
              <div
                key={symbol}
                className={`symbol-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectSymbol(symbol)}
              >
                <div className="symbol-info">
                  <span className="symbol-name">{symbol}</span>
                  <span className="symbol-price">{getLatestPrice(symbol)}</span>
                </div>

                {priceChange && (
                  <div className={`price-change ${priceChange.isPositive ? 'positive' : 'negative'}`}>
                    {priceChange.isPositive ? '▲' : '▼'} {Math.abs(parseFloat(priceChange.value))}%
                  </div>
                )}

                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSymbol(symbol);
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

      <div className="trends-footer">
        <span className="symbol-count">{symbolStore.symbols.length} symbols</span>
      </div>
    </div>
  );
});
