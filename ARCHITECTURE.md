# Trade Platform - Architecture Documentation

## System Overview

Trade is a modern SaaS trading platform built with a microservices architecture. The system enables users to monitor real-time price data, detect trends across multiple timeframes, and (in future iterations) configure automated trading strategies with AI-powered insights.

## Technology Stack

### Frontend (`/client`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Tailwind CSS)
- **State Management**: MobX
- **Charting**: TradingView Lightweight Charts
- **Real-time Communication**: Socket.io Client

### Backend (`/app`)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: Socket.io
- **Database Client**: node-postgres (pg)
- **Scheduled Jobs**: node-cron
- **Data Source**: yahoo-finance2
- **Testing**: Jest + Supertest

### Calculation Service (`/models`)
- **Language**: Python 3.9+
- **Framework**: FastAPI
- **Data Processing**: pandas, numpy
- **Technical Analysis**: pandas-ta
- **Testing**: pytest

### Database
- **RDBMS**: PostgreSQL 14+
- **Schema**: See `/database/schema.sql`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Client                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Trends     │  │    Chart     │  │   Settings   │         │
│  │   Panel      │  │    Panel     │  │    Modal     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│  ┌──────┴──────────────────┴──────────────────┴───────┐        │
│  │              MobX Store Layer                       │        │
│  │  SymbolStore │ CandleStore │ TrendStore │ etc.    │        │
│  └──────┬───────────────────┬──────────────────┬──────┘        │
│         │                   │                  │                │
└─────────┼───────────────────┼──────────────────┼────────────────┘
          │                   │                  │
          │ HTTP REST         │ WebSocket        │
          │                   │                  │
┌─────────▼───────────────────▼──────────────────▼────────────────┐
│                    Node.js Backend (Express)                     │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │  REST API   │  │  WebSocket   │  │  Polling       │        │
│  │  Endpoints  │  │  Server      │  │  Service       │        │
│  └─────┬───────┘  └──────┬───────┘  └────────┬───────┘        │
│        │                  │                   │                 │
│        │                  │ Broadcast         │ Yahoo Finance   │
│        │                  │                   │ API Calls       │
│        │                  │                   │                 │
└────────┼──────────────────┼───────────────────┼─────────────────┘
         │                  │                   │
         │ SQL              │                   │ Store
         │                  │                   │
┌────────▼──────────────────┴───────────────────▼─────────────────┐
│                     PostgreSQL Database                          │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ candles  │  │ user_settings│  │  panels  │  │watchlists│  │
│  └──────────┘  └──────────────┘  └──────────┘  └──────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              Python Calculation Service (FastAPI)                │
│                                                                  │
│  ┌─────────────────┐          ┌─────────────────┐              │
│  │  /calculate-ema │          │ /calculate-trend│              │
│  └────────┬────────┘          └────────┬────────┘              │
│           │                            │                        │
│  ┌────────▼────────────────────────────▼────────┐              │
│  │    pandas + numpy + pandas-ta                │              │
│  │    EMA, Trend Detection, etc.                │              │
│  └──────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
           ▲
           │ HTTP REST (called from Node backend)
```

## Data Flow

### 1. Initial Page Load
```
User -> Browser
Browser -> Backend: GET /api/settings
Backend -> Database: Query user_settings
Backend -> Browser: User preferences

Browser -> Backend: GET /api/watchlists
Backend -> Database: Query watchlists
Backend -> Browser: Symbol list (e.g., ["SPY", "QQQ", "AAPL"])

Browser -> Backend: GET /api/panels/:panelId
Backend -> Database: Query panel_configs
Backend -> Browser: Panel configurations

Browser -> WebSocket: Connect
WebSocket: Connection established
Browser -> WebSocket: Subscribe to ["SPY", "QQQ", "AAPL"]
Backend: Starts polling Yahoo Finance for subscribed symbols
```

### 2. Real-time Price Updates
```
Polling Service (every 5s):
  For each subscribed symbol:
    Yahoo Finance API -> Backend: Latest OHLCV data
    Backend -> Database: Store in candles table
    Backend -> Python Service: POST /calculate-trend
    Python Service -> Backend: Trend direction (up/down)
    Backend -> WebSocket: Broadcast candle_update event
    Backend -> WebSocket: Broadcast trend_update event
    WebSocket -> Browser: Updates received
    Browser (MobX): Stores updated
    Browser (React): UI re-renders
```

### 3. User Selects Symbol
```
User clicks "SPY" in Trends Panel:
  MobX SymbolStore: Set selectedSymbol = "SPY"
  Chart Panel (observes selectedSymbol): Re-renders
  Chart Panel -> Backend: GET /api/candles/SPY/1h
  Backend -> Database: Query candles WHERE symbol = 'SPY' AND timeframe = '1h'
  Backend -> Chart Panel: Historical candle data
  Chart Panel -> Python Service: POST /calculate-ema (for MA overlays)
  Python Service -> Chart Panel: EMA values
  Chart Panel: Renders chart with candles + EMAs
```

### 4. User Adds New Symbol
```
User types "TSLA" and presses Enter:
  Trends Panel -> Backend: POST /api/symbols { symbol: "TSLA" }
  Backend -> Yahoo Finance: Validate "TSLA" exists
  Backend -> Database: INSERT INTO watchlists
  Backend -> Trends Panel: Success response
  Trends Panel (MobX): Add "TSLA" to watchlist
  Trends Panel -> WebSocket: Subscribe to "TSLA"
  Backend: Starts polling Yahoo Finance for TSLA
  UI: New row appears in Trends Panel
```

### 5. User Changes Chart Timeframe
```
User clicks "5m" button:
  Chart Panel: Set selectedTimeframe = "5m"
  Chart Panel -> Backend: GET /api/candles/SPY/5m
  Backend -> Database: Query candles for 5m timeframe
  Backend -> Chart Panel: 5m candle data
  Chart Panel: Updates chart display
  Chart Panel: Restores saved zoom/pan for this timeframe
```

## Database Schema

### candles
Stores OHLCV (Open, High, Low, Close, Volume) price data.

```sql
CREATE TABLE candles (
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
CREATE INDEX idx_candles_symbol_timeframe_timestamp
  ON candles(symbol, timeframe, timestamp DESC);
```

**Data Retention**:
- 1-minute candles: 30 days
- 1-hour candles: All historical data
- Daily candles: All historical data

**Cleanup Job**: Runs daily via node-cron to purge old 1m data.

### user_settings
Stores user preferences (theme, default symbols, trend reliability, enabled timeframes).

```sql
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**JSONB Structure**:
```json
{
  "theme": "dark",
  "defaultSymbols": ["SPY", "QQQ", "AAPL"],
  "trendReliability": "low",
  "enabledTimeframes": ["1m", "5m", "15m", "1h", "1d"]
}
```

### panel_configs
Stores panel layout and widget-specific configurations.

```sql
CREATE TABLE panel_configs (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  panel_id VARCHAR(50) NOT NULL,
  widget_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, panel_id)
);
```

**Config Examples**:

*Trends Panel*:
```json
{
  "enabledTimeframes": ["1m", "5m", "15m", "1h", "1d"]
}
```

*Chart Panel*:
```json
{
  "movingAverages": [
    { "period": 20, "color": "#2196F3", "weight": 2, "style": "solid" },
    { "period": 50, "color": "#FF9800", "weight": 2, "style": "solid" },
    { "period": 200, "color": "#F44336", "weight": 2, "style": "solid" }
  ],
  "zoom": 1.5,
  "pan": { "x": 100, "y": 50 }
}
```

### watchlists
Stores user symbol lists.

```sql
CREATE TABLE watchlists (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  symbols TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Example**:
```sql
INSERT INTO watchlists (user_id, symbols)
VALUES (NULL, ARRAY['SPY', 'QQQ', 'AAPL', 'TSLA']);
```

## API Endpoints

### Backend REST API (Node.js/Express)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/symbols | Get user's watchlist |
| POST | /api/symbols | Add symbol to watchlist |
| PUT | /api/symbols/:symbol | Update symbol |
| DELETE | /api/symbols/:symbol | Remove symbol |
| GET | /api/candles/:symbol/:timeframe | Get historical candle data |
| GET | /api/settings | Get user settings |
| PUT | /api/settings | Update user settings |
| GET | /api/panels/:panelId | Get panel configuration |
| PUT | /api/panels/:panelId | Update panel configuration |

### WebSocket Events (Socket.io)

**Client -> Server**:
- `subscribe`: Subscribe to symbol updates
  ```json
  { "symbols": ["SPY", "QQQ"] }
  ```
- `unsubscribe`: Unsubscribe from symbols
  ```json
  { "symbols": ["SPY"] }
  ```

**Server -> Client**:
- `candle_update`: New candle data available
  ```json
  {
    "symbol": "SPY",
    "timeframe": "1m",
    "candle": {
      "timestamp": "2025-10-22T10:30:00Z",
      "open": 450.25,
      "high": 450.80,
      "low": 450.10,
      "close": 450.50,
      "volume": 1234567
    }
  }
  ```
- `trend_update`: Trend direction changed
  ```json
  {
    "symbol": "SPY",
    "timeframe": "5m",
    "trend": "up",
    "timestamp": "2025-10-22T10:30:00Z"
  }
  ```

### Python Calculation Service (FastAPI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /calculate-ema | Calculate EMA values |
| POST | /calculate-trend | Determine trend direction |

**POST /calculate-ema**:
```json
Request:
{
  "candles": [
    { "timestamp": "...", "open": 450.0, "high": 451.0, "low": 449.5, "close": 450.5, "volume": 1000000 },
    ...
  ],
  "period": 20
}

Response:
{
  "ema_values": [null, null, ..., 450.23, 450.45]
}
```

**POST /calculate-trend**:
```json
Request:
{
  "symbol": "SPY",
  "timeframe": "5m",
  "candles": [...],
  "ema_period": 20,
  "reliability": "low"
}

Response:
{
  "trend": "up",
  "ema_values": [null, null, ..., 450.23],
  "timestamp": "2025-10-22T10:30:00Z"
}
```

## State Management (MobX)

### Store Structure

```
stores/
├── SymbolStore.ts       # Manages watchlist and selected symbol
├── CandleStore.ts       # Manages candle data for all symbols/timeframes
├── TrendStore.ts        # Manages trend data per symbol/timeframe
├── SettingsStore.ts     # Manages user settings
├── PanelStore.ts        # Manages panel configurations
└── WebSocketStore.ts    # Manages WebSocket connection and subscriptions
```

### SymbolStore
```typescript
class SymbolStore {
  @observable symbols: string[] = [];
  @observable selectedSymbol: string | null = null;

  @action async addSymbol(symbol: string) { ... }
  @action async removeSymbol(symbol: string) { ... }
  @action setSelectedSymbol(symbol: string) { ... }
}
```

### CandleStore
```typescript
class CandleStore {
  @observable candles: Map<string, Candle[]> = new Map();

  @action async fetchCandles(symbol: string, timeframe: Timeframe) { ... }
  @action updateCandle(symbol: string, timeframe: Timeframe, candle: Candle) { ... }

  @computed get currentCandles(): Candle[] {
    const key = `${this.selectedSymbol}:${this.selectedTimeframe}`;
    return this.candles.get(key) || [];
  }
}
```

### WebSocketStore
```typescript
class WebSocketStore {
  @observable isConnected: boolean = false;
  @observable subscribedSymbols: Set<string> = new Set();

  @action connect() { ... }
  @action disconnect() { ... }
  @action subscribe(symbols: string[]) { ... }
  @action unsubscribe(symbols: string[]) { ... }
  @action handleCandleUpdate(data: any) { ... }
  @action handleTrendUpdate(data: any) { ... }
}
```

## Trend Detection Algorithm

The platform supports three reliability levels for trend detection:

### Low Reliability (Fast/Sensitive)
```
IF current_price > 20 EMA:
  trend = "up"
ELSE:
  trend = "down"
```

### Medium Reliability (Balanced)
```
IF current_price > 20 EMA AND 20 EMA > 50 EMA:
  trend = "up"
ELSE:
  trend = "down"
```

### High Reliability (Conservative)
```
IF current_price > 20 EMA AND 20 EMA > 50 EMA AND 50 EMA > 200 EMA:
  trend = "up"
ELSE:
  trend = "down"
```

**Note**: The reliability setting affects which EMAs are considered, requiring different minimum candle counts:
- Low: Minimum 20 candles
- Medium: Minimum 50 candles
- High: Minimum 200 candles

## Performance Considerations

### Frontend Optimizations
1. **React.memo**: Memoize expensive components (Chart, TrendsPanel)
2. **Virtualization**: Use react-window for long symbol lists (if > 50 symbols)
3. **Debouncing**: Debounce API calls for user input (500ms)
4. **WebSocket Throttling**: Throttle incoming updates to 1 per second per symbol
5. **Chart Updates**: Use TradingView's efficient update methods, not full re-renders

### Backend Optimizations
1. **Database Indexing**: Indexes on (symbol, timeframe, timestamp) for fast queries
2. **Connection Pooling**: PostgreSQL pool with max 20 connections
3. **Caching**: In-memory cache for frequently accessed candle data (LRU)
4. **Subscription Deduplication**: Only poll Yahoo Finance for symbols with active subscribers
5. **Rate Limiting**: Respect Yahoo Finance rate limits (1 request per 5 seconds)

### Database Optimizations
1. **Partitioning**: Consider partitioning candles table by date range (future)
2. **Materialized Views**: For pre-computed aggregations (future)
3. **Auto-vacuum**: Configured for high-write candles table
4. **JSONB Indexing**: GIN indexes on settings/config columns for fast queries

## Security Considerations (Pre-Authentication)

Since v1 does not include authentication:
1. **CORS**: Restrict origins to frontend URL only
2. **Rate Limiting**: Per-IP rate limits on API endpoints
3. **Input Validation**: Validate all user inputs (symbol names, timeframes, etc.)
4. **SQL Injection**: Use parameterized queries exclusively
5. **XSS Prevention**: Sanitize any user-generated content
6. **WebSocket Limits**: Max connections per IP, max subscriptions per connection

## Deployment Architecture (Future)

```
┌──────────────┐
│   CloudFlare │  CDN + DDoS Protection
└──────┬───────┘
       │
┌──────▼───────┐
│  Load        │  NGINX or AWS ALB
│  Balancer    │
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐
│  Frontend    │  │  Backend     │  │  Python      │
│  (Static)    │  │  (Node.js)   │  │  Service     │
│  S3/Vercel   │  │  EC2/ECS     │  │  EC2/ECS     │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                  ┌──────▼───────┐
                  │  PostgreSQL  │
                  │  RDS/Managed │
                  └──────────────┘
```

## Monitoring & Observability (Future)

1. **Application Monitoring**: Datadog, New Relic, or Application Insights
2. **Error Tracking**: Sentry for frontend and backend errors
3. **Logging**: Structured logging with Winston (backend) and console (frontend)
4. **Metrics**:
   - API response times
   - WebSocket connection count
   - Database query performance
   - Yahoo Finance API call success rate
   - Cache hit/miss ratio
5. **Alerts**:
   - Backend service down
   - Database connection issues
   - High error rate
   - Yahoo Finance rate limit exceeded

## Development Workflow

### Local Development

1. **Start PostgreSQL**:
   ```bash
   brew services start postgresql@14
   ```

2. **Initialize Database**:
   ```bash
   psql -U tradeuser -d trade -f database/schema.sql
   ```

3. **Start Python Service**:
   ```bash
   cd models
   source venv/bin/activate
   uvicorn main:app --reload
   ```

4. **Start Backend**:
   ```bash
   cd app
   npm run dev
   ```

5. **Start Frontend**:
   ```bash
   cd client
   npm run dev
   ```

### Testing

**Backend Tests**:
```bash
cd app
npm test
```

**Python Tests**:
```bash
cd models
pytest
```

**Frontend Tests** (future):
```bash
cd client
npm test
```

**E2E Tests** (future):
```bash
npm run test:e2e
```

### Git Workflow

1. Create feature branch from `main`
2. Make changes and commit
3. Run tests locally
4. Push to GitHub
5. Create Pull Request
6. CI/CD runs tests
7. Code review
8. Merge to `main`
9. Deploy to production

## Scaling Strategy (Future)

### Horizontal Scaling
- **Backend**: Multiple Node.js instances behind load balancer
- **Python Service**: Multiple FastAPI instances
- **Database**: Read replicas for queries, primary for writes

### Caching Layer
- **Redis**: Cache frequently accessed data (candles, trends)
- **CDN**: Cache static frontend assets

### Message Queue
- **RabbitMQ/SQS**: Decouple data polling from WebSocket broadcasting
- **Worker Processes**: Dedicated workers for Yahoo Finance polling

### Database Optimization
- **Partitioning**: Partition candles table by date
- **Archival**: Move old data to cheaper cold storage
- **Time-series DB**: Consider TimescaleDB or InfluxDB for candle data

## Future Enhancements

### Phase 2: Authentication & Multi-User
- User registration and login (JWT)
- User-specific watchlists and settings
- Multi-device synchronization

### Phase 3: Strategy Builder
- Visual strategy configuration
- Backtesting engine
- Strategy performance metrics

### Phase 4: Automated Trading
- Brokerage API integrations (Alpaca, Interactive Brokers)
- Order execution engine
- Risk management rules
- Trade history and P&L tracking

### Phase 5: AI Integration
- AI-powered trade recommendations
- Pattern recognition (ML models)
- Sentiment analysis from news/social media
- Predictive modeling for price movements

### Phase 6: Advanced Features
- Multiple data sources (Bloomberg, Alpha Vantage)
- Options trading support
- Portfolio management
- Social trading (copy other traders)
- Mobile app (React Native)

## Conclusion

This architecture provides a solid foundation for building a scalable, real-time trading platform. The separation of concerns (frontend, backend, calculation service, database) allows each component to be developed, tested, and scaled independently. The use of modern technologies (React, Node.js, Python, PostgreSQL) ensures a robust and maintainable codebase.

For questions or clarifications, please refer to the README files in each directory or consult the GitHub issues for detailed implementation tasks.
