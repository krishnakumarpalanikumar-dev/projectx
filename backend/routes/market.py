"""
TradeVision AI — Market Data Routes
====================================
REST API endpoints for live forex, gold, crypto & stock market data via yfinance.
"""

import sys
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

# ── Ensure ai_model/ is importable ─────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ai_model"))

from data_collector import (
    get_current_price,
    get_ohlc_history,
    get_technical_indicators,
    SUPPORTED_PAIRS,
    PAIR_DISPLAY_SYMBOLS,
    SUPPORTED_TIMEFRAMES,
    normalize_timeframe,
)

router = APIRouter()


# ── GET /market/price/{pair} ───────────────────────────
@router.get("/price/{pair}")
async def market_price(pair: str):
    """Return the current live price for a supported trading pair."""
    pair = pair.upper()

    if pair not in SUPPORTED_PAIRS:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{pair}' is not supported. Supported: {list(SUPPORTED_PAIRS.keys())}",
        )

    price = get_current_price(pair)

    if price is None:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve price for {pair} from yfinance",
        )

    return {
        "pair": pair,
        "symbol": PAIR_DISPLAY_SYMBOLS.get(pair, SUPPORTED_PAIRS[pair]),
        "price": price,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── GET /market/ohlc/{pair} ───────────────────────────
@router.get("/ohlc/{pair}")
async def market_ohlc(
    pair: str,
    interval: str = Query("1h", description="Candle interval (e.g. 1m, 5m, 15m, 1h, 4h, 1d)"),
    limit: int = Query(50, ge=1, le=5000, description="Number of candles to return"),
):
    """Return OHLCV candle data for a supported trading pair."""
    pair = pair.upper()

    if pair not in SUPPORTED_PAIRS:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{pair}' is not supported. Supported: {list(SUPPORTED_PAIRS.keys())}",
        )

    norm_interval = normalize_timeframe(interval)
    if not norm_interval:
        raise HTTPException(
            status_code=400,
            detail=f"Timeframe '{interval}' is not supported. Supported intervals: {sorted(list(SUPPORTED_TIMEFRAMES))}",
        )

    df = get_ohlc_history(pair, interval=norm_interval, outputsize=limit)

    if df is None or df.empty:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve OHLC data for {pair} from yfinance",
        )

    # Convert datetime column to string for JSON serialisation
    df["datetime"] = df["datetime"].astype(str)
    records = df.tail(limit).to_dict(orient="records")

    return {
        "pair": pair,
        "symbol": PAIR_DISPLAY_SYMBOLS.get(pair, SUPPORTED_PAIRS[pair]),
        "interval": norm_interval,
        "count": len(records),
        "candles": records,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── GET /market/indicators/{pair} ─────────────────────
@router.get("/indicators/{pair}")
async def market_indicators(
    pair: str,
    interval: str = Query("1h", description="Candle interval"),
):
    """Return RSI, MACD, and EMA-20 technical indicators for a pair."""
    pair = pair.upper()

    if pair not in SUPPORTED_PAIRS:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{pair}' is not supported. Supported: {list(SUPPORTED_PAIRS.keys())}",
        )

    norm_interval = normalize_timeframe(interval)
    if not norm_interval:
        raise HTTPException(
            status_code=400,
            detail=f"Timeframe '{interval}' is not supported. Supported intervals: {sorted(list(SUPPORTED_TIMEFRAMES))}",
        )

    indicators = get_technical_indicators(pair, interval=norm_interval)

    if all(v is None for v in indicators.values()):
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve technical indicators for {pair} from yfinance",
        )

    return {
        "pair": pair,
        "symbol": PAIR_DISPLAY_SYMBOLS.get(pair, SUPPORTED_PAIRS[pair]),
        "interval": norm_interval,
        "indicators": indicators,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── GET /market/pairs ─────────────────────────────────
@router.get("/pairs")
async def market_pairs():
    """Return the list of all supported trading pairs."""
    pairs = [
        {
            "key": key,
            "symbol": PAIR_DISPLAY_SYMBOLS.get(key, ticker),
            "ticker": ticker,
        }
        for key, ticker in SUPPORTED_PAIRS.items()
    ]
    return {
        "count": len(pairs),
        "pairs": pairs,
    }
