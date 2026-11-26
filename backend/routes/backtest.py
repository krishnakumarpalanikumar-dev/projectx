"""
TradeVision AI — Backtest Routes
=================================
Simulate trading strategies over historical yfinance OHLCV data using the
shared LightGBM + structural signal logic from backend/signal_logic.py.
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd

# ── Ensure ai_model/ and backend/ are importable ───────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ai_model"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from data_collector import (
    get_ohlc_history,
    SUPPORTED_PAIRS,
    PAIR_DISPLAY_SYMBOLS,
    SUPPORTED_TIMEFRAMES,
    normalize_timeframe,
)
from indicators import compute_indicators_df
from ml_model import predict_setup_probabilities
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
    Run backtest on historical yfinance OHLC data:
    1. Fetch historical candles via yfinance (clamped cleanly to valid period).
    2. Compute indicators & ML features locally via ai_model/indicators.py.
    3. Compute vectorized LightGBM win probabilities across the entire DataFrame.
    4. Apply shared evaluate_signal() rules with overlap protection (`active_until_idx`).
    5. Simulate 50-candle outcome (TP before SL = win, SL first = loss) and return metrics.
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

    # Fetch maximum available period for requested interval/lookback
    req_days = max(30, int(req.lookback_days or 365))
    if norm_timeframe in ("1h", "4h"):
        period_arg = f"{min(730, req_days + 20)}d"
    elif norm_timeframe in ("5m", "15m", "30m"):
        period_arg = f"{min(60, req_days + 5)}d"
    elif norm_timeframe == "1m":
        period_arg = "7d"
    else:
        period_arg = "max"

    raw_df = get_ohlc_history(pair, interval=norm_timeframe, outputsize=5000, period=period_arg)
    if raw_df is None or raw_df.empty or len(raw_df) < 30:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve sufficient OHLC data for backtest of {pair}",
        )

    candles_retrieved = len(raw_df)

    # ── Compute indicators & ML features consistently ─────
    df = compute_indicators_df(raw_df)

    # ── Vectorized LightGBM win probabilities ─────────────
    ml_probs = predict_setup_probabilities(df)

    # ── Filter by lookback_days after indicator warmup ────
    warmup_min = 50 if len(df) > 65 else 20
    if req.lookback_days and req.lookback_days > 0:
        cutoff_dt = pd.to_datetime(df["datetime"].iloc[-1], utc=True) - timedelta(days=req.lookback_days)
        idx_series = df[df["datetime"] >= cutoff_dt].index
        start_index = max(warmup_min, int(idx_series.min())) if len(idx_series) > 0 else warmup_min
    else:
        start_index = warmup_min

    total_candles = len(df)
    if start_index >= total_candles:
        start_index = max(0, total_candles - 1)

    actual_days_covered = round(
        float((df["datetime"].iloc[-1] - df["datetime"].iloc[start_index]).total_seconds() / 86400.0),
        1,
    )

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

    closes = df["close"].to_numpy(dtype=float)
    highs = df["high"].to_numpy(dtype=float)
    lows = df["low"].to_numpy(dtype=float)
    rsis = df["rsi"].to_numpy(dtype=float)
    macds = df["macd"].to_numpy(dtype=float)
    macd_sigs = df["macd_signal"].to_numpy(dtype=float)
    ema20s = df["ema_20"].to_numpy(dtype=float)
    atrs = df["atr"].to_numpy(dtype=float)
    dts = df["datetime"].astype(str).tolist()

    # Prevent overlapping duplicate signals while a simulated trade is active
    active_until_idx = -1

    for i in range(start_index, total_candles):
        if i <= active_until_idx:
            continue

        close_price = float(closes[i])
        rsi_val = float(rsis[i])
        macd_val = float(macds[i])
        macd_sig_val = float(macd_sigs[i])
        ema_val = float(ema20s[i])
        atr_val = float(atrs[i])
        dt_str = dts[i]
        ml_prob = float(ml_probs[i])

        sig_eval = evaluate_signal(
            rsi=rsi_val,
            macd=macd_val,
            macd_signal=macd_sig_val,
            close=close_price,
            ema_20=ema_val,
            ml_win_prob=ml_prob,
        )

        signal = sig_eval["signal"]
        if signal == "HOLD":
            continue

        is_strong = "STRONG" in signal
        decimals = 2 if close_price >= 100 else 5
        sl, tp, _ = calculate_trade_levels(
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
        exit_idx = i

        # Look ahead up to 50 candles
        max_j = min(i + 51, total_candles)
        for j in range(i + 1, max_j):
            candles_held = j - i
            c_high = float(highs[j])
            c_low = float(lows[j])
            c_time = dts[j]

            if "BUY" in signal:
                if c_low <= sl and c_high >= tp:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    exit_idx = j
                    break
                if c_high >= tp:
                    outcome = "win"
                    exit_price = tp
                    exit_time = c_time
                    exit_idx = j
                    break
                if c_low <= sl:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    exit_idx = j
                    break

            elif "SELL" in signal:
                if c_high >= sl and c_low <= tp:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    exit_idx = j
                    break
                if c_low <= tp:
                    outcome = "win"
                    exit_price = tp
                    exit_time = c_time
                    exit_idx = j
                    break
                if c_high >= sl:
                    outcome = "loss"
                    exit_price = sl
                    exit_time = c_time
                    exit_idx = j
                    break

        if outcome == "skipped":
            final_idx = min(i + 50, total_candles - 1)
            exit_price = float(closes[final_idx])
            exit_time = dts[final_idx]
            candles_held = final_idx - i
            exit_idx = final_idx

        active_until_idx = exit_idx

        if "BUY" in signal:
            raw_diff = exit_price - close_price
        else:
            raw_diff = close_price - exit_price

        pips_points = round(raw_diff * pip_mult, 1)

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
                "ml_win_probability": round(ml_prob * 100.0, 1),
                "entry_price": round(close_price, decimals),
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
        "symbol": PAIR_DISPLAY_SYMBOLS.get(pair, SUPPORTED_PAIRS[pair]),
        "timeframe": norm_timeframe,
        "lookback_days": req.lookback_days,
        "actual_days_covered": actual_days_covered,
        "candles_analyzed": max(0, total_candles - start_index),
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
