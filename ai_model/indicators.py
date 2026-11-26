"""
TradeVision AI — Shared Technical Indicators & ML Feature Engine
================================================================
Computes technical indicators and engineered ML features consistently
for LightGBM training, live signal prediction, and historical backtesting.
"""

from typing import Dict, Any
import numpy as np
import pandas as pd

# Exact ordered list of feature columns expected by LightGBM model
FEATURE_COLUMNS = [
    "rsi",
    "rsi_slope",
    "macd",
    "macd_signal",
    "macd_hist",
    "macd_hist_slope",
    "ema20_dist_pct",
    "ema50_dist_pct",
    "atr_pct",
    "ret_1",
    "ret_3",
    "ret_6",
    "body_ratio",
    "upper_wick_ratio",
    "lower_wick_ratio",
    "hour_sin",
    "hour_cos",
]


def compute_indicators_df(df: pd.DataFrame) -> pd.DataFrame:
    """Compute technical indicators and engineered ML features on an OHLCV DataFrame.

    Expects ascending chronological order with columns:
      [datetime, open, high, low, close] (and optional volume).
    Returns a copy of the DataFrame enriched with indicator and feature columns.
    """
    if df is None or df.empty:
        return pd.DataFrame()

    out = df.copy()

    open_s = out["open"].astype(float)
    high_s = out["high"].astype(float)
    low_s = out["low"].astype(float)
    close_s = out["close"].astype(float)

    # ── Exponential Moving Averages ───────────────────────
    out["ema_20"] = close_s.ewm(span=20, adjust=False).mean()
    out["ema_50"] = close_s.ewm(span=50, adjust=False).mean()

    # ── MACD (12, 26, 9) ──────────────────────────────────
    ema_12 = close_s.ewm(span=12, adjust=False).mean()
    ema_26 = close_s.ewm(span=26, adjust=False).mean()
    out["macd"] = ema_12 - ema_26
    out["macd_signal"] = out["macd"].ewm(span=9, adjust=False).mean()
    out["macd_hist"] = out["macd"] - out["macd_signal"]

    # ── RSI (14) using Wilder's smoothing ─────────────────
    delta = close_s.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)
    avg_gain = gain.ewm(alpha=1.0 / 14.0, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / 14.0, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0.0, 1e-9)
    out["rsi"] = (100.0 - (100.0 / (1.0 + rs))).fillna(50.0)

    # ── ATR (14) ──────────────────────────────────────────
    prev_close = close_s.shift(1)
    tr = pd.concat(
        [
            high_s - low_s,
            (high_s - prev_close).abs(),
            (low_s - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    out["atr"] = tr.rolling(window=14, min_periods=1).mean().fillna(0.0)

    # ── Engineered ML Features ────────────────────────────
    out["ema20_dist_pct"] = (close_s - out["ema_20"]) / out["ema_20"].replace(0.0, 1e-9)
    out["ema50_dist_pct"] = (close_s - out["ema_50"]) / out["ema_50"].replace(0.0, 1e-9)
    out["atr_pct"] = out["atr"] / close_s.replace(0.0, 1e-9)

    out["macd_hist_slope"] = out["macd_hist"].diff().fillna(0.0)
    out["rsi_slope"] = out["rsi"].diff().fillna(0.0)

    out["ret_1"] = close_s.pct_change(1).fillna(0.0)
    out["ret_3"] = close_s.pct_change(3).fillna(0.0)
    out["ret_6"] = close_s.pct_change(6).fillna(0.0)

    candle_range = (high_s - low_s).replace(0.0, 1e-9)
    body_top = out[["open", "close"]].astype(float).max(axis=1)
    body_bottom = out[["open", "close"]].astype(float).min(axis=1)

    out["body_ratio"] = (close_s - open_s).abs() / candle_range
    out["upper_wick_ratio"] = (high_s - body_top) / candle_range
    out["lower_wick_ratio"] = (body_bottom - low_s) / candle_range

    dt_utc = pd.to_datetime(out["datetime"], utc=True, errors="coerce")
    hours = dt_utc.dt.hour.fillna(0.0).astype(float)
    out["hour_sin"] = np.sin(2.0 * np.pi * hours / 24.0)
    out["hour_cos"] = np.cos(2.0 * np.pi * hours / 24.0)

    # Guard against any infinities or NaNs in ML feature columns
    for col in FEATURE_COLUMNS:
        out[col] = (
            pd.to_numeric(out[col], errors="coerce")
            .replace([np.inf, -np.inf], 0.0)
            .fillna(0.0)
        )

    return out


def get_latest_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """Return latest rsi, macd, macd_signal, ema_20, and atr as floats."""
    if df is None or df.empty:
        return {
            "rsi": None,
            "macd": None,
            "macd_signal": None,
            "ema_20": None,
            "atr": None,
        }

    required = {"rsi", "macd", "macd_signal", "ema_20", "atr"}
    enriched = df if required.issubset(df.columns) else compute_indicators_df(df)
    if enriched.empty:
        return {
            "rsi": None,
            "macd": None,
            "macd_signal": None,
            "ema_20": None,
            "atr": None,
        }

    last = enriched.iloc[-1]
    return {
        "rsi": float(last["rsi"]),
        "macd": float(last["macd"]),
        "macd_signal": float(last["macd_signal"]),
        "ema_20": float(last["ema_20"]),
        "atr": float(last["atr"]),
    }
