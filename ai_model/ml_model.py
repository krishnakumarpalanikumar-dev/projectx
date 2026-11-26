"""
TradeVision AI — LightGBM ML Signal Model
==========================================
Trains and runs a calibrated LightGBM classifier on triple-barrier ATR
outcomes across historical yfinance OHLCV data.
"""

import os
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Union, Optional

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, roc_auc_score

from data_collector import get_ohlc_history
from indicators import FEATURE_COLUMNS, compute_indicators_df

logger = logging.getLogger("ml_model")

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACT_DIR, "tradevision_lgbm.pkl")

TRAINING_PAIRS = ["EURUSD", "XAUUSD", "GBPUSD", "USDJPY", "AUDUSD", "BTCUSDT"]

_CACHED_ARTIFACT: Optional[Dict[str, Any]] = None


def create_training_dataset(
    pairs: list[str] = TRAINING_PAIRS,
    interval: str = "1h",
    period: str = "730d",
    horizon_bars: int = 36,
) -> pd.DataFrame:
    """Download historical candles and generate triple-barrier ATR labels.

    Candidate setups:
      - Bullish (1): close > ema_20 AND macd > macd_signal
      - Bearish (-1): close < ema_20 AND macd < macd_signal
      - Neutral rows are skipped.

    Labeling (next `horizon_bars` candles):
      - target = 1 if 3.0 * ATR Take Profit hits before 1.5 * ATR Stop Loss
        (conservative SL-first if both touch within the same candle).
      - target = 0 otherwise.
    """
    rows = []

    for pair in pairs:
        df = get_ohlc_history(pair, interval=interval, outputsize=5000, period=period)
        if df is None or df.empty or len(df) < 100:
            logger.warning(f"Skipping {pair} during training: insufficient data")
            continue

        enriched = compute_indicators_df(df)
        n = len(enriched)

        closes = enriched["close"].to_numpy(dtype=float)
        highs = enriched["high"].to_numpy(dtype=float)
        lows = enriched["low"].to_numpy(dtype=float)
        ema20s = enriched["ema_20"].to_numpy(dtype=float)
        macds = enriched["macd"].to_numpy(dtype=float)
        macd_sigs = enriched["macd_signal"].to_numpy(dtype=float)
        atrs = enriched["atr"].to_numpy(dtype=float)
        dts = enriched["datetime"].to_numpy()
        feat_matrix = enriched[FEATURE_COLUMNS].to_numpy(dtype=float)

        warmup = 50
        pair_count = 0

        for i in range(warmup, n - horizon_bars - 1):
            c = closes[i]
            ema20 = ema20s[i]
            m = macds[i]
            ms = macd_sigs[i]
            atr = atrs[i]

            if atr <= 0 or c <= 0:
                continue

            if c > ema20 and m > ms:
                direction = 1
                sl = c - (1.5 * atr)
                tp = c + (3.0 * atr)
            elif c < ema20 and m < ms:
                direction = -1
                sl = c + (1.5 * atr)
                tp = c - (3.0 * atr)
            else:
                continue

            target = 0
            end_j = min(i + 1 + horizon_bars, n)
            for j in range(i + 1, end_j):
                fh = highs[j]
                fl = lows[j]

                if direction == 1:
                    if fl <= sl and fh >= tp:
                        target = 0
                        break
                    if fl <= sl:
                        target = 0
                        break
                    if fh >= tp:
                        target = 1
                        break
                else:
                    if fh >= sl and fl <= tp:
                        target = 0
                        break
                    if fh >= sl:
                        target = 0
                        break
                    if fl <= tp:
                        target = 1
                        break

            row_dict = {col: feat_matrix[i, idx] for idx, col in enumerate(FEATURE_COLUMNS)}
            row_dict["datetime"] = dts[i]
            row_dict["pair"] = pair
            row_dict["direction"] = direction
            row_dict["target"] = target
            rows.append(row_dict)
            pair_count += 1

        logger.info(f"Collected {pair_count} labeled setup samples from {pair}")

    if not rows:
        return pd.DataFrame()

    dataset = pd.DataFrame(rows)
    dataset["datetime"] = pd.to_datetime(dataset["datetime"], utc=True)
    dataset = dataset.sort_values("datetime", ascending=True).reset_index(drop=True)
    return dataset


def train_and_save_model() -> Dict[str, Any]:
    """Train LightGBM classifier chronologically (80/20 split) and persist to disk."""
    global _CACHED_ARTIFACT

    t0 = time.perf_counter()
    dataset = create_training_dataset()
    if dataset.empty or len(dataset) < 100:
        raise RuntimeError("Insufficient training samples collected from yfinance.")

    X = dataset[FEATURE_COLUMNS].copy()
    y = dataset["target"].astype(int).to_numpy()

    # Chronological 80/20 split (no shuffling to prevent lookahead bias)
    split_idx = int(len(dataset) * 0.8)
    X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]

    model = LGBMClassifier(
        n_estimators=200,
        learning_rate=0.04,
        num_leaves=23,
        subsample_for_bin=50000,
        random_state=42,
        n_jobs=-1,
        verbose=-1,
    )
    model.fit(X_train, y_train)

    val_probs = model.predict_proba(X_val)[:, 1]
    val_preds = (val_probs >= 0.5).astype(int)

    val_acc = float(accuracy_score(y_val, val_preds))
    if len(np.unique(y_val)) > 1:
        val_auc = float(roc_auc_score(y_val, val_probs))
    else:
        val_auc = 0.5

    elapsed = time.perf_counter() - t0

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    artifact: Dict[str, Any] = {
        "model": model,
        "feature_columns": list(FEATURE_COLUMNS),
        "val_accuracy": round(val_acc, 4),
        "val_roc_auc": round(val_auc, 4),
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
        "sample_count": int(len(dataset)),
        "positive_rate": round(float(y.mean()), 4),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_seconds": round(elapsed, 2),
    }

    joblib.dump(artifact, MODEL_PATH)
    _CACHED_ARTIFACT = artifact

    logger.info(
        f"Saved LightGBM model to {MODEL_PATH} | samples={len(dataset)}, "
        f"val_acc={val_acc:.4f}, val_auc={val_auc:.4f}, time={elapsed:.2f}s"
    )
    return {
        "model_path": MODEL_PATH,
        "val_accuracy": artifact["val_accuracy"],
        "val_roc_auc": artifact["val_roc_auc"],
        "train_samples": artifact["train_samples"],
        "val_samples": artifact["val_samples"],
        "sample_count": artifact["sample_count"],
        "positive_rate": artifact["positive_rate"],
        "trained_at": artifact["trained_at"],
        "training_seconds": artifact["training_seconds"],
    }


def _load_artifact() -> Dict[str, Any]:
    """Lazy-load trained LightGBM artifact, training once automatically if missing."""
    global _CACHED_ARTIFACT
    if _CACHED_ARTIFACT is not None:
        return _CACHED_ARTIFACT

    if os.path.exists(MODEL_PATH):
        _CACHED_ARTIFACT = joblib.load(MODEL_PATH)
        return _CACHED_ARTIFACT

    logger.info("LightGBM artifact not found on disk — running initial training...")
    train_and_save_model()
    return _CACHED_ARTIFACT


def is_model_loaded() -> bool:
    """Return True if the trained model artifact exists on disk or in memory."""
    return _CACHED_ARTIFACT is not None or os.path.exists(MODEL_PATH)


def get_model_metadata() -> Dict[str, Any]:
    """Return non-heavy metadata about the LightGBM artifact."""
    if _CACHED_ARTIFACT is None and not os.path.exists(MODEL_PATH):
        return {"loaded": False, "artifact_exists": False}

    art = _load_artifact()
    return {
        "loaded": True,
        "artifact_exists": os.path.exists(MODEL_PATH),
        "val_accuracy": art.get("val_accuracy"),
        "val_roc_auc": art.get("val_roc_auc"),
        "sample_count": art.get("sample_count"),
        "trained_at": art.get("trained_at"),
    }


def predict_setup_probabilities(features_df: pd.DataFrame) -> np.ndarray:
    """Vectorized LightGBM win-probability prediction across a DataFrame."""
    artifact = _load_artifact()
    model = artifact["model"]
    feat_cols = artifact.get("feature_columns", FEATURE_COLUMNS)

    X = features_df[feat_cols].astype(float)
    probs = model.predict_proba(X)[:, 1]
    return np.clip(probs, 0.0, 1.0)


def predict_setup_probability(
    features_row_or_df: Union[Dict[str, Any], pd.Series, pd.DataFrame]
) -> Union[float, np.ndarray]:
    """Predict calibrated win probability in [0.0, 1.0].

    Accepts a single row (dict, pd.Series, or 1-row DataFrame) returning float,
    or a multi-row pd.DataFrame returning a numpy array of probabilities.
    """
    artifact = _load_artifact()
    feat_cols = artifact.get("feature_columns", FEATURE_COLUMNS)

    if isinstance(features_row_or_df, pd.DataFrame):
        probs = predict_setup_probabilities(features_row_or_df)
        if len(features_row_or_df) == 1:
            return float(probs[0])
        return probs

    if isinstance(features_row_or_df, pd.Series):
        row_dict = {c: float(features_row_or_df.get(c, 0.0)) for c in feat_cols}
    elif isinstance(features_row_or_df, dict):
        row_dict = {c: float(features_row_or_df.get(c, 0.0)) for c in feat_cols}
    else:
        raise TypeError(f"Unsupported feature input type: {type(features_row_or_df)}")

    single_df = pd.DataFrame([row_dict], columns=feat_cols)
    probs = predict_setup_probabilities(single_df)
    return float(probs[0])


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    )
    print("=" * 60)
    print("TradeVision AI — Training LightGBM Signal Model")
    print("=" * 60)
    metrics = train_and_save_model()
    for k, v in metrics.items():
        print(f"  {k}: {v}")
