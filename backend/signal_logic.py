"""
TradeVision AI — Signal Logic
=============================
Hybrid ML + technical structure signal evaluation and ATR trade-level
calculations. Imported authoritatively by both predict.py and backtest.py.
"""

from typing import Tuple, Dict, Any, List, Optional


def evaluate_signal(
    rsi: float,
    macd: float,
    macd_signal: float,
    close: float,
    ema_20: float,
    ml_win_prob: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Evaluate trading signal combining structural trend/momentum conditions
    with LightGBM win probability (when provided):

    When `ml_win_prob` is provided:
      - Bullish structure (close > ema_20 AND macd > macd_signal AND rsi < 70):
          * ml_win_prob >= 0.60 -> STRONG BUY (high, prob*100)
          * 0.50 <= ml_win_prob < 0.60 -> BUY (medium, prob*100)
          * ml_win_prob < 0.50 -> HOLD (low, prob*100) — filtered out by LightGBM
      - Bearish structure (close < ema_20 AND macd < macd_signal AND rsi > 30):
          * ml_win_prob >= 0.60 -> STRONG SELL (high, prob*100)
          * 0.50 <= ml_win_prob < 0.60 -> SELL (medium, prob*100)
          * ml_win_prob < 0.50 -> HOLD (low, prob*100) — filtered out by LightGBM
      - Otherwise -> HOLD with clear indicator reasons.

    When `ml_win_prob` is None, falls back to strict rule-based confluence.
    """
    signal = "HOLD"
    confidence = "low"
    confidence_pct = 38.0
    trend = "sideways"
    trend_strength = "weak"
    reasons: List[str] = []

    if ml_win_prob is not None:
        prob_pct = round(float(ml_win_prob) * 100.0, 1)
        bullish_structure = close > ema_20 and macd > macd_signal and rsi < 70
        bearish_structure = close < ema_20 and macd < macd_signal and rsi > 30

        if bullish_structure:
            if ml_win_prob >= 0.60:
                signal = "STRONG BUY"
                confidence = "high"
                confidence_pct = prob_pct
                trend = "bullish"
                trend_strength = "strong"
                reasons = [
                    f"LightGBM model estimates {prob_pct:.1f}% win probability (>= 60% high-conviction threshold)",
                    f"Candle close ({close:.5f}) above EMA-20 ({ema_20:.5f}) confirms bullish structure",
                    f"MACD ({macd:.5f}) above signal ({macd_signal:.5f}) confirms upward momentum",
                    f"RSI at {rsi:.1f} leaves room for upside (< 70)",
                ]
            elif ml_win_prob >= 0.50:
                signal = "BUY"
                confidence = "medium"
                confidence_pct = prob_pct
                trend = "bullish"
                trend_strength = "moderate"
                reasons = [
                    f"LightGBM model estimates {prob_pct:.1f}% win probability (50–60% moderate conviction)",
                    f"Candle close ({close:.5f}) above EMA-20 ({ema_20:.5f}) — bullish trend alignment",
                    f"MACD ({macd:.5f}) above signal ({macd_signal:.5f}) — positive momentum",
                    f"RSI at {rsi:.1f} within healthy bullish range (< 70)",
                ]
            else:
                signal = "HOLD"
                confidence = "low"
                confidence_pct = prob_pct
                trend = "sideways"
                trend_strength = "weak"
                reasons = [
                    f"Bullish structure detected (close {close:.5f} > EMA-20 {ema_20:.5f}, MACD bullish), but LightGBM filtered out this setup due to low win probability ({prob_pct:.1f}% < 50%).",
                    f"RSI at {rsi:.1f}, MACD ({macd:.5f}) vs signal ({macd_signal:.5f}).",
                    "Waiting for stronger feature confluence before entering a long trade.",
                ]

        elif bearish_structure:
            if ml_win_prob >= 0.60:
                signal = "STRONG SELL"
                confidence = "high"
                confidence_pct = prob_pct
                trend = "bearish"
                trend_strength = "strong"
                reasons = [
                    f"LightGBM model estimates {prob_pct:.1f}% win probability (>= 60% high-conviction threshold)",
                    f"Candle close ({close:.5f}) below EMA-20 ({ema_20:.5f}) confirms bearish structure",
                    f"MACD ({macd:.5f}) below signal ({macd_signal:.5f}) confirms downward momentum",
                    f"RSI at {rsi:.1f} leaves room for downside (> 30)",
                ]
            elif ml_win_prob >= 0.50:
                signal = "SELL"
                confidence = "medium"
                confidence_pct = prob_pct
                trend = "bearish"
                trend_strength = "moderate"
                reasons = [
                    f"LightGBM model estimates {prob_pct:.1f}% win probability (50–60% moderate conviction)",
                    f"Candle close ({close:.5f}) below EMA-20 ({ema_20:.5f}) — bearish trend alignment",
                    f"MACD ({macd:.5f}) below signal ({macd_signal:.5f}) — negative momentum",
                    f"RSI at {rsi:.1f} within healthy bearish range (> 30)",
                ]
            else:
                signal = "HOLD"
                confidence = "low"
                confidence_pct = prob_pct
                trend = "sideways"
                trend_strength = "weak"
                reasons = [
                    f"Bearish structure detected (close {close:.5f} < EMA-20 {ema_20:.5f}, MACD bearish), but LightGBM filtered out this setup due to low win probability ({prob_pct:.1f}% < 50%).",
                    f"RSI at {rsi:.1f}, MACD ({macd:.5f}) vs signal ({macd_signal:.5f}).",
                    "Waiting for stronger feature confluence before entering a short trade.",
                ]

        else:
            signal = "HOLD"
            confidence = "low"
            confidence_pct = 38.0
            trend = "sideways"
            trend_strength = "weak"
            reasons = _build_hold_reasons(rsi, macd, macd_signal, close, ema_20)

        return {
            "signal": signal,
            "confidence": confidence,
            "confidence_pct": round(confidence_pct, 1),
            "trend": trend,
            "trend_strength": trend_strength,
            "reasons": reasons,
        }

    # ── Legacy rule-based fallback (when ml_win_prob is None) ──
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
    else:
        signal = "HOLD"
        confidence = "low"
        confidence_pct = 38.0
        trend = "sideways"
        trend_strength = "weak"
        reasons = _build_hold_reasons(rsi, macd, macd_signal, close, ema_20)

    return {
        "signal": signal,
        "confidence": confidence,
        "confidence_pct": round(confidence_pct, 1),
        "trend": trend,
        "trend_strength": trend_strength,
        "reasons": reasons,
    }


def _build_hold_reasons(
    rsi: float,
    macd: float,
    macd_signal: float,
    close: float,
    ema_20: float,
) -> List[str]:
    """Generate diagnostic explanations when indicator structure does not align."""
    reasons: List[str] = []

    if rsi >= 70 and close > ema_20 and macd > macd_signal:
        reasons.append(f"RSI at {rsi:.1f} is overbought (>= 70) — avoiding chasing bullish extension.")
    elif rsi <= 30 and close < ema_20 and macd < macd_signal:
        reasons.append(f"RSI at {rsi:.1f} is oversold (<= 30) — avoiding chasing bearish extension.")
    elif macd > macd_signal and close <= ema_20:
        reasons.append(
            f"MACD is bullish, but candle close ({close:.5f}) remains below EMA-20 ({ema_20:.5f}) — waiting for trend confirmation."
        )
    elif macd < macd_signal and close >= ema_20:
        reasons.append(
            f"MACD is bearish, but candle close ({close:.5f}) remains above EMA-20 ({ema_20:.5f}) — waiting for breakdown confirmation."
        )
    else:
        if macd > macd_signal:
            reasons.append("MACD is bullish above signal line, but structural alignment is incomplete.")
        elif macd < macd_signal:
            reasons.append("MACD is bearish below signal line, but structural alignment is incomplete.")
        else:
            reasons.append(f"MACD ({macd:.5f}) and signal line ({macd_signal:.5f}) are converged — momentum is flat.")

        if 45 <= rsi <= 55:
            reasons.append(f"RSI at {rsi:.1f} is in neutral equilibrium zone (45-55).")
        elif rsi < 35:
            reasons.append(f"RSI at {rsi:.1f} is oversold without aligned bullish momentum.")
        elif rsi > 65:
            reasons.append(f"RSI at {rsi:.1f} is overbought without aligned bearish momentum.")

        ema_diff_pct = abs(close - ema_20) / ema_20 if ema_20 > 0 else 0
        if ema_diff_pct < 0.003:
            reasons.append("Price is consolidating directly at EMA-20 — trend confirmation is unclear.")
        elif close > ema_20:
            reasons.append(f"Candle close ({close:.5f}) is above EMA-20 ({ema_20:.5f}), awaiting MACD alignment.")
        else:
            reasons.append(f"Candle close ({close:.5f}) is below EMA-20 ({ema_20:.5f}), awaiting MACD alignment.")

    reasons.append("No clear directional bias with full indicator confluence — hold recommended.")
    return reasons


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
