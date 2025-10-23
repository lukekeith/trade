
# Add this new endpoint before the __main__ block

@app.get("/trends")
async def get_all_trends():
    """
    Calculate trends for all symbols and timeframes from database
    Returns all trends in a single response
    """
    try:
        # Get watchlist symbols
        symbols = fetch_watchlist_symbols()
        timeframes = ['1m', '5m', '15m', '30m', '1h', '1d']
        
        all_trends: Dict[str, Dict[str, Dict[str, any]]] = {}
        
        for symbol in symbols:
            symbol_trends = {}
            
            for timeframe in timeframes:
                try:
                    # Fetch candles from database
                    candle_data = fetch_candles(symbol, timeframe, limit=200)
                    
                    if len(candle_data) < 2:
                        symbol_trends[timeframe] = {
                            'trend': 'neutral',
                            'percentChange': None
                        }
                        continue
                    
                    # Calculate simple trend based on last 2 candles
                    latest = candle_data[-1]
                    previous = candle_data[-2]
                    
                    latest_close = latest['close']
                    previous_close = previous['close']
                    
                    percent_change = ((latest_close - previous_close) / previous_close) * 100
                    
                    if percent_change > 0.1:
                        trend = 'up'
                    elif percent_change < -0.1:
                        trend = 'down'
                    else:
                        trend = 'neutral'
                    
                    symbol_trends[timeframe] = {
                        'trend': trend,
                        'percentChange': round(percent_change, 4)
                    }
                    
                except Exception as e:
                    print(f"Error calculating trend for {symbol}:{timeframe}: {e}")
                    symbol_trends[timeframe] = {
                        'trend': 'neutral',
                        'percentChange': None
                    }
            
            all_trends[symbol] = symbol_trends
        
        return {
            'trends': all_trends,
            'symbols': symbols,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error in get_all_trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))
