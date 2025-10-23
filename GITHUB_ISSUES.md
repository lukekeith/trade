# GitHub Issues to Create

Copy and paste each section below as a new GitHub issue at: https://github.com/lukekeith/trade/issues/new

---

## Epic 1: Project Setup

### Issue 1.1: Initialize monorepo structure
**Labels**: `setup`, `infrastructure`

**Description**:
Set up the monorepo structure with three main directories:
- `/app` - Backend Node.js/TypeScript service
- `/client` - Frontend React/TypeScript application
- `/models` - Python FastAPI calculation service
- `/database` - PostgreSQL schema and migrations

**Acceptance Criteria**:
- [ ] All three directories created with proper structure
- [ ] README files in each directory
- [ ] .gitignore configured
- [ ] Dependencies installed for each project

---

### Issue 1.2: Set up CI/CD with GitHub Actions
**Labels**: `setup`, `infrastructure`, `ci/cd`

**Description**:
Configure GitHub Actions for continuous integration:
- Run unit tests on every push
- Run tests on pull requests
- Build and validate all three services
- Code coverage reporting

**Acceptance Criteria**:
- [ ] GitHub Actions workflow file created
- [ ] Backend tests run automatically
- [ ] Python tests run automatically
- [ ] Frontend builds successfully
- [ ] Tests must pass before merge

---

## Epic 2: Data Layer

### Issue 2.1: Implement Yahoo Finance polling service
**Labels**: `backend`, `data`, `enhancement`

**Description**:
Create a service that polls Yahoo Finance API for price data:
- Configurable polling interval (default 5 seconds)
- Only fetch symbols that have active subscribers
- Handle rate limiting gracefully
- Store data in PostgreSQL

**Acceptance Criteria**:
- [ ] Polling service implemented with node-cron
- [ ] Fetches OHLCV data from Yahoo Finance
- [ ] Respects rate limits
- [ ] Stores data in candles table
- [ ] Unit tests with 80%+ coverage
- [ ] Error handling and logging

---

### Issue 2.2: Create database schema and migrations
**Labels**: `database`, `setup`

**Description**:
Set up PostgreSQL database with all required tables:
- candles (price data)
- user_settings
- panel_configs
- watchlists

**Acceptance Criteria**:
- [ ] Schema.sql file created and tested
- [ ] All tables created with proper indexes
- [ ] Default data inserted
- [ ] Migration system documented
- [ ] Database README with setup instructions

---

### Issue 2.3: Build candle data caching system
**Labels**: `backend`, `data`, `performance`

**Description**:
Implement intelligent caching for candle data:
- Cache frequently accessed timeframes in memory
- LRU eviction policy
- Cache invalidation on new data
- Reduce database queries

**Acceptance Criteria**:
- [ ] In-memory cache implemented
- [ ] LRU eviction working correctly
- [ ] Cache hit/miss metrics logged
- [ ] Significant reduction in DB queries
- [ ] Unit tests for cache logic

---

### Issue 2.4: Implement data retention policy
**Labels**: `backend`, `data`, `maintenance`

**Description**:
Automatic data retention and cleanup:
- Keep only 30 days of 1-minute candles
- Keep all 1-hour and daily candles
- Scheduled cleanup job runs daily
- Logging of purged records

**Acceptance Criteria**:
- [ ] Cleanup job implemented with node-cron
- [ ] Runs daily at off-peak hours
- [ ] Purges old 1m candle data
- [ ] Logs number of records deleted
- [ ] Unit tests for purge logic

---

## Epic 3: Backend API

### Issue 3.1: Symbol watchlist CRUD endpoints
**Labels**: `backend`, `api`, `enhancement`

**Description**:
Create REST API endpoints for managing symbol watchlists:
- GET /api/symbols - Get user's watchlist
- POST /api/symbols - Add symbol
- PUT /api/symbols/:symbol - Update symbol
- DELETE /api/symbols/:symbol - Remove symbol
- Validate symbols against Yahoo Finance

**Acceptance Criteria**:
- [ ] All CRUD endpoints implemented
- [ ] Symbol validation working
- [ ] Error handling for invalid symbols
- [ ] Unit tests with Supertest (80%+ coverage)
- [ ] API documentation

---

### Issue 3.2: Candle data retrieval endpoints
**Labels**: `backend`, `api`, `enhancement`

**Description**:
Endpoints for fetching historical candle data:
- GET /api/candles/:symbol/:timeframe
- Query parameters for date ranges
- Pagination support
- Efficient database queries

**Acceptance Criteria**:
- [ ] Endpoint implemented and working
- [ ] Supports date range filtering
- [ ] Pagination working correctly
- [ ] Optimized database queries
- [ ] Unit tests (80%+ coverage)
- [ ] API documentation

---

### Issue 3.3: User settings endpoints
**Labels**: `backend`, `api`, `enhancement`

**Description**:
Manage user preferences and settings:
- GET /api/settings - Get user settings
- PUT /api/settings - Update settings
- Supports theme, default symbols, trend reliability, enabled timeframes

**Acceptance Criteria**:
- [ ] GET endpoint implemented
- [ ] PUT endpoint implemented
- [ ] Settings validation
- [ ] Unit tests (80%+ coverage)
- [ ] API documentation

---

### Issue 3.4: Panel configuration endpoints
**Labels**: `backend`, `api`, `enhancement`

**Description**:
Manage panel layouts and widget configurations:
- GET /api/panels/:panelId - Get panel config
- PUT /api/panels/:panelId - Update panel config
- Supports widget type and widget-specific settings

**Acceptance Criteria**:
- [ ] GET endpoint implemented
- [ ] PUT endpoint implemented
- [ ] Config validation
- [ ] Unit tests (80%+ coverage)
- [ ] API documentation

---

### Issue 3.5: WebSocket server implementation
**Labels**: `backend`, `websocket`, `real-time`, `enhancement`

**Description**:
Implement WebSocket server for real-time updates:
- Handle client connections/disconnections
- Subscribe/unsubscribe to symbols
- Broadcast candle updates
- Broadcast trend updates
- Efficient subscription management

**Acceptance Criteria**:
- [ ] Socket.io server configured
- [ ] Connection handling implemented
- [ ] Subscribe/unsubscribe events working
- [ ] Broadcast logic implemented
- [ ] Only active symbols are fetched
- [ ] Integration tests

---

## Epic 4: Python Calculations Service

### Issue 4.1: EMA calculation endpoint
**Labels**: `python`, `calculations`, `enhancement`

**Description**:
FastAPI endpoint for calculating Exponential Moving Average:
- POST /calculate-ema
- Accepts candle data and period
- Returns EMA values array
- Uses pandas-ta library

**Acceptance Criteria**:
- [ ] Endpoint implemented
- [ ] Accurate EMA calculations
- [ ] Error handling for insufficient data
- [ ] Unit tests with pytest
- [ ] API documentation (Swagger/ReDoc)

---

### Issue 4.2: Trend detection with reliability levels
**Labels**: `python`, `calculations`, `enhancement`

**Description**:
Implement trend detection algorithm:
- POST /calculate-trend
- Support low/medium/high reliability
- Low: Price above 20 EMA
- Medium: Price above 20 EMA AND 20 > 50
- High: Price above 20 EMA AND 20 > 50 > 200

**Acceptance Criteria**:
- [ ] Endpoint implemented
- [ ] All three reliability levels working
- [ ] Accurate trend detection
- [ ] Error handling
- [ ] Unit tests with pytest
- [ ] API documentation

---

### Issue 4.3: Python service integration tests
**Labels**: `python`, `testing`

**Description**:
Comprehensive integration tests for Python service:
- Test all endpoints with real data
- Test edge cases (insufficient candles, invalid data)
- Performance testing
- Load testing

**Acceptance Criteria**:
- [ ] Integration test suite created
- [ ] All endpoints covered
- [ ] Edge cases tested
- [ ] Performance benchmarks established
- [ ] Tests pass consistently

---

## Epic 5: Frontend - Core Layout

### Issue 5.1: Top navigation bar component
**Labels**: `frontend`, `ui`, `enhancement`

**Description**:
Create the top navigation bar:
- Tab navigation (Dashboard, Strategies, Trades)
- User avatar placeholder (right side)
- Responsive design
- Dark mode styling

**Acceptance Criteria**:
- [ ] Navigation component created
- [ ] Tabs functional (routing ready)
- [ ] Avatar placeholder displayed
- [ ] Responsive on all screen sizes
- [ ] Dark mode colors applied

---

### Issue 5.2: Two-column panel container
**Labels**: `frontend`, `ui`, `layout`, `enhancement`

**Description**:
Main content area with two-column layout:
- Left and right panels
- Equal width columns with gap
- Full height layout
- Overflow handling

**Acceptance Criteria**:
- [ ] Panel container component created
- [ ] Two-column grid layout
- [ ] Responsive design
- [ ] Proper overflow handling
- [ ] Dark mode styling

---

### Issue 5.3: Panel widget swapping system
**Labels**: `frontend`, `feature`, `enhancement`

**Description**:
Allow users to change which widget displays in each panel:
- Settings icon on each panel
- Modal to select widget type (Trends or Chart)
- Save selection to backend
- Load saved panel configs on mount

**Acceptance Criteria**:
- [ ] Settings icon clickable
- [ ] Widget selection modal implemented
- [ ] Changes saved to backend API
- [ ] Panel configs loaded on app start
- [ ] MobX store for panel state

---

### Issue 5.4: Settings modal component
**Labels**: `frontend`, `ui`, `component`, `enhancement`

**Description**:
Reusable settings modal for panel configuration:
- Opens on settings icon click
- Widget-specific settings forms
- Save/Cancel buttons
- Validates input
- Persists to backend

**Acceptance Criteria**:
- [ ] Modal component created
- [ ] Dynamic form based on widget type
- [ ] Form validation working
- [ ] Saves to backend API
- [ ] Closes on save or cancel
- [ ] Accessible (keyboard navigation, ARIA)

---

### Issue 5.5: Dark mode theme configuration
**Labels**: `frontend`, `ui`, `styling`

**Description**:
Configure dark mode as default theme:
- Use shadcn/ui dark mode colors
- Apply to all components
- Consistent styling across app
- TradingView chart dark theme

**Acceptance Criteria**:
- [ ] Dark mode CSS variables configured
- [ ] All components use theme colors
- [ ] TradingView chart uses dark theme
- [ ] No light mode artifacts
- [ ] Professional trading platform aesthetic

---

## Epic 6: Frontend - Trends Panel

### Issue 6.1: Symbol list component with inline editing
**Labels**: `frontend`, `ui`, `component`, `enhancement`

**Description**:
Display list of symbols with inline editing:
- Each symbol is a row
- Click to make inline editable
- Press Enter to save
- ESC to cancel
- Validate symbol exists

**Acceptance Criteria**:
- [ ] Symbol list renders correctly
- [ ] Inline editing functional
- [ ] Symbol validation against Yahoo Finance
- [ ] Error modal for invalid symbols
- [ ] Updates backend watchlist
- [ ] MobX store integration

---

### Issue 6.2: Add/edit/delete symbol functionality
**Labels**: `frontend`, `feature`, `enhancement`

**Description**:
Full CRUD for symbols in watchlist:
- Click empty row to add new symbol
- Inline edit existing symbols
- Delete button/icon per symbol
- ThinkOrSwim-style interaction

**Acceptance Criteria**:
- [ ] Add new symbol working
- [ ] Edit symbol working
- [ ] Delete symbol working
- [ ] Optimistic updates with rollback
- [ ] API integration
- [ ] Error handling

---

### Issue 6.3: Trend indicator display
**Labels**: `frontend`, `ui`, `feature`, `enhancement`

**Description**:
Show up/down trend arrows for each timeframe:
- Columns for each enabled timeframe
- Up arrow (↑) for uptrend
- Down arrow (↓) for downtrend
- Color coding (green/red)
- Updates in real-time via WebSocket

**Acceptance Criteria**:
- [ ] Timeframe columns displayed
- [ ] Trend arrows showing correctly
- [ ] Color coding (green up, red down)
- [ ] Real-time updates working
- [ ] Smooth visual transitions

---

### Issue 6.4: Timeframe column visibility settings
**Labels**: `frontend`, `ui`, `settings`, `enhancement`

**Description**:
Configure which timeframe columns to display:
- Settings modal with timeframe checkboxes
- Enable/disable 1m, 2m, 5m, 10m, 15m, 30m, 1h, 2h, 1d
- Save preferences to backend
- Apply immediately

**Acceptance Criteria**:
- [ ] Settings modal has timeframe toggles
- [ ] Enabling/disabling columns works
- [ ] Preferences saved to backend
- [ ] Loads saved preferences on mount
- [ ] Only enabled columns request data

---

### Issue 6.5: Symbol selection and chart sync
**Labels**: `frontend`, `feature`, `integration`, `enhancement`

**Description**:
Clicking a symbol selects it and updates chart:
- Click symbol row to select
- Visual selection indicator
- Chart panel updates to show selected symbol
- MobX store syncs state between panels

**Acceptance Criteria**:
- [ ] Symbol selection working
- [ ] Visual indicator (highlight, border, etc.)
- [ ] Chart updates to selected symbol
- [ ] MobX store manages selected symbol
- [ ] State synced across panels

---

### Issue 6.6: Trends MobX store
**Labels**: `frontend`, `state`, `mobx`

**Description**:
MobX store for managing trends data:
- Symbol watchlist state
- Trend data per symbol/timeframe
- Selected symbol
- Enabled timeframes
- WebSocket subscription management

**Acceptance Criteria**:
- [ ] MobX store created
- [ ] Observables defined
- [ ] Actions for CRUD operations
- [ ] Computed values for derived state
- [ ] WebSocket integration
- [ ] React components observe store

---

## Epic 7: Frontend - Chart Panel

### Issue 7.1: TradingView Lightweight Charts integration
**Labels**: `frontend`, `charts`, `integration`, `enhancement`

**Description**:
Integrate TradingView Lightweight Charts library:
- Initialize chart instance
- Render candlestick series
- Dark mode theme
- Responsive sizing
- Cleanup on unmount

**Acceptance Criteria**:
- [ ] Chart library installed and imported
- [ ] Chart renders in panel
- [ ] Dark theme applied
- [ ] Responsive to panel resize
- [ ] Memory cleanup on unmount

---

### Issue 7.2: Timeframe selector
**Labels**: `frontend`, `ui`, `feature`, `enhancement`

**Description**:
Timeframe selector buttons for the chart:
- Buttons: 1m, 2m, 5m, 10m, 15m, 30m, 1h, 2h, 1d
- Clicking changes chart timeframe
- Changes candlestick interval
- Adjusts visible date range
- Active state indicator

**Acceptance Criteria**:
- [ ] Timeframe buttons displayed
- [ ] Clicking button changes chart timeframe
- [ ] Fetches correct candle data
- [ ] Updates candlestick interval
- [ ] Visual active state
- [ ] Smooth transitions

---

### Issue 7.3: EMA overlay lines with custom styling
**Labels**: `frontend`, `charts`, `feature`, `enhancement`

**Description**:
Display moving average lines on chart:
- Overlay EMA lines (default: 20, 50, 200)
- Custom colors per MA
- Custom line weight
- Custom line style (solid, dashed, dotted)
- Configurable in settings

**Acceptance Criteria**:
- [ ] EMA lines render on chart
- [ ] Fetches EMA data from Python service
- [ ] Custom styling applied (color, weight, style)
- [ ] Multiple MAs supported
- [ ] Updates when symbol changes

---

### Issue 7.4: Chart state persistence
**Labels**: `frontend`, `feature`, `enhancement`

**Description**:
Persist chart zoom and pan across symbol changes:
- Save zoom level when user zooms
- Save pan position when user pans
- Restore state when switching symbols
- Store in panel config

**Acceptance Criteria**:
- [ ] Zoom level saved
- [ ] Pan position saved
- [ ] State restored on symbol switch
- [ ] State persisted to backend
- [ ] Smooth user experience

---

### Issue 7.5: MA configuration settings modal
**Labels**: `frontend`, `ui`, `settings`, `enhancement`

**Description**:
Settings modal to configure moving averages:
- Add/remove MAs
- Set period (e.g., 20, 50, 200)
- Choose color (color picker)
- Set line weight (1-5)
- Set line style (solid, dashed, dotted)
- Save to backend

**Acceptance Criteria**:
- [ ] Settings modal opens from chart panel
- [ ] Add/remove MA controls
- [ ] All configuration options working
- [ ] Color picker functional
- [ ] Saves to backend
- [ ] Chart updates immediately

---

### Issue 7.6: Chart MobX store
**Labels**: `frontend`, `state`, `mobx`

**Description**:
MobX store for managing chart state:
- Candle data per symbol/timeframe
- EMA data
- Selected timeframe
- Zoom/pan state
- MA configurations
- WebSocket updates

**Acceptance Criteria**:
- [ ] MobX store created
- [ ] Observables for all chart state
- [ ] Actions for data fetching
- [ ] Computed values for derived data
- [ ] WebSocket integration
- [ ] Chart component observes store

---

## Epic 8: Real-time Updates

### Issue 8.1: WebSocket integration on frontend
**Labels**: `frontend`, `websocket`, `real-time`, `enhancement`

**Description**:
Connect frontend to WebSocket server:
- Socket.io client setup
- Connection management
- Reconnection logic
- Error handling
- MobX store integration

**Acceptance Criteria**:
- [ ] Socket.io client installed
- [ ] Connection established to backend
- [ ] Reconnects on disconnect
- [ ] Error handling and logging
- [ ] Integration with MobX stores

---

### Issue 8.2: Subscribe to symbols when widgets mount
**Labels**: `frontend`, `websocket`, `real-time`, `enhancement`

**Description**:
Subscribe to symbol data when widgets need it:
- Subscribe on widget mount
- Subscribe when symbol added to watchlist
- Send subscribe event via WebSocket
- Backend starts sending updates

**Acceptance Criteria**:
- [ ] Subscribe event sent on mount
- [ ] Subscribe event includes symbol list
- [ ] Backend acknowledges subscription
- [ ] Updates received from backend
- [ ] Multiple subscriptions handled

---

### Issue 8.3: Unsubscribe when widgets unmount
**Labels**: `frontend`, `websocket`, `real-time`, `enhancement`

**Description**:
Clean up subscriptions when widgets unmount:
- Unsubscribe on widget unmount
- Unsubscribe when symbol removed
- Send unsubscribe event via WebSocket
- Backend stops sending updates

**Acceptance Criteria**:
- [ ] Unsubscribe event sent on unmount
- [ ] Backend stops sending data
- [ ] No memory leaks
- [ ] Proper cleanup

---

### Issue 8.4: Handle real-time candle updates
**Labels**: `frontend`, `websocket`, `real-time`, `enhancement`

**Description**:
Process incoming candle data updates:
- Listen for candle_update events
- Update MobX stores
- Update chart display
- Update trends panel

**Acceptance Criteria**:
- [ ] Listens for candle_update events
- [ ] Parses incoming data
- [ ] Updates stores correctly
- [ ] UI updates reactively
- [ ] No performance issues

---

### Issue 8.5: Handle real-time trend updates
**Labels**: `frontend`, `websocket`, `real-time`, `enhancement`

**Description**:
Process incoming trend changes:
- Listen for trend_update events
- Update trend indicators
- Smooth visual transitions
- Color changes

**Acceptance Criteria**:
- [ ] Listens for trend_update events
- [ ] Updates trend arrows in UI
- [ ] Smooth transitions (not jarring)
- [ ] Color updates (green/red)
- [ ] No performance issues

---

### Issue 8.6: WebSocket reconnection logic
**Labels**: `frontend`, `websocket`, `reliability`, `enhancement`

**Description**:
Robust reconnection handling:
- Detect disconnections
- Exponential backoff retry
- Resubscribe to symbols on reconnect
- Show connection status to user

**Acceptance Criteria**:
- [ ] Detects disconnections
- [ ] Automatic reconnection attempts
- [ ] Exponential backoff implemented
- [ ] Resubscribes after reconnect
- [ ] User sees connection status indicator
- [ ] Handles multiple disconnect/reconnect cycles

---

## Epic 9: Polish & Testing

### Issue 9.1: Error handling and user feedback
**Labels**: `frontend`, `ux`, `enhancement`

**Description**:
Comprehensive error handling:
- Invalid symbol modal
- API error messages
- WebSocket connection errors
- Loading states
- Empty states

**Acceptance Criteria**:
- [ ] Invalid symbol shows error modal
- [ ] API errors display user-friendly messages
- [ ] WebSocket errors handled gracefully
- [ ] Loading spinners during data fetch
- [ ] Empty states for no data

---

### Issue 9.2: Default symbol list on first load
**Labels**: `frontend`, `feature`, `enhancement`

**Description**:
Load default symbols on first app visit:
- Default: SPY, QQQ, AAPL
- Only on first visit (no saved watchlist)
- Store in backend after first load
- Never show defaults again after user customizes

**Acceptance Criteria**:
- [ ] Defaults load on first visit
- [ ] Stored to backend immediately
- [ ] Subsequent visits load user's list
- [ ] No hardcoded symbols after customization

---

### Issue 9.3: LocalStorage fallback for unauthenticated state
**Labels**: `frontend`, `feature`, `enhancement`

**Description**:
Use localStorage when user is not authenticated:
- Store watchlist in localStorage
- Store panel configs in localStorage
- Sync with backend when available
- Migrate to backend when auth is added

**Acceptance Criteria**:
- [ ] LocalStorage read/write working
- [ ] Watchlist persisted locally
- [ ] Panel configs persisted locally
- [ ] Loads on app restart
- [ ] Ready to migrate to backend auth

---

### Issue 9.4: End-to-end testing setup
**Labels**: `testing`, `e2e`, `infrastructure`

**Description**:
Set up E2E testing with Playwright or Cypress:
- Install testing framework
- Configure test environment
- Write critical path tests
- Run in CI/CD

**Acceptance Criteria**:
- [ ] Testing framework installed
- [ ] Test environment configured
- [ ] Tests for: add symbol, view chart, change timeframe
- [ ] Tests pass consistently
- [ ] Runs in GitHub Actions

---

### Issue 9.5: Performance optimization
**Labels**: `performance`, `optimization`

**Description**:
Optimize app performance:
- React.memo for expensive components
- Virtualization for long symbol lists
- Debounce API calls
- Optimize WebSocket message handling
- Chart rendering optimization

**Acceptance Criteria**:
- [ ] Components memoized appropriately
- [ ] Symbol list virtualized if needed
- [ ] No unnecessary re-renders
- [ ] WebSocket handling efficient
- [ ] Chart updates smooth (60fps)
- [ ] Lighthouse performance score > 90

---

### Issue 9.6: Documentation
**Labels**: `documentation`

**Description**:
Comprehensive project documentation:
- Update main README
- API documentation
- Component documentation
- Development setup guide
- Deployment guide
- Architecture diagrams

**Acceptance Criteria**:
- [ ] README is complete and accurate
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Setup instructions tested
- [ ] Deployment guide written
- [ ] Architecture diagram created

---

## Future Enhancements (Post-v1)

### Authentication & User Management
- User registration and login
- JWT authentication
- User profiles
- Multi-device sync

### Strategy Configuration
- Create custom trading strategies
- Backtest strategies
- Strategy performance metrics

### Automated Trading
- Connect to brokerage APIs
- Place orders automatically
- Risk management rules
- Trade history tracking

### AI Integration
- AI-powered trade recommendations
- Pattern recognition
- Sentiment analysis
- Predictive modeling

### Multiple Data Sources
- Integrate additional data providers
- Real-time data subscriptions
- Alternative data sources

---

## Labels to Create in GitHub

Create these labels in your repository:
- `setup` - Initial project setup
- `infrastructure` - Infrastructure and DevOps
- `ci/cd` - Continuous Integration/Deployment
- `backend` - Backend Node.js work
- `frontend` - Frontend React work
- `python` - Python service work
- `database` - Database-related
- `api` - API development
- `websocket` - WebSocket functionality
- `real-time` - Real-time features
- `ui` - User interface
- `component` - React component
- `feature` - New feature
- `enhancement` - Enhancement to existing feature
- `data` - Data management
- `performance` - Performance optimization
- `testing` - Testing-related
- `e2e` - End-to-end testing
- `documentation` - Documentation
- `bug` - Bug fix
- `charts` - Chart functionality
- `calculations` - Calculations/algorithms
- `state` - State management
- `mobx` - MobX store
- `layout` - Layout/structure
- `styling` - CSS/styling
- `settings` - Settings/configuration
- `integration` - Integration between systems
- `ux` - User experience
- `reliability` - Reliability/error handling
- `maintenance` - Maintenance tasks
- `optimization` - Code optimization
