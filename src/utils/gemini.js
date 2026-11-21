// TradeVision AI — Backend API Bridge
// All trading analysis calls go strictly to FastAPI backend powered by Twelve Data API.
// No Gemini, no built-in simulated engine, no local ML models.

import { api } from './api.js';

// ── Stub functions (keep exports so existing imports don't break) ──
export function setUseBuiltIn() {}
export function getUseBuiltIn() { return true; }

/**
 * Normalize pair format: "EUR/USD" → "EURUSD", "BTC/USDT" → "BTCUSDT", already "EURUSD" stays as-is.
 */
export function normalizePair(pair) {
  if (!pair) return '';
  return pair.replace(/[\/\-\s]/g, '').toUpperCase();
}

/**
 * Main analysis function:
 * Calls POST /predict/analyze on the FastAPI backend using real Twelve Data market data.
 * If an image is also provided, enriches with pixel analysis summary.
 * Throws on failure — NEVER silently converts an API error into a HOLD signal.
 */
export async function analyzeChart(imageBase64, mimeType, pair, timeframe, currentPrice = null, analysisDepth = 'standard') {
  const normalizedPair = normalizePair(pair);

  if (!normalizedPair && !imageBase64) {
    throw new Error('Please select or enter a trading pair (e.g. EUR/USD) to analyze');
  }

  // If pair is provided, POST /predict/analyze is the authoritative technical analysis
  if (normalizedPair) {
    const result = await api.post('/predict/analyze', {
      pair: normalizedPair,
      timeframe: timeframe || '1h',
      analysis_depth: analysisDepth || 'standard'
    });

    let pixelSummary = '';
    if (imageBase64) {
      try {
        const imgResult = await api.post('/predict/image', {
          image_base64: imageBase64,
          pair: normalizedPair,
          timeframe: timeframe || '1h'
        });
        if (imgResult && imgResult.summary) {
          pixelSummary = ` Chart visual scan: ${imgResult.summary}`;
        }
      } catch (err) {
        console.warn('Optional chart visual scan skipped:', err.message);
      }
    }

    const fullSummary = (result.reasons || ['Analysis complete.']).join(' ') + pixelSummary;

    return {
      trend: {
        direction: result.trend || 'sideways',
        strength: result.trend_strength || 'weak',
        description: (result.reasons || []).join('. ') || ''
      },
      support_resistance: {
        support_levels: result.stop_loss != null ? [String(result.stop_loss)] : [],
        resistance_levels: result.take_profit != null ? [String(result.take_profit)] : [],
        key_level: `Entry at ${result.entry_price != null ? result.entry_price : (currentPrice || 'N/A')}`
      },
      patterns: {
        detected: [],
        description: (result.reasons || []).join('. ')
      },
      signals: {
        recommendation: result.signal || 'HOLD',
        confidence: result.confidence || 'low',
        confidence_pct: result.confidence_pct || 38.0,
        entry_price: result.entry_price != null ? result.entry_price : (currentPrice || 'N/A'),
        stop_loss: result.stop_loss != null ? result.stop_loss : 'N/A',
        take_profit_1: result.take_profit != null ? result.take_profit : 'N/A',
        take_profit_2: 'N/A',
        take_profit_3: 'N/A',
        risk_reward_ratio: result.risk_reward || '1:2'
      },
      indicators: {
        rsi_reading: result.indicators?.rsi != null ? `${result.indicators.rsi.toFixed(1)}` : 'N/A',
        moving_averages: result.indicators?.ema_20 != null ? `EMA-20: ${result.indicators.ema_20.toFixed(5)}` : 'N/A',
        macd_reading: result.indicators?.macd != null ? `MACD: ${result.indicators.macd.toFixed(5)} (Sig: ${result.indicators.macd_signal?.toFixed(5)})` : 'N/A',
        volume: result.ohlc_count ? `${result.ohlc_count} candles` : 'N/A'
      },
      current_price: result.current_price,
      pair: result.pair,
      symbol: result.symbol,
      timeframe: result.timeframe,
      reasons: result.reasons || [],
      summary: fullSummary,
      engine: result.engine || 'twelve_data_api'
    };
  }

  // Fallback: image-only if no pair provided
  const imgResult = await api.post('/predict/image', {
    image_base64: imageBase64,
    pair: null,
    timeframe: timeframe || '1h'
  });

  return {
    trend: {
      direction: imgResult.trend || 'sideways',
      strength: 'moderate',
      description: imgResult.summary || ''
    },
    support_resistance: {
      support_levels: [],
      resistance_levels: [],
      key_level: ''
    },
    patterns: {
      detected: [],
      description: imgResult.summary || ''
    },
    signals: {
      recommendation: imgResult.signal || 'HOLD',
      confidence: imgResult.confidence ? `${imgResult.confidence}%` : 'low',
      confidence_pct: imgResult.confidence || 40.0,
      entry_price: imgResult.current_price || currentPrice || 'N/A',
      stop_loss: 'N/A',
      take_profit_1: 'N/A',
      take_profit_2: 'N/A',
      take_profit_3: 'N/A',
      risk_reward_ratio: '1:2'
    },
    indicators: {
      rsi_reading: 'N/A',
      moving_averages: 'N/A',
      macd_reading: 'N/A',
      volume: 'N/A'
    },
    summary: imgResult.summary || 'Chart image analysis complete.',
    engine: imgResult.engine || 'pixel_analysis'
  };
}

/**
 * Fetch live market insights using a single /predict/analyze call for EURUSD.
 * Avoids multiple redundant requests.
 */
export async function getMarketInsights(topic) {
  try {
    const analysis = await api.post('/predict/analyze', {
      pair: 'EURUSD',
      timeframe: '1h',
      analysis_depth: 'standard'
    });

    const rsi = analysis.indicators?.rsi;
    const macd = analysis.indicators?.macd;
    const ema = analysis.indicators?.ema_20;
    const livePrice = analysis.current_price;
    const reasons = (analysis.reasons || []).join(' ');

    const insights = [
      {
        category: topic.includes('crypto') ? 'Crypto' : topic.includes('stock') ? 'Stocks' : 'Forex',
        title: `${topic} — Live Market Update`,
        summary: `EUR/USD currently at ${livePrice}. RSI: ${rsi != null ? rsi.toFixed(1) : 'N/A'}, MACD: ${macd != null ? macd.toFixed(5) : 'N/A'}, EMA-20: ${ema != null ? ema.toFixed(5) : 'N/A'}. ${reasons}`,
        impact: analysis.signal === 'BUY' ? 'bullish' : analysis.signal === 'SELL' ? 'bearish' : 'neutral',
        confidence: analysis.confidence || 'medium'
      }
    ];

    return {
      insights,
      market_sentiment: analysis.signal === 'BUY'
        ? 'Bullish — indicators align for positive momentum'
        : analysis.signal === 'SELL'
        ? 'Bearish — indicators align for downward momentum'
        : 'Neutral — markets indecisive or consolidating',
      key_events: ['Live Twelve Data stream active', `EUR/USD: ${livePrice}`, `Signal: ${analysis.signal}`],
      engine: 'twelve_data_api'
    };

  } catch (error) {
    console.error('getMarketInsights error:', error);
    throw new Error(`Unable to retrieve analysis from Twelve Data: ${error.message}`);
  }
}

/**
 * Generate trading signals for a market type using live Twelve Data analysis.
 */
export async function generateSignals(marketType) {
  if (marketType === 'stocks') {
    return { signals: [], engine: 'twelve_data_api' };
  }

  const pairs = marketType === 'crypto' 
    ? ['BTCUSDT'] 
    : ['EURUSD', 'XAUUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];

  const requests = pairs.map(pair =>
    api.post('/predict/analyze', { pair, timeframe: '1h' }).catch(err => {
      console.warn(`Failed to fetch signal for ${pair}:`, err.message);
      return null;
    })
  );

  const results = await Promise.all(requests);

  const signals = results
    .filter(r => r && r.success)
    .map(r => ({
      pair: r.symbol || r.pair,
      type: r.signal || 'HOLD',
      entry: r.entry_price != null ? String(r.entry_price) : 'N/A',
      stop_loss: r.stop_loss != null ? String(r.stop_loss) : 'N/A',
      take_profit: r.take_profit != null ? String(r.take_profit) : 'N/A',
      timeframe: r.timeframe || '1h',
      confidence: r.confidence || 'low',
      confidence_pct: r.confidence_pct,
      reason: (r.reasons && r.reasons[0]) || 'Twelve Data rule-based analysis'
    }));

  return { signals, engine: 'twelve_data_api' };
}
