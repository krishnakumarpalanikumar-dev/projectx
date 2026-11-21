"""
TradeVision AI — Backtest Routes
=================================
Simulate trading strategies over historical OHLCV data using the same
authoritative signal logic as predict.py.
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np

# ── Ensure ai_model/ and backend/ are importable ───────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ai_model"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from data_collector import (
    get_ohlc_history,
    SUPPORTED_PAIRS,
    SUPPORTED_TIMEFRAMES,
    normalize_timeframe,
)
from signal_logic import evaluate_signal, calculate_trade_levels

router = APIRouter()


class BacktestRequest(BaseModel):
    pair: str
    timeframe: str = "1h"
    lookback_days: int = 365


def get_pip_multiplier(pair: str) -> float:
    """Return multiplier for calculating pips / points."""
    pair_u = pair.upper()
    if "JPY" in pair_u:
        return 100.0
    if pair_u in ("EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF"):
        return 10000.0
    return 1.0


@router.post("/run")
async def run_backtest(req: BacktestRequest):
    """
    Run backtest on historical OHLC data:
    1. Fetch historical candles via Twelve Data (up to 5000 candles).
    2. Compute RSI(14), MACD(12,26,9), EMA(20), and ATR(14) locally using pandas.
    3. Apply shared rule-based signal logic from backend/signal_logic.py.
    4. Simulate 50-candle outcome for each signal (TP before SL = win, SL first = loss).
    5. Return full performance metrics and individual trade logs.
    """
    pair = req.pair.upper()
    raw_timeframe = req.timeframe or "1h"

    if pair not in SUPPORTED_PAIRS:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{pair}' is not supported. Supported: {list(SUPPORTED_PAIRS.keys())}",
        )

    norm_timeframe = normalize_timeframe(raw_timeframe)
    if not norm_timeframe:
        raise HTTPException(
            status_code=400,
            detail=f"Timeframe '{raw_timeframe}' is not supported. Supported intervals: {sorted(list(SUPPORTED_TIMEFRAMES))}",
        )

    # ── Fetch historical data (max outputsize=5000) ───────
    df = get_ohlc_history(pair, interval=norm_timeframe, outputsize=5000)
    if df is None or df.empty or len(df) < 30:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve sufficient OHLC data for backtest of {pair}",
        )

    candles_retrieved = len(df)

    # ── Calculate Technical Indicators locally ─────────────
    # EMA 20
    df["ema_20"] = df["close"].ewm(span=20, adjust=False).mean()

    # MACD (12, 26, 9)
    ema_12 = df["close"].ewm(span=12, adjust=False).mean()
    ema_26 = df["close"].ewm(span=26, adjust=False).mean()
    df["macd"] = ema_12 - ema_26
    df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean()

    # RSI (14) with Wilder's exponential smoothing
    delta = df["close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1.0 / 14.0, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / 14.0, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, 1e-9)
    df["rsi"] = 100.0 - (100.0 / (1.0 + rs))

    # ATR (14)
    prev_close = df["close"].shift(1)
    tr = pd.concat(
        [
            df["high"] - df["low"],
            (df["high"] - prev_close).abs(),
            (df["low"] - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    df["atr"] = tr.rolling(window=14, min_periods=1).mean()

    # ── Filter by lookback_days if requested ──────────
    # Note: Indicators are already computed on full history to avoid warmup distortion
    if req.lookback_days and req.lookback_days > 0:
        cutoff_dt = pd.to_datetime(df["datetime"].iloc[-1]) - timedelta(days=req.lookback_days)
        start_index = df[df["datetime"] >= cutoff_dt].index.min()
        if pd.isna(start_index):
            start_index = 20
        else:
            start_index = max(20, int(start_index))
    else:
        start_index = 20

    trades: List[Dict[str, Any]] = []
    wins = 0
    losses = 0
    skipped = 0

    strong_wins = 0
    strong_losses = 0
    strong_skipped = 0

    med_wins = 0
    med_losses = 0
    med_skipped = 0

    pip_mult = get_pip_multiplier(pair)
    total_candles = len(df)

    # ── Simulate Signals & Outcomes ───────────────────
    for i in range(start_index, total_candles):
        row = df.iloc[i]
        close_price = float(row["close"])
        rsi_val = float(row["rsi"])
        macd_val = float(row["macd"])
        macd_sig_val = float(row["macd_signal"])
        ema_val = float(row["ema_20"])
        atr_val = float(row["atr"])
        dt_str = str(row["datetime"])

        sig_eval = evaluate_signal(
            rsi=rsi_val,
            macd=macd_val,
            macd_signal=macd_sig_val,
            close=close_price,
            ema_20=ema_val,
        )

        signal = sig_eval["signal"]
        if signal == "HOLD":
            continue

        is_strong = "STRONG" in signal
        decimals = 2 if close_price >= 100 else 5
        sl, tp, rr = calculate_trade_levels(
            entry_price=close_price,
            atr_val=atr_val,
            signal=signal,
            decimals=decimals,
        )

        if sl is None or tp is None:
            continue

        outcome = "skipped"
        exit_price = close_price
        exit_time = None
        candles_held = 0

        # Look ahead up to 50 candles
        max_j = min(i + 51, total_candles)
        for j in range(i + 1, max_j):
            candles_held = j - i
            future_row = df.iloc[j]
            c_high = float(future_row["high"])
            c_low = float(future_row["low"])
            c_time = str(future_row["datetime"])

            if "BUY" in signal:
                # If both SL and TP touched in same candle -> conservative loss
                if c_low <= sl and c_high >= tp:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    break
                if c_high >= tp:
                    outcome = "win"
                    exit_price = tp
                    exit_time = c_time
                    break
                if c_low <= sl:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    break

            elif "SELL" in signal:
                if c_high >= sl and c_low <= tp:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    break
                if c_low <= tp:
                    outcome = "win"
                    exit_price = tp
                    exit_time = c_time
                    break
                if c_high >= sl:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    break

        if outcome == "skipped":
            # Exit at final candle close within the 50-candle window
            final_idx = min(i + 50, total_candles - 1)
            exit_price = float(df.iloc[final_idx]["close"])
            exit_time = str(df.iloc[final_idx]["datetime"])
            candles_held = final_idx - i

        # Calculate Pips/Points gained or lost
        if "BUY" in signal:
            raw_diff = exit_price - close_price
        else:
            raw_diff = close_price - exit_price

        pips_points = round(raw_diff * pip_mult, 1)

        # Update metrics
        if outcome == "win":
            wins += 1
            if is_strong:
                strong_wins += 1
            else:
                med_wins += 1
        elif outcome == "loss":
            losses += 1
            if is_strong:
                strong_losses += 1
            else:
                med_losses += 1
        else:
            skipped += 1
            if is_strong:
                strong_skipped += 1
            else:
                med_skipped += 1

        trades.append(
            {
                "entry_time": dt_str,
                "signal": signal,
                "strength": "strong" if is_strong else "medium",
                "entry_price": close_price,
                "exit_price": round(exit_price, decimals),
                "stop_loss": sl,
                "take_profit": tp,
                "outcome": outcome,
                "exit_time": exit_time,
                "candles_held": candles_held,
                "pips_points": pips_points,
            }
        )

    total_signals = len(trades)
    decided_trades = wins + losses
    win_rate_pct = round((wins / decided_trades * 100), 1) if decided_trades > 0 else 0.0

    strong_total = strong_wins + strong_losses + strong_skipped
    strong_decided = strong_wins + strong_losses
    strong_win_rate = (
        round((strong_wins / strong_decided * 100), 1) if strong_decided > 0 else 0.0
    )

    med_total = med_wins + med_losses + med_skipped
    med_decided = med_wins + med_losses
    med_win_rate = round((med_wins / med_decided * 100), 1) if med_decided > 0 else 0.0

    return {
        "success": True,
        "pair": pair,
        "symbol": SUPPORTED_PAIRS[pair],
        "timeframe": norm_timeframe,
        "lookback_days": req.lookback_days,
        "candles_analyzed": total_candles - start_index,
        "candles_retrieved": candles_retrieved,
        "total_signals": total_signals,
        "wins": wins,
        "losses": losses,
        "skipped": skipped,
        "win_rate_pct": win_rate_pct,
        "breakdown": {
            "strong": {
                "total": strong_total,
                "wins": strong_wins,
                "losses": strong_losses,
                "skipped": strong_skipped,
                "win_rate_pct": strong_win_rate,
            },
            "medium": {
                "total": med_total,
                "wins": med_wins,
                "losses": med_losses,
                "skipped": med_skipped,
                "win_rate_pct": med_win_rate,
            },
        },
        "trades": trades,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
