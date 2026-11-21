"""
TradeVision AI — Signal Logic
=============================
Shared rule-based trading signal evaluation and ATR level calculations.
Imported authoritatively by both predict.py and backtest.py.
"""

from typing import Tuple, Dict, Any, List, Optional


def evaluate_signal(
    rsi: float,
    macd: float,
    macd_signal: float,
    close: float,
    ema_20: float,
) -> Dict[str, Any]:
    """
    Evaluate trading signal based on strict rule-based indicator conditions:

    - STRONG BUY (confidence "high", ~78%):
        RSI < 35 AND MACD > macd_signal AND close > ema_20
    - BUY (confidence "medium", ~60%):
        RSI between 35 and 45 AND MACD > macd_signal AND close > ema_20
    - STRONG SELL (confidence "high", ~78%):
        RSI > 65 AND MACD < macd_signal AND close < ema_20
    - SELL (confidence "medium", ~60%):
        RSI between 55 and 65 AND MACD < macd_signal AND close < ema_20
    - HOLD (confidence "low", ~38%):
        everything else
    """
    signal = "HOLD"
    confidence = "low"
    confidence_pct = 38.0
    trend = "sideways"
    trend_strength = "weak"
    reasons: List[str] = []

    # ── STRONG BUY ─────────────────────────────────────
    if rsi < 35 and macd > macd_signal and close > ema_20:
        signal = "STRONG BUY"
        confidence = "high"
        confidence_pct = 78.0
        trend = "bullish"
        trend_strength = "strong"
        reasons = [
            f"RSI at {rsi:.1f} — oversold territory (< 35)",
            f"MACD ({macd:.5f}) crossed above signal ({macd_signal:.5f}) — bullish momentum confirmed",
            f"Candle close ({close:.5f}) trading above EMA-20 ({ema_20:.5f}) — uptrend confirmed",
            "Multiple confluence signals align for a high-probability strong buy entry",
        ]

    # ── STRONG SELL ────────────────────────────────────
    elif rsi > 65 and macd < macd_signal and close < ema_20:
        signal = "STRONG SELL"
        confidence = "high"
        confidence_pct = 78.0
        trend = "bearish"
        trend_strength = "strong"
        reasons = [
            f"RSI at {rsi:.1f} — overbought territory (> 65)",
            f"MACD ({macd:.5f}) below signal ({macd_signal:.5f}) — bearish momentum confirmed",
            f"Candle close ({close:.5f}) trading below EMA-20 ({ema_20:.5f}) — downtrend confirmed",
            "Multiple bearish confluence signals support a high-probability strong sell entry",
        ]

    # ── MEDIUM BUY (requires close > ema_20) ───────────
    elif 35 <= rsi <= 45 and macd > macd_signal and close > ema_20:
        signal = "BUY"
        confidence = "medium"
        confidence_pct = 60.0
        trend = "bullish"
        trend_strength = "moderate"
        reasons = [
            f"RSI at {rsi:.1f} — recovering from oversold zone (35-45)",
            f"MACD ({macd:.5f}) above signal ({macd_signal:.5f}) — momentum turning bullish",
            f"Candle close ({close:.5f}) trading above EMA-20 ({ema_20:.5f}) — short-term trend positive",
            "Moderate buy signal with confirmed EMA-20 alignment — consider measured position size",
        ]

    # ── MEDIUM SELL (requires close < ema_20) ──────────
    elif 55 <= rsi <= 65 and macd < macd_signal and close < ema_20:
        signal = "SELL"
        confidence = "medium"
        confidence_pct = 60.0
        trend = "bearish"
        trend_strength = "moderate"
        reasons = [
            f"RSI at {rsi:.1f} — approaching overbought zone (55-65)",
            f"MACD ({macd:.5f}) below signal ({macd_signal:.5f}) — momentum fading bearish",
            f"Candle close ({close:.5f}) trading below EMA-20 ({ema_20:.5f}) — short-term trend negative",
            "Moderate sell signal with confirmed EMA-20 alignment — consider measured position size",
        ]

    # ── HOLD (Conditions not fully met) ────────────────
    else:
        signal = "HOLD"
        confidence = "low"
        confidence_pct = 38.0
        trend = "sideways"
        trend_strength = "weak"
        reasons = []

        # Explicitly flag if RSI/MACD were in BUY zone but rejected by EMA-20
        if 35 <= rsi <= 45 and macd > macd_signal and close <= ema_20:
            reasons.append(
                f"RSI ({rsi:.1f}) is in recovery zone (35-45) and MACD is bullish, but candle close ({close:.5f}) remains below EMA-20 ({ema_20:.5f}) — EMA confirmation required before buying."
            )
        elif rsi < 35 and macd > macd_signal and close <= ema_20:
            reasons.append(
                f"RSI ({rsi:.1f}) is oversold (< 35) and MACD is bullish, but price ({close:.5f}) has not reclaimed EMA-20 ({ema_20:.5f}) — waiting for trend confirmation."
            )

        # Explicitly flag if RSI/MACD were in SELL zone but rejected by EMA-20
        elif 55 <= rsi <= 65 and macd < macd_signal and close >= ema_20:
            reasons.append(
                f"RSI ({rsi:.1f}) is in caution zone (55-65) and MACD is bearish, but candle close ({close:.5f}) remains above EMA-20 ({ema_20:.5f}) — EMA confirmation required before selling."
            )
        elif rsi > 65 and macd < macd_signal and close >= ema_20:
            reasons.append(
                f"RSI ({rsi:.1f}) is overbought (> 65) and MACD is bearish, but price ({close:.5f}) is still holding above EMA-20 ({ema_20:.5f}) — waiting for breakdown."
            )

        # Standard indicator diagnostic explanations
        else:
            # 1. MACD status
            if macd > macd_signal:
                reasons.append("MACD is bullish above signal line, but remaining confluence conditions are unmet.")
            elif macd < macd_signal:
                reasons.append("MACD is bearish below signal line, but remaining confluence conditions are unmet.")
            else:
                reasons.append(f"MACD ({macd:.5f}) and signal line ({macd_signal:.5f}) are converged — momentum is flat.")

            # 2. RSI status
            if 45 <= rsi <= 55:
                reasons.append(f"RSI at {rsi:.1f} is in neutral equilibrium zone (45-55).")
            elif rsi < 35:
                reasons.append(f"RSI at {rsi:.1f} is oversold, but directional momentum is unaligned.")
            elif rsi > 65:
                reasons.append(f"RSI at {rsi:.1f} is overbought, but directional momentum is unaligned.")
            elif 35 <= rsi < 45:
                reasons.append(f"RSI at {rsi:.1f} is moderately low without full setup confluence.")
            else:
                reasons.append(f"RSI at {rsi:.1f} is moderately high without full setup confluence.")

            # 3. EMA status
            ema_diff_pct = abs(close - ema_20) / ema_20 if ema_20 > 0 else 0
            if ema_diff_pct < 0.003:
                reasons.append("Price is consolidating directly at EMA-20 — trend confirmation is unclear.")
            elif close > ema_20:
                reasons.append(f"Candle close ({close:.5f}) is above EMA-20 ({ema_20:.5f}), but requires full indicator confluence.")
            else:
                reasons.append(f"Candle close ({close:.5f}) is below EMA-20 ({ema_20:.5f}), but requires full indicator confluence.")

        reasons.append("No clear directional bias with full indicator confluence — hold recommended.")

    return {
        "signal": signal,
        "confidence": confidence,
        "confidence_pct": round(confidence_pct, 1),
        "trend": trend,
        "trend_strength": trend_strength,
        "reasons": reasons,
    }


def calculate_trade_levels(
    entry_price: float,
    atr_val: Optional[float],
    signal: str,
    decimals: int = 5,
) -> Tuple[Optional[float], Optional[float], Optional[str]]:
    """
    Calculate stop loss, take profit, and risk:reward using standard ATR:
    - SL: ATR * 1.5
    - TP: ATR * 3.0 (1:2 R:R)
    """
    if not atr_val or atr_val <= 0 or signal == "HOLD":
        return None, None, None

    if "BUY" in signal:
        stop_loss = round(entry_price - (atr_val * 1.5), decimals)
        take_profit = round(entry_price + (atr_val * 3.0), decimals)
        return stop_loss, take_profit, "1:2"
    elif "SELL" in signal:
        stop_loss = round(entry_price + (atr_val * 1.5), decimals)
        take_profit = round(entry_price - (atr_val * 3.0), decimals)
        return stop_loss, take_profit, "1:2"

    return None, None, None
