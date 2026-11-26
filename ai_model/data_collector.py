"""
TradeVision AI — yfinance Market Data Collector
================================================
Zero-cost market data collector powered by Yahoo Finance (`yfinance`).
Supports Forex, Gold, Crypto, and major US Stocks with automatic lookback
clamping, 4h resampling from 1h bars, UTC timestamp normalization, and an
in-memory TTL cache.
"""

import os
import math
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Tuple, Optional

import pandas as pd
import yfinance as yf

from indicators import compute_indicators_df, get_latest_indicators

# ── Logging ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("data_collector")

# ── Supported trading pairs → Yahoo Finance tickers ─────
SUPPORTED_PAIRS: Dict[str, str] = {
    "EURUSD": "EURUSD=X",
    "XAUUSD": "GC=F",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "USDJPY=X",
    "AUDUSD": "AUDUSD=X",
    "BTCUSDT": "BTC-USD",
    "AAPL": "AAPL",
    "NVDA": "NVDA",
    "TSLA": "TSLA",
    "MSFT": "MSFT",
    "AMZN": "AMZN",
    "GOOGL": "GOOGL",
}

# Clean UI display symbols
PAIR_DISPLAY_SYMBOLS: Dict[str, str] = {
    "EURUSD": "EUR/USD",
    "XAUUSD": "XAU/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "AUDUSD": "AUD/USD",
    "BTCUSDT": "BTC/USDT",
    "AAPL": "AAPL",
    "NVDA": "NVDA",
    "TSLA": "TSLA",
    "MSFT": "MSFT",
    "AMZN": "AMZN",
    "GOOGL": "GOOGL",
}

# ── Supported timeframes ────────────────────────────────
SUPPORTED_TIMEFRAMES = {
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "4h",
    "1d",
    "1wk",
    "1mo",
}

# Map UI / legacy Twelve Data timeframe strings to canonical normalized intervals
TIMEFRAME_MAP: Dict[str, str] = {
    "1m": "1m",
    "1min": "1m",
    "5m": "5m",
    "5min": "5m",
    "15m": "15m",
    "15min": "15m",
    "30m": "30m",
    "30min": "30m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1day": "1d",
    "1w": "1wk",
    "1wk": "1wk",
    "1week": "1wk",
    "1M": "1mo",
    "1mo": "1mo",
    "1month": "1mo",
}

# Canonical interval -> yfinance download interval (4h is resampled from 1h)
YF_INTERVAL_MAP: Dict[str, str] = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "4h": "1h",
    "1d": "1d",
    "1wk": "1wk",
    "1mo": "1mo",
}

# ── In-memory TTL Caches ────────────────────────────────
PRICE_CACHE_TTL_SECONDS = 30.0
OHLC_CACHE_TTL_SECONDS = 60.0

_PRICE_CACHE: Dict[str, Tuple[float, float]] = {}
_OHLC_CACHE: Dict[Tuple[str, str, str], Tuple[float, pd.DataFrame]] = {}


def normalize_timeframe(interval: str | None) -> str | None:
    """Normalize and validate a timeframe interval.

    Handles both UI shorthands (e.g. '15m', '1d', '1M') and legacy strings
    (e.g. '15min', '1day', '1month'). Note '1M' (month) vs '1m' (minute).
    """
    if not interval:
        return "1h"

    clean = interval.strip()
    if clean in TIMEFRAME_MAP:
        return TIMEFRAME_MAP[clean]

    lower = clean.lower()
    if lower in TIMEFRAME_MAP:
        return TIMEFRAME_MAP[lower]

    if lower in SUPPORTED_TIMEFRAMES:
        return lower

    return None


def _select_valid_period(norm_interval: str, outputsize: int, period: Optional[str] = None) -> str:
    """Compute a Yahoo Finance-compliant `period` clamped to interval limits.

    Yahoo Finance limits:
      - 1m: max 7d
      - 5m, 15m, 30m: max 60d
      - 1h (and 4h resampled from 1h): max 730d
      - 1d, 1wk, 1mo: up to max
    """
    if period:
        # Clamp explicit period strings if they exceed Yahoo limits
        if norm_interval == "1m" and period not in ("1d", "2d", "3d", "4d", "5d", "6d", "7d"):
            return "7d"
        if norm_interval in ("5m", "15m", "30m"):
            if period.endswith("d"):
                try:
                    d_val = int(period[:-1])
                    return f"{min(60, max(1, d_val))}d"
                except ValueError:
                    return "60d"
            if period in ("730d", "1y", "2y", "5y", "10y", "max"):
                return "60d"
        if norm_interval in ("1h", "4h"):
            if period.endswith("d"):
                try:
                    d_val = int(period[:-1])
                    return f"{min(730, max(1, d_val))}d"
                except ValueError:
                    return "730d"
            if period in ("5y", "10y", "max"):
                return "730d"
        return period

    n = max(1, int(outputsize or 500))

    if norm_interval == "1m":
        days = min(7, max(2, math.ceil(n / 390) + 2))
        return f"{days}d"
    if norm_interval == "5m":
        days = min(60, max(5, math.ceil(n / 78) + 4))
        return f"{days}d"
    if norm_interval == "15m":
        days = min(60, max(7, math.ceil(n / 26) + 5))
        return f"{days}d"
    if norm_interval == "30m":
        days = min(60, max(10, math.ceil(n / 13) + 6))
        return f"{days}d"
    if norm_interval in ("1h", "4h"):
        eff_bars = n * 4 if norm_interval == "4h" else n
        days = min(730, max(30, math.ceil(eff_bars / 16) + 10))
        return f"{days}d"
    if norm_interval == "1d":
        if n <= 250:
            return "2y"
        if n <= 1250:
            return "5y"
        return "max"

    return "max"


def _standardize_yf_dataframe(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Flatten MultiIndex columns, standardize names, normalize UTC datetime, and sort ascending."""
    if raw_df is None or raw_df.empty:
        return pd.DataFrame()

    df = raw_df.copy()

    # Flatten MultiIndex columns if present (common in newer yfinance versions)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [
            col[0] if isinstance(col, tuple) else col for col in df.columns
        ]

    df = df.reset_index()

    # Standardize all column names to lowercase
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Normalize timestamp column name ('date', 'datetime', or 'index')
    if "datetime" not in df.columns:
        if "date" in df.columns:
            df = df.rename(columns={"date": "datetime"})
        elif "index" in df.columns:
            df = df.rename(columns={"index": "datetime"})
        else:
            # Fallback to first column
            df = df.rename(columns={df.columns[0]: "datetime"})

    if "volume" not in df.columns:
        df["volume"] = 0.0

    required_cols = ["datetime", "open", "high", "low", "close", "volume"]
    for col in ["open", "high", "low", "close"]:
        if col not in df.columns:
            return pd.DataFrame()

    df = df[required_cols].copy()

    for col in ["open", "high", "low", "close"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["volume"] = pd.to_numeric(df["volume"], errors="coerce").fillna(0.0)
    df["datetime"] = pd.to_datetime(df["datetime"], utc=True, errors="coerce")

    df = df.dropna(subset=["datetime", "open", "high", "low", "close"])
    df = df.sort_values("datetime", ascending=True).drop_duplicates(subset=["datetime"]).reset_index(drop=True)
    return df


def _resample_4h(df_1h: pd.DataFrame) -> pd.DataFrame:
    """Resample ascending UTC 1h OHLCV candles cleanly into 4h candles."""
    if df_1h is None or df_1h.empty:
        return pd.DataFrame()

    temp = df_1h.copy().set_index("datetime")
    agg = (
        temp.resample("4h")
        .agg(
            {
                "open": "first",
                "high": "max",
                "low": "min",
                "close": "last",
                "volume": "sum",
            }
        )
        .dropna(subset=["open", "high", "low", "close"])
        .reset_index()
    )
    return agg


# ─────────────────────────────────────────────────────────
# Function 1 — Get current price (30s TTL cache)
# ─────────────────────────────────────────────────────────
def get_current_price(pair: str) -> float | None:
    """Fetch the latest price for a supported pair via yfinance (cached 30s)."""
    pair_u = pair.upper()
    ticker_sym = SUPPORTED_PAIRS.get(pair_u)
    if not ticker_sym:
        logger.error(f"Unsupported pair: {pair}")
        return None

    now_mono = time.monotonic()
    cached = _PRICE_CACHE.get(pair_u)
    if cached and (now_mono - cached[0]) < PRICE_CACHE_TTL_SECONDS:
        return cached[1]

    try:
        ticker = yf.Ticker(ticker_sym)
        price: Optional[float] = None

        # Primary: fast_info lastPrice
        try:
            fast_info = ticker.fast_info
            lp = fast_info.get("lastPrice") if hasattr(fast_info, "get") else getattr(fast_info, "last_price", None)
            if lp is not None and not pd.isna(lp) and float(lp) > 0:
                price = float(lp)
        except Exception:
            price = None

        # Fallback: latest 1m / 1h bar close
        if price is None:
            hist = ticker.history(period="5d", interval="1h", auto_adjust=False)
            std = _standardize_yf_dataframe(hist)
            if not std.empty:
                price = float(std["close"].iloc[-1])

        if price is None or math.isnan(price):
            logger.error(f"No live price available via yfinance for {pair_u} ({ticker_sym})")
            return None

        _PRICE_CACHE[pair_u] = (now_mono, price)
        logger.info(f"Current price for {pair_u} ({ticker_sym}): {price}")
        return price

    except Exception as exc:
        logger.error(f"Failed to fetch yfinance price for {pair_u}: {exc}")
        return None


# ─────────────────────────────────────────────────────────
# Function 2 — Get OHLC history (60s TTL cache)
# ─────────────────────────────────────────────────────────
def get_ohlc_history(
    pair: str,
    interval: str = "1h",
    outputsize: int = 500,
    period: Optional[str] = None,
) -> pd.DataFrame | None:
    """Fetch historical OHLCV candle data via yfinance.

    Returns pandas DataFrame with columns [datetime, open, high, low, close, volume],
    sorted ascending by UTC datetime (ohlc[0] oldest, ohlc[-1] newest).
    """
    pair_u = pair.upper()
    ticker_sym = SUPPORTED_PAIRS.get(pair_u)
    if not ticker_sym:
        logger.error(f"Unsupported pair: {pair}")
        return None

    norm_interval = normalize_timeframe(interval)
    if not norm_interval:
        logger.error(f"Unsupported interval '{interval}' for {pair}")
        return None

    yf_interval = YF_INTERVAL_MAP[norm_interval]
    effective_period = _select_valid_period(norm_interval, outputsize, period=period)

    cache_key = (pair_u, norm_interval, effective_period)
    now_mono = time.monotonic()
    cached = _OHLC_CACHE.get(cache_key)
    if cached and (now_mono - cached[0]) < OHLC_CACHE_TTL_SECONDS:
        df_cached = cached[1]
        if outputsize and len(df_cached) > outputsize:
            return df_cached.tail(outputsize).reset_index(drop=True).copy()
        return df_cached.copy()

    try:
        ticker = yf.Ticker(ticker_sym)
        raw_df = ticker.history(
            period=effective_period,
            interval=yf_interval,
            auto_adjust=False,
            prepost=False,
        )

        df = _standardize_yf_dataframe(raw_df)
        if df.empty:
            # Secondary fallback via yf.download
            raw_dl = yf.download(
                ticker_sym,
                period=effective_period,
                interval=yf_interval,
                auto_adjust=False,
                progress=False,
                threads=False,
            )
            df = _standardize_yf_dataframe(raw_dl)

        if df.empty:
            logger.error(f"Empty OHLC history from yfinance for {pair_u} ({ticker_sym}, {norm_interval}, {effective_period})")
            return None

        if norm_interval == "4h":
            df = _resample_4h(df)
            if df.empty:
                return None

        _OHLC_CACHE[cache_key] = (now_mono, df.copy())
        logger.info(
            f"Fetched {len(df)} OHLC rows via yfinance for {pair_u} ({ticker_sym}), interval={norm_interval}, period={effective_period}"
        )

        if outputsize and len(df) > outputsize:
            return df.tail(outputsize).reset_index(drop=True)
        return df

    except Exception as exc:
        logger.error(f"Failed to fetch yfinance OHLC for {pair_u}: {exc}")
        return None


# ─────────────────────────────────────────────────────────
# Function 3 — Get technical indicators (RSI, MACD, EMA)
# ─────────────────────────────────────────────────────────
def get_technical_indicators(
    pair: str,
    interval: str = "1h",
) -> dict:
    """Compute RSI, MACD, MACD signal, and EMA-20 from yfinance OHLC history."""
    df = get_ohlc_history(pair, interval=interval, outputsize=200)
    if df is None or df.empty:
        return {"rsi": None, "macd": None, "macd_signal": None, "ema_20": None}

    enriched = compute_indicators_df(df)
    latest = get_latest_indicators(enriched)
    return {
        "rsi": latest["rsi"],
        "macd": latest["macd"],
        "macd_signal": latest["macd_signal"],
        "ema_20": latest["ema_20"],
    }


# ─────────────────────────────────────────────────────────
# Function 4 — Standard True Range (ATR) calculation
# ─────────────────────────────────────────────────────────
def calculate_atr(ohlc: list[dict], period: int = 14) -> float:
    """Calculate standard Average True Range (ATR) from OHLC candles."""
    if not ohlc or len(ohlc) < 2:
        if ohlc and len(ohlc) == 1:
            return float(ohlc[0]["high"] - ohlc[0]["low"])
        return 0.0

    tr_values = []
    for i in range(1, len(ohlc)):
        current = ohlc[i]
        prev = ohlc[i - 1]
        h = float(current["high"])
        l = float(current["low"])
        prev_c = float(prev["close"])

        tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
        tr_values.append(tr)

    if not tr_values:
        return 0.0

    window = tr_values[-period:] if len(tr_values) >= period else tr_values
    return sum(window) / len(window)


# ─────────────────────────────────────────────────────────
# Function 5 — Get full analysis data (combined)
# ─────────────────────────────────────────────────────────
def get_full_analysis_data(
    pair: str,
    interval: str = "1h",
) -> dict | None:
    """Combine live price, OHLC history, indicators, and ML features in a single pass."""
    pair_upper = pair.upper()
    if pair_upper not in SUPPORTED_PAIRS:
        logger.error(f"Unsupported pair: {pair}")
        return None

    norm_interval = normalize_timeframe(interval)
    if not norm_interval:
        logger.error(f"Invalid timeframe: {interval}")
        return None

    try:
        ohlc_df = get_ohlc_history(pair_upper, interval=norm_interval, outputsize=250)
        if ohlc_df is None or ohlc_df.empty:
            logger.error(f"OHLC history unavailable via yfinance for {pair_upper}")
            return None

        price = get_current_price(pair_upper)
        if price is None:
            price = float(ohlc_df["close"].iloc[-1])

        enriched_df = compute_indicators_df(ohlc_df)
        latest_ind = get_latest_indicators(enriched_df)

        if (
            latest_ind.get("rsi") is None
            or latest_ind.get("macd") is None
            or latest_ind.get("macd_signal") is None
            or latest_ind.get("ema_20") is None
        ):
            logger.error(f"Indicators unavailable for {pair_upper}: {latest_ind}")
            return None

        # Last 50 rows as list of dicts (chronological ascending: [0]=oldest, [-1]=newest)
        ohlc_tail = ohlc_df.tail(50).copy()
        ohlc_tail["datetime"] = ohlc_tail["datetime"].astype(str)
        ohlc_records = ohlc_tail.to_dict(orient="records")

        atr_val = latest_ind.get("atr")
        if not atr_val or atr_val <= 0:
            atr_val = calculate_atr(ohlc_records, period=14)

        display_symbol = PAIR_DISPLAY_SYMBOLS.get(pair_upper, SUPPORTED_PAIRS[pair_upper])

        return {
            "pair": pair_upper,
            "symbol": display_symbol,
            "current_price": round(float(price), 6),
            "ohlc": ohlc_records,
            "enriched_df": enriched_df,
            "indicators": {
                "rsi": latest_ind["rsi"],
                "macd": latest_ind["macd"],
                "macd_signal": latest_ind["macd_signal"],
                "ema_20": latest_ind["ema_20"],
            },
            "atr": float(atr_val),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as exc:
        logger.error(f"Unexpected error in get_full_analysis_data for {pair_upper}: {exc}")
        return None


# ─────────────────────────────────────────────────────────
# Function 6 — Save OHLC data to CSV
# ─────────────────────────────────────────────────────────
def save_data_to_csv(
    pair: str,
    interval: str = "1h",
) -> str | None:
    """Download OHLC data via yfinance and persist it as a CSV file."""
    df = get_ohlc_history(pair, interval=interval)
    if df is None or df.empty:
        logger.error(f"No data to save for {pair}")
        return None

    try:
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        os.makedirs(data_dir, exist_ok=True)

        norm_interval = normalize_timeframe(interval) or interval
        filename = f"{pair.upper()}_{norm_interval}.csv"
        filepath = os.path.join(data_dir, filename)

        df.to_csv(filepath, index=False)
        logger.info(f"Data saved to {filepath}")
        return filepath

    except Exception as exc:
        logger.error(f"Failed to save CSV for {pair}: {exc}")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("TradeVision AI — yfinance Collector Test")
    print("=" * 60)
    for test_pair in ["EURUSD", "BTCUSDT", "AAPL"]:
        p = get_current_price(test_pair)
        df = get_ohlc_history(test_pair, interval="1h", outputsize=50)
        print(f"{test_pair}: price={p}, rows={len(df) if df is not None else 0}")
