-- Trade Platform Database Schema

-- Price data with efficient time-series queries
CREATE TABLE IF NOT EXISTS candles (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  open DECIMAL(12, 4) NOT NULL,
  high DECIMAL(12, 4) NOT NULL,
  low DECIMAL(12, 4) NOT NULL,
  close DECIMAL(12, 4) NOT NULL,
  volume BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Index for fast lookups by symbol, timeframe, and timestamp
CREATE INDEX IF NOT EXISTS idx_candles_symbol_timeframe_timestamp
  ON candles(symbol, timeframe, timestamp DESC);

-- Index for efficient range queries
CREATE INDEX IF NOT EXISTS idx_candles_timestamp
  ON candles(timestamp DESC);


-- User settings (for post-auth, user_id is NULL for now)
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for user settings lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON user_settings(user_id);


-- Panel configurations
CREATE TABLE IF NOT EXISTS panel_configs (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  panel_id VARCHAR(50) NOT NULL,
  widget_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, panel_id)
);

-- Index for panel config lookup
CREATE INDEX IF NOT EXISTS idx_panel_configs_user_panel
  ON panel_configs(user_id, panel_id);


-- Symbol watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  symbols TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for watchlist lookup
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id
  ON watchlists(user_id);


-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_panel_configs_updated_at BEFORE UPDATE ON panel_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Insert default settings for unauthenticated user (user_id = NULL)
INSERT INTO user_settings (user_id, settings)
VALUES (
  NULL,
  '{"theme": "dark", "defaultSymbols": ["SPY", "QQQ", "AAPL"], "trendReliability": "low", "enabledTimeframes": ["1m", "5m", "15m", "1h", "1d"]}'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert default watchlist for unauthenticated user
INSERT INTO watchlists (user_id, symbols)
VALUES (NULL, ARRAY['SPY', 'QQQ', 'AAPL'])
ON CONFLICT DO NOTHING;

-- Insert default panel configurations for unauthenticated user
INSERT INTO panel_configs (user_id, panel_id, widget_type, config)
VALUES
  (NULL, 'left', 'trends', '{"enabledTimeframes": ["1m", "5m", "15m", "1h", "1d"]}'::jsonb),
  (NULL, 'right', 'chart', '{"movingAverages": [{"period": 20, "color": "#2196F3", "weight": 2, "style": "solid"}, {"period": 50, "color": "#FF9800", "weight": 2, "style": "solid"}, {"period": 200, "color": "#F44336", "weight": 2, "style": "solid"}]}'::jsonb)
ON CONFLICT (user_id, panel_id) DO NOTHING;
