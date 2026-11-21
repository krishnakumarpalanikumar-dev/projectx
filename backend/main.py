"""
TradeVision AI — FastAPI Backend
=================================
Clean API-powered trading analysis platform using Twelve Data API.
No local AI models — pure API + rule-based indicator logic.
"""

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# ── Load .env ──────────────────────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Ensure ai_model/ is importable by route modules ───
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ai_model"))

# ── Import routers ────────────────────────────────────
from routes.predict import router as predict_router
from routes.market import router as market_router
from routes.health import router as health_router
from routes.backtest import router as backtest_router

# ── App ────────────────────────────────────────────────
app = FastAPI(
    title="TradeVision AI",
    description="API-powered forex & crypto trading analysis platform using Twelve Data",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ──────────────────────────────────────
app.include_router(health_router, tags=["Health"])
app.include_router(predict_router, prefix="/predict", tags=["Predictions"])
app.include_router(market_router, prefix="/market", tags=["Market Data"])
app.include_router(backtest_router, prefix="/backtest", tags=["Backtesting"])
