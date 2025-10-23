-- Add trends table for storing calculated trend data
CREATE TABLE IF NOT EXISTS trends (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  trend VARCHAR(10) NOT NULL CHECK (trend IN ('up', 'down')),
  reliability VARCHAR(10) NOT NULL CHECK (reliability IN ('low', 'medium', 'high')),
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(symbol, timeframe, reliability)
);

-- Index for fast lookups by symbol and timeframe
CREATE INDEX IF NOT EXISTS idx_trends_symbol_timeframe
  ON trends(symbol, timeframe, reliability);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_trends_timestamp
  ON trends(timestamp DESC);
