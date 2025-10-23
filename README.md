# Trade - AI-Powered Trading Platform

A SaaS application for configuring automated trading strategies with AI-powered insights.

## Architecture

This monorepo contains three main components:

### `/app` - Backend (Node.js/TypeScript)
- Express REST API
- WebSocket server for real-time updates
- Data polling from Yahoo Finance
- PostgreSQL integration

### `/client` - Frontend (React/TypeScript)
- React 18 + TypeScript + Vite
- shadcn/ui component library (dark mode)
- MobX state management
- TradingView Lightweight Charts
- WebSocket client

### `/models` - Python Calculation Service
- FastAPI service
- Technical analysis calculations (EMA, trends)
- pandas/numpy for data processing

## Features (v1)

- Real-time price monitoring with multiple timeframes
- Trend detection across timeframes (1m - 1d)
- Interactive TradingView charts with customizable moving averages
- Symbol watchlist management
- Configurable panel system
- WebSocket-based real-time updates

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone git@github.com:lukekeith/trade.git
cd trade
```

2. Set up backend:
```bash
cd app
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

3. Set up frontend:
```bash
cd client
npm install
npm run dev
```

4. Set up Python service:
```bash
cd models
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Development

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5173`
- Python service runs on `http://localhost:8000`

## License

MIT
