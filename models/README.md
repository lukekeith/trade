# Trade Calculation Service (Python)

FastAPI service for technical analysis calculations.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
uvicorn main:app --reload
```

The service will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### `POST /calculate-ema`
Calculate Exponential Moving Average values for chart overlay.

### `POST /calculate-trend`
Calculate trend direction (up/down) based on EMA and reliability level.

Reliability levels:
- `low`: Price above 20 EMA = uptrend
- `medium`: Price above 20 EMA AND 20 > 50 = uptrend
- `high`: Price above 20 EMA AND 20 > 50 > 200 = uptrend
