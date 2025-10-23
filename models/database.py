"""
Database connection module for PostgreSQL
"""
import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
from typing import List, Dict, Any

# Load environment variables
load_dotenv()

# Database connection pool
connection_pool = None


def init_db_pool():
    """Initialize the database connection pool"""
    global connection_pool

    if connection_pool is None:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1,  # Min connections
            10,  # Max connections
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'trade'),
            user=os.getenv('DB_USER', 'tradeuser'),
            password=os.getenv('DB_PASSWORD', 'tradepass123')
        )

    return connection_pool


def get_db_connection():
    """Get a connection from the pool"""
    if connection_pool is None:
        init_db_pool()

    return connection_pool.getconn()


def return_db_connection(conn):
    """Return a connection to the pool"""
    if connection_pool is not None:
        connection_pool.putconn(conn)


def close_db_pool():
    """Close all connections in the pool"""
    global connection_pool

    if connection_pool is not None:
        connection_pool.closeall()
        connection_pool = None


def fetch_candles(symbol: str, timeframe: str, limit: int = 1000) -> List[Dict[str, Any]]:
    """
    Fetch candles from database for a given symbol and timeframe

    Args:
        symbol: The stock symbol (e.g., 'SPY')
        timeframe: The timeframe (e.g., '1d', '1h', '15m')
        limit: Maximum number of candles to fetch

    Returns:
        List of candle dictionaries with keys: timestamp, open, high, low, close, volume
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT timestamp, open, high, low, close, volume
                FROM candles
                WHERE symbol = %s AND timeframe = %s
                ORDER BY timestamp ASC
                LIMIT %s
            """
            cursor.execute(query, (symbol, timeframe, limit))

            candles = []
            for row in cursor.fetchall():
                candles.append({
                    'timestamp': row[0].isoformat() if row[0] else None,
                    'open': float(row[1]) if row[1] else 0,
                    'high': float(row[2]) if row[2] else 0,
                    'low': float(row[3]) if row[3] else 0,
                    'close': float(row[4]) if row[4] else 0,
                    'volume': int(row[5]) if row[5] else 0
                })

            return candles

    finally:
        return_db_connection(conn)


def fetch_watchlist_symbols() -> List[str]:
    """
    Fetch all symbols in the watchlist

    Returns:
        List of symbol strings
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Try to get from watchlist table first, fallback to distinct symbols from candles
            try:
                cursor.execute("SELECT symbol FROM watchlist ORDER BY symbol")
                return [row[0] for row in cursor.fetchall()]
            except Exception as e:
                # Rollback transaction after error
                conn.rollback()
                # If watchlist table doesn't exist, get distinct symbols from candles
                cursor.execute("SELECT DISTINCT symbol FROM candles ORDER BY symbol")
                return [row[0] for row in cursor.fetchall()]

    finally:
        return_db_connection(conn)
