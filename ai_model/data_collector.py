"""
TradeVision AI — Twelve Data API Integration
=============================================
Authoritative market data collector powered by Twelve Data API.
Provides live prices, historical OHLCV data, technical indicators,
and standard True Range (ATR) volatility calculations for forex and crypto.
"""

import os
import json
import logging
from datetime import datetime, timezone

import requests
import pandas as pd
from dotenv import load_dotenv

# ── Load environment variables ──────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

API_KEY = os.getenv("TWELVE_DATA_API_KEY")
BASE_URL = "https://api.twelvedata.com"

# ── Logging ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("data_collector")

# ── Supported trading pairs ─────────────────────────────
SUPPORTED_PAIRS = {
    "EURUSD": "EUR/USD",
    "XAUUSD": "XAU/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "AUDUSD": "AUD/USD",
    "BTCUSDT": "BTC/USDT",
}

# ── Supported candle intervals ──────────────────────────
SUPPORTED_TIMEFRAMES = {
    "1min",
    "5min",
    "15min",
    "30min",
    "45min",
    "1h",
    "2h",
    "4h",
    "1day",
    "1week",
    "1month",
}

# Common shorthand mappings from UI to Twelve Data intervals
TIMEFRAME_MAP = {
    "1m": "1min",
    "1min": "1min",
    "5m": "5min",
    "5min": "5min",
    "15m": "15min",
    "15min": "15min",
    "30m": "30min",
    "30min": "30min",
    "45m": "45min",
    "45min": "45min",
    "1h": "1h",
    "2h": "2h",
    "4h": "4h",
    "1d": "1day",
    "1day": "1day",
    "1w": "1week",
    "1week": "1week",
    "1M": "1month",
    "1month": "1month",
}


def normalize_timeframe(interval: str | None) -> str | None:
    """Normalize and validate a timeframe interval.

    Args:
        interval: User or query string interval (e.g. "1h", "15m", "1day").

    Returns:
        Canonical Twelve Data interval string, or None if invalid.
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


def check_api_response(data: dict, endpoint_name: str) -> tuple[bool, str]:
    """Inspect Twelve Data JSON response for error codes or status fields.

    Twelve Data can return HTTP 200 with an error body such as:
      {"code": 429, "message": "...", "status": "error"}
    Never logs or exposes the API key.

    Returns:
        (is_error, error_message)
    """
    if not isinstance(data, dict):
        return True, f"Non-dict response from {endpoint_name}"

    if data.get("status") == "error":
        msg = str(data.get("message", "Unknown error from Twelve Data"))
        code = data.get("code", "")
        if API_KEY and API_KEY in msg:
            msg = msg.replace(API_KEY, "***")
        return True, f"Twelve Data API error ({code}): {msg}"

    if "code" in data and isinstance(data["code"], int) and data["code"] >= 400:
        msg = str(data.get("message", "API error"))
        if API_KEY and API_KEY in msg:
            msg = msg.replace(API_KEY, "***")
        return True, f"Twelve Data API error ({data['code']}): {msg}"

    return False, ""


# ─────────────────────────────────────────────────────────
# Function 1 — Get current price
# ─────────────────────────────────────────────────────────
def get_current_price(pair: str) -> float | None:
    """Fetch the latest real-time price for a given pair.

    Args:
        pair: Key from SUPPORTED_PAIRS (e.g. "EURUSD").

    Returns:
        Price as float, or None on failure.
    """
    symbol = SUPPORTED_PAIRS.get(pair.upper())
    if not symbol:
        logger.error(f"Unsupported pair: {pair}")
        return None

    try:
        resp = requests.get(
            f"{BASE_URL}/price",
            params={"symbol": symbol, "apikey": API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        is_error, error_msg = check_api_response(data, f"/price for {pair}")
        if is_error:
            logger.error(f"API error fetching price for {pair}: {error_msg}")
            return None

        if "price" not in data:
            logger.error(f"No price field in response for {pair}")
            return None

        price = float(data["price"])
        logger.info(f"Current price for {pair} ({symbol}): {price}")
        return price

    except Exception as exc:
        logger.error(f"Failed to fetch price for {pair}: {exc}")
        return None


# ─────────────────────────────────────────────────────────
# Function 2 — Get OHLC history
# ─────────────────────────────────────────────────────────
def get_ohlc_history(
    pair: str,
    interval: str = "1h",
    outputsize: int = 500,
) -> pd.DataFrame | None:
    """Fetch historical OHLCV candle data.

    Args:
        pair: Key from SUPPORTED_PAIRS.
        interval: Candle interval (e.g. "1min", "5min", "15min", "1h", "4h", "1day").
        outputsize: Number of data points to return (max 5000).

    Returns:
        pandas DataFrame with columns [datetime, open, high, low, close, volume],
        sorted ascending by datetime (ohlc[0] oldest, ohlc[-1] newest).
        Returns None on failure.
    """
    symbol = SUPPORTED_PAIRS.get(pair.upper())
    if not symbol:
        logger.error(f"Unsupported pair: {pair}")
        return None

    norm_interval = normalize_timeframe(interval)
    if not norm_interval:
        logger.error(f"Unsupported interval '{interval}' for {pair}")
        return None

    try:
        resp = requests.get(
            f"{BASE_URL}/time_series",
            params={
                "symbol": symbol,
                "interval": norm_interval,
                "outputsize": outputsize,
                "apikey": API_KEY,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        is_error, error_msg = check_api_response(data, f"/time_series for {pair}")
        if is_error:
            logger.error(f"API error fetching time_series for {pair}: {error_msg}")
            return None

        if "values" not in data:
            logger.error(f"No 'values' in time_series response for {pair}")
            return None

        df = pd.DataFrame(data["values"])

        # Rename / sanitize columns
        price_cols = ["open", "high", "low", "close"]
        for col in price_cols:
            if col in df.columns:
                df[col] = df[col].astype(float)

        if "volume" in df.columns:
            df["volume"] = pd.to_numeric(df["volume"], errors="coerce").fillna(0)

        # Ensure datetime column is proper
        df["datetime"] = pd.to_datetime(df["datetime"])

        # Crucial: Sort ascending by datetime so ohlc[0]=oldest, ohlc[-1]=newest
        df = df.sort_values("datetime", ascending=True).reset_index(drop=True)

        logger.info(
            f"Fetched {len(df)} OHLC rows for {pair} ({symbol}), interval={norm_interval}"
        )
        return df

    except Exception as exc:
        logger.error(f"Failed to fetch OHLC for {pair}: {exc}")
        return None


# ─────────────────────────────────────────────────────────
# Function 3 — Get technical indicators (RSI, MACD, EMA)
# ─────────────────────────────────────────────────────────
def get_technical_indicators(
    pair: str,
    interval: str = "1h",
) -> dict:
    """Fetch RSI, MACD, and EMA-20 for a pair.

    Args:
        pair: Key from SUPPORTED_PAIRS.
        interval: Candle interval.

    Returns:
        Dict with keys: rsi, macd, macd_signal, ema_20.
        Values are None if the corresponding call failed or returned error.
    """
    symbol = SUPPORTED_PAIRS.get(pair.upper())
    if not symbol:
        logger.error(f"Unsupported pair: {pair}")
        return {"rsi": None, "macd": None, "macd_signal": None, "ema_20": None}

    norm_interval = normalize_timeframe(interval) or "1h"
    result = {"rsi": None, "macd": None, "macd_signal": None, "ema_20": None}

    # ── RSI ──────────────────────────────────────────────
    try:
        resp = requests.get(
            f"{BASE_URL}/rsi",
            params={"symbol": symbol, "interval": norm_interval, "apikey": API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        is_error, error_msg = check_api_response(data, f"/rsi for {pair}")
        if is_error:
            logger.error(f"RSI API error for {pair}: {error_msg}")
        elif "values" in data and len(data["values"]) > 0:
            result["rsi"] = float(data["values"][0]["rsi"])
            logger.info(f"RSI for {pair}: {result['rsi']}")
    except Exception as exc:
        logger.error(f"RSI fetch failed for {pair}: {exc}")

    # ── MACD ─────────────────────────────────────────────
    try:
        resp = requests.get(
            f"{BASE_URL}/macd",
            params={"symbol": symbol, "interval": norm_interval, "apikey": API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        is_error, error_msg = check_api_response(data, f"/macd for {pair}")
        if is_error:
            logger.error(f"MACD API error for {pair}: {error_msg}")
        elif "values" in data and len(data["values"]) > 0:
            latest = data["values"][0]
            result["macd"] = float(latest.get("macd", 0))
            result["macd_signal"] = float(latest.get("macd_signal", 0))
            logger.info(
                f"MACD for {pair}: macd={result['macd']}, signal={result['macd_signal']}"
            )
    except Exception as exc:
        logger.error(f"MACD fetch failed for {pair}: {exc}")

    # ── EMA-20 ───────────────────────────────────────────
    try:
        resp = requests.get(
            f"{BASE_URL}/ema",
            params={
                "symbol": symbol,
                "interval": norm_interval,
                "time_period": 20,
                "apikey": API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        is_error, error_msg = check_api_response(data, f"/ema for {pair}")
        if is_error:
            logger.error(f"EMA API error for {pair}: {error_msg}")
        elif "values" in data and len(data["values"]) > 0:
            result["ema_20"] = float(data["values"][0]["ema"])
            logger.info(f"EMA-20 for {pair}: {result['ema_20']}")
    except Exception as exc:
        logger.error(f"EMA fetch failed for {pair}: {exc}")

    return result


# ─────────────────────────────────────────────────────────
# Function 4 — Standard True Range (ATR) calculation
# ─────────────────────────────────────────────────────────
def calculate_atr(ohlc: list[dict], period: int = 14) -> float:
    """Calculate standard Average True Range (ATR) from OHLC candles.
    True Range = max(High - Low, |High - Close_prev|, |Low - Close_prev|).

    Args:
        ohlc: Chronologically ordered list of candle dicts (oldest to newest).
        period: Number of periods for ATR (default 14).

    Returns:
        ATR as float. Returns 0.0 if insufficient candles.
    """
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
    """Combine current price, OHLC history, and technical indicators
    into a single analysis payload.

    Args:
        pair: Key from SUPPORTED_PAIRS.
        interval: Candle interval.

    Returns:
        Dict with keys: pair, symbol, current_price, ohlc, indicators, atr, timestamp.
        Returns None if any required market data component is missing (price, OHLC,
        or indicators), preventing silent false analysis.
    """
    pair_upper = pair.upper()
    symbol = SUPPORTED_PAIRS.get(pair_upper)
    if not symbol:
        logger.error(f"Unsupported pair: {pair}")
        return None

    norm_interval = normalize_timeframe(interval)
    if not norm_interval:
        logger.error(f"Invalid timeframe: {interval}")
        return None

    try:
        price = get_current_price(pair_upper)
        ohlc_df = get_ohlc_history(pair_upper, interval=norm_interval)
        indicators = get_technical_indicators(pair_upper, interval=norm_interval)

        # Strict requirement: if price or OHLC failed, market data is unavailable
        if price is None:
            logger.error(f"Current price unavailable from Twelve Data for {pair_upper}")
            return None

        if ohlc_df is None or ohlc_df.empty:
            logger.error(f"OHLC history unavailable from Twelve Data for {pair_upper}")
            return None

        # Check required indicators
        if (
            indicators.get("rsi") is None
            or indicators.get("macd") is None
            or indicators.get("macd_signal") is None
            or indicators.get("ema_20") is None
        ):
            logger.error(
                f"One or more indicators unavailable from Twelve Data for {pair_upper}: {indicators}"
            )
            return None

        # Last 50 rows as list of dicts (chronological ascending: [0]=oldest, [-1]=newest)
        ohlc_tail = ohlc_df.tail(50).copy()
        ohlc_tail["datetime"] = ohlc_tail["datetime"].astype(str)
        ohlc_records = ohlc_tail.to_dict(orient="records")

        # Calculate standard 14-period True Range ATR
        atr_val = calculate_atr(ohlc_records, period=14)

        analysis = {
            "pair": pair_upper,
            "symbol": symbol,
            "current_price": price,
            "ohlc": ohlc_records,
            "indicators": indicators,
            "atr": atr_val,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"Full analysis assembled for {pair_upper} with Twelve Data data")
        return analysis

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
    """Download OHLC data and persist it as a CSV file.

    Args:
        pair: Key from SUPPORTED_PAIRS.
        interval: Candle interval.

    Returns:
        Absolute file path on success, None on failure.
    """
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


# ─────────────────────────────────────────────────────────
# CLI quick-test
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("TradeVision AI — Twelve Data Collector Test")
    print("=" * 60)

    test_pair = "EURUSD"

    print(f"\n1) Current price for {test_pair}:")
    p = get_current_price(test_pair)
    print(f"   → {p}")

    print(f"\n2) OHLC history for {test_pair} (last 5 rows):")
    ohlc = get_ohlc_history(test_pair, outputsize=10)
    if ohlc is not None:
        print(ohlc.tail().to_string(index=False))

    print(f"\n3) Technical indicators for {test_pair}:")
    ind = get_technical_indicators(test_pair)
    print(f"   → {json.dumps(ind, indent=2)}")

    print(f"\n4) Full analysis for {test_pair}:")
    full = get_full_analysis_data(test_pair)
    if full:
        print(f"   Price : {full['current_price']}")
        print(f"   OHLC  : {len(full['ohlc'])} rows")
        print(f"   RSI   : {full['indicators']['rsi']}")
        print(f"   ATR   : {full.get('atr')}")
        print(f"   Time  : {full['timestamp']}")
