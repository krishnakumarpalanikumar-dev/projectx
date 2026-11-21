"""
TradeVision AI — Health Check Routes
=====================================
"""

from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def root():
    """Root endpoint — confirms the server is running."""
    return {
        "status": "running",
        "service": "TradeVision AI",
        "engine": "twelve_data_api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "services": {
            "api": "twelve_data_api",
            "image_analysis": "pixel_analysis",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
