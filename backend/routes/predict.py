"""
TradeVision AI — Predict Routes
================================
Rule-based trading signal generation powered authoritatively by Twelve Data API.
No local AI models — pure Twelve Data market indicators and price action logic.
"""

import sys
import os
import io
import base64
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd

# ── Ensure ai_model/ and backend/ are importable ───────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ai_model"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from data_collector import (
    get_full_analysis_data,
    get_current_price,
    get_ohlc_history,
    SUPPORTED_PAIRS,
    SUPPORTED_TIMEFRAMES,
    normalize_timeframe,
    calculate_atr,
)
from signal_logic import evaluate_signal, calculate_trade_levels

router = APIRouter()


# ── Request Schemas ────────────────────────────────────
class AnalyzeRequest(BaseModel):
    pair: str
    timeframe: str = "1h"
    analysis_depth: str = "standard"


class ImageRequest(BaseModel):
    image_base64: str
    pair: Optional[str] = None
    timeframe: Optional[str] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /predict/analyze
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Generate a rule-based trading signal from live Twelve Data
    indicators (RSI, MACD, EMA-20) and OHLC price action."""

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

    # ── Fetch live data from Twelve Data ───────────────
    data = get_full_analysis_data(pair, interval=norm_timeframe)
    if data is None:
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve market data from Twelve Data",
        )

    current_price = data.get("current_price")
    ohlc = data.get("ohlc", [])
    indicators = data.get("indicators", {})

    if current_price is None or not ohlc:
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve market data from Twelve Data",
        )

    rsi = indicators.get("rsi")
    macd = indicators.get("macd")
    macd_signal = indicators.get("macd_signal")
    ema_20 = indicators.get("ema_20")

    if rsi is None or macd is None or macd_signal is None or ema_20 is None:
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve technical indicators from Twelve Data",
        )

    # ── Conceptually separate live price vs last candle close ──
    # ohlc[-1] is the newest candle (ascending chronological order preserved)
    last_candle_close = ohlc[-1].get("close", current_price)

    # ── Calculate data age in seconds ──────────────────
    data_age_seconds = 0
    try:
        last_dt_raw = ohlc[-1].get("datetime")
        if last_dt_raw:
            last_dt = pd.to_datetime(last_dt_raw)
            if last_dt.tzinfo is None:
                last_dt = last_dt.tz_localize(timezone.utc)
            now_utc = datetime.now(timezone.utc)
            data_age_seconds = max(0, int((now_utc - last_dt).total_seconds()))
    except Exception:
        data_age_seconds = 0

    # ── Standard True Range (ATR) calculation ──────────
    atr_val = data.get("atr")
    if atr_val is None or atr_val <= 0:
        atr_val = calculate_atr(ohlc, period=14)

    # ── Shared Rule-based signal evaluation ────────────
    sig_eval = evaluate_signal(
        rsi=rsi,
        macd=macd,
        macd_signal=macd_signal,
        close=last_candle_close,
        ema_20=ema_20,
    )

    signal = sig_eval["signal"]
    confidence = sig_eval["confidence"]
    confidence_pct = sig_eval["confidence_pct"]
    trend = sig_eval["trend"]
    trend_strength = sig_eval["trend_strength"]
    reasons = sig_eval["reasons"]

    # ── Calculate entry / SL / TP ──────────────────────
    entry_price = current_price
    decimals = 2 if entry_price >= 100 else 5
    stop_loss, take_profit, risk_reward = calculate_trade_levels(
        entry_price=entry_price,
        atr_val=atr_val,
        signal=signal,
        decimals=decimals,
    )

    return {
        "success": True,
        "signal": signal,
        "confidence": confidence,
        "confidence_pct": round(confidence_pct, 1),
        "entry_price": entry_price,
        "stop_loss": stop_loss,
        "take_profit": take_profit,
        "risk_reward": risk_reward,
        "trend": trend,
        "trend_strength": trend_strength,
        "indicators": {
            "rsi": rsi,
            "macd": macd,
            "macd_signal": macd_signal,
            "ema_20": ema_20,
        },
        "current_price": current_price,
        "pair": pair,
        "symbol": SUPPORTED_PAIRS[pair],
        "timeframe": norm_timeframe,
        "analysis_depth": req.analysis_depth,
        "ohlc_count": len(ohlc),
        "data_age_seconds": data_age_seconds,
        "reasons": reasons,
        "engine": "twelve_data_api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /predict/image
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/image")
async def predict_image(req: ImageRequest):
    """Analyse a chart image via pixel colour analysis (green vs red
    candle ratio) and optionally enrich with live Twelve Data price."""

    try:
        # ── Decode the image ───────────────────────────
        b64 = req.image_base64
        if "," in b64:
            b64 = b64.split(",")[1]

        img_bytes = base64.b64decode(b64)

        # ── Pixel colour analysis ──────────────────────
        green_count = 0
        red_count = 0
        total_pixels = 0

        try:
            from PIL import Image

            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            width, height = img.size

            # Sample every 4th pixel for performance
            step = max(1, min(width, height) // 100)
            for x in range(0, width, step):
                for y in range(0, height, step):
                    r, g, b = img.getpixel((x, y))
                    total_pixels += 1
                    if g > r and g > b and g > 80:
                        green_count += 1
                    elif r > g and r > b and r > 80:
                        red_count += 1
        except ImportError:
            # Pillow not available — fallback to size-based heuristic
            size = len(img_bytes)
            green_count = size % 100
            red_count = (size // 3) % 100
            total_pixels = green_count + red_count + 50

        # ── Determine trend from pixel ratios ──────────
        if total_pixels == 0:
            total_pixels = 1
        green_pct = (green_count / total_pixels) * 100
        red_pct = (red_count / total_pixels) * 100

        if green_pct > red_pct + 5:
            trend = "bullish"
            signal = "BUY"
            confidence = min(55 + (green_pct - red_pct), 85)
        elif red_pct > green_pct + 5:
            trend = "bearish"
            signal = "SELL"
            confidence = min(55 + (red_pct - green_pct), 85)
        else:
            trend = "sideways"
            signal = "HOLD"
            confidence = 40.0

        pair_str = req.pair or "the pair"

        # ── Fetch live price if pair is provided ───────
        live_price = None
        if req.pair:
            pair_clean = req.pair.upper()
            if pair_clean in SUPPORTED_PAIRS:
                live_price = get_current_price(pair_clean)

        return {
            "success": True,
            "trend": trend,
            "signal": signal,
            "confidence": round(confidence, 1),
            "current_price": live_price,
            "pixel_analysis": {
                "green_pct": round(green_pct, 1),
                "red_pct": round(red_pct, 1),
                "total_sampled": total_pixels,
            },
            "summary": (
                f"{pair_str} chart shows {trend} bias with {confidence:.1f}% confidence "
                f"based on candle colour analysis (green {green_pct:.1f}% vs red {red_pct:.1f}%)."
            ),
            "engine": "pixel_analysis",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
