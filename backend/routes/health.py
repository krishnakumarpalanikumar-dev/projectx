"""
TradeVision AI — Health Check Routes
=====================================
"""

import os
import sys
from datetime import datetime, timezone

from fastapi import APIRouter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ai_model"))
from ml_model import get_model_metadata

router = APIRouter()


@router.get("/")
async def root():
    """Root endpoint — confirms the server is running."""
    model_meta = get_model_metadata()
    return {
        "status": "running",
        "service": "TradeVision AI",
        "engine": "lightgbm_yfinance",
        "model_loaded": model_meta.get("loaded", False),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
async def health():
    """Detailed health check."""
    model_meta = get_model_metadata()
    return {
        "status": "healthy",
        "services": {
            "market_data": "yfinance",
            "ml_engine": "lightgbm_model",
            "model_loaded": model_meta.get("loaded", False),
            "artifact_exists": model_meta.get("artifact_exists", False),
            "image_analysis": "pixel_analysis",
        },
        "model_metrics": {
            "val_accuracy": model_meta.get("val_accuracy"),
            "val_roc_auc": model_meta.get("val_roc_auc"),
            "sample_count": model_meta.get("sample_count"),
            "trained_at": model_meta.get("trained_at"),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
