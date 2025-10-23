from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal
import pandas as pd
import pandas_ta as ta
from datetime import datetime

app = FastAPI(title="Trade Calculation Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class CandleData(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class CalculateEMARequest(BaseModel):
    candles: List[CandleData]
    period: int


class CalculateEMAResponse(BaseModel):
    ema_values: List[float | None]


class CalculateTrendRequest(BaseModel):
    symbol: str
    timeframe: str
    candles: List[CandleData]
    ema_period: int = 20
    reliability: Literal["low", "medium", "high"] = "low"


class CalculateTrendResponse(BaseModel):
    trend: Literal["up", "down"]
    ema_values: List[float | None]
    timestamp: str


# Utility functions
def candles_to_dataframe(candles: List[CandleData]) -> pd.DataFrame:
    """Convert candle data to pandas DataFrame"""
    data = []
    for candle in candles:
        data.append({
            'timestamp': pd.to_datetime(candle.timestamp),
            'open': candle.open,
            'high': candle.high,
            'low': candle.low,
            'close': candle.close,
            'volume': candle.volume
        })
    df = pd.DataFrame(data)
    df.set_index('timestamp', inplace=True)
    df.sort_index(inplace=True)
    return df


def calculate_ema(df: pd.DataFrame, period: int) -> pd.Series:
    """Calculate Exponential Moving Average"""
    return ta.ema(df['close'], length=period)


def determine_trend(
    df: pd.DataFrame,
    reliability: Literal["low", "medium", "high"]
) -> Literal["up", "down"]:
    """
    Determine trend based on reliability level:
    - low: Price above 20 EMA = uptrend
    - medium: Price above 20 EMA AND 20 > 50 = uptrend
    - high: Price above 20 EMA AND 20 > 50 > 200 = uptrend
    """
    current_price = df['close'].iloc[-1]

    ema_20 = calculate_ema(df, 20).iloc[-1]

    if reliability == "low":
        return "up" if current_price > ema_20 else "down"

    ema_50 = calculate_ema(df, 50).iloc[-1]

    if reliability == "medium":
        if current_price > ema_20 and ema_20 > ema_50:
            return "up"
        else:
            return "down"

    # High reliability
    ema_200 = calculate_ema(df, 200).iloc[-1]

    if current_price > ema_20 and ema_20 > ema_50 and ema_50 > ema_200:
        return "up"
    else:
        return "down"


# Routes
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "trade-calculation-service",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/calculate-ema", response_model=CalculateEMAResponse)
async def calculate_ema_endpoint(request: CalculateEMARequest):
    """Calculate EMA values for chart overlay"""
    try:
        if len(request.candles) < request.period:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough candles. Need at least {request.period} candles."
            )

        df = candles_to_dataframe(request.candles)
        ema_series = calculate_ema(df, request.period)

        # Convert to list, replacing NaN with None for JSON serialization
        ema_values = [float(v) if pd.notna(v) else None for v in ema_series]

        return CalculateEMAResponse(ema_values=ema_values)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate-trend", response_model=CalculateTrendResponse)
async def calculate_trend_endpoint(request: CalculateTrendRequest):
    """Calculate trend direction based on reliability level"""
    try:
        # Validate we have enough candles based on reliability
        min_candles = {
            "low": 20,
            "medium": 50,
            "high": 200
        }

        required = min_candles[request.reliability]
        if len(request.candles) < required:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough candles for {request.reliability} reliability. Need at least {required} candles."
            )

        df = candles_to_dataframe(request.candles)
        trend = determine_trend(df, request.reliability)

        # Calculate EMA values for the requested period
        ema_series = calculate_ema(df, request.ema_period)
        ema_values = [float(v) if pd.notna(v) else None for v in ema_series]

        return CalculateTrendResponse(
            trend=trend,
            ema_values=ema_values,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
