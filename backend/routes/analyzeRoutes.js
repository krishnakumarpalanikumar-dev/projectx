import express from 'express';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

router.post('/', auth, async (req, res) => {
  try {
    const { imageBase64, mimeType, pair, timeframe, currentPrice, analysisDepth } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ message: 'Gemini API key not configured on server' });

    const priceContext = currentPrice ? `\nCurrent Market Price: ${currentPrice}` : '';
    const depthContext = analysisDepth === 'comprehensive' ? '\nProvide the most thorough analysis possible with detailed reasoning for every level.' : '';

    const prompt = `You are an elite forex, crypto, and stock market technical analyst with 20+ years of experience. Analyze this chart image with extreme precision.

Market Pair: ${pair}
Timeframe: ${timeframe}${priceContext}${depthContext}

CRITICAL INSTRUCTIONS:
1. You MUST commit to either BUY or SELL. Only use HOLD if the chart is genuinely 100% directionless with zero technical evidence in either direction. In practice, almost every chart has SOME directional bias — find it.
2. All price levels (entry, SL, TP) must be REALISTIC numbers based on what you see in the chart.${currentPrice ? ` The current price is ${currentPrice} — use this as your reference point. Entry, SL, and TP must be close to this price.` : ''}
3. Look for: candlestick patterns, trend lines, support/resistance zones, chart formations, indicator signals visible on the chart.
4. Be decisive. A "BUY with low confidence" is more useful than "HOLD".

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "trend": {
    "direction": "bullish/bearish/sideways",
    "strength": "strong/moderate/weak",
    "description": "Detailed description of the current trend based on what you see"
  },
  "support_resistance": {
    "support_levels": ["level1", "level2", "level3"],
    "resistance_levels": ["level1", "level2", "level3"],
    "key_level": "The most important S/R level and why"
  },
  "patterns": {
    "detected": ["pattern1", "pattern2"],
    "description": "Description of chart patterns found"
  },
  "signals": {
    "recommendation": "BUY/SELL/HOLD",
    "confidence": "high/medium/low",
    "entry_price": "precise entry price as a number",
    "stop_loss": "precise SL as a number",
    "take_profit_1": "TP1 as a number",
    "take_profit_2": "TP2 as a number",
    "take_profit_3": "TP3 as a number",
    "risk_reward_ratio": "R:R ratio like 1:2.5"
  },
  "indicators": {
    "rsi_reading": "overbought/oversold/neutral with estimated value",
    "moving_averages": "What MAs suggest based on visible lines",
    "volume": "Volume analysis if volume bars are visible"
  },
  "summary": "A 2-3 sentence executive summary with clear actionable advice. Be specific about entry timing and conditions."
}`;

    let lastError = null;
    let text = null;

    for (const model of MODELS) {
      try {
        const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: imageBase64 } },
                { text: prompt }
              ]
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
          })
        });

        if (!response.ok) {
          throw new Error('Gemini API error');
        }

        const data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!text) {
      return res.status(500).json({ message: 'All Gemini models unavailable or failed', error: lastError?.message });
    }

    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    res.json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(500).json({ message: 'Server error during analysis', error: error.message });
  }
});

router.post('/insights', auth, async (req, res) => {
  try {
    const { topic } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'API key not configured' });

    const prompt = `You are an expert financial market analyst. Provide current market insights about: ${topic}

Respond in the following JSON format (respond with ONLY valid JSON, no markdown):
{
  "insights": [
    {
      "category": "Forex/Crypto/Stocks",
      "title": "Insight title",
      "summary": "Detailed insight summary (2-3 sentences)",
      "impact": "bullish/bearish/neutral",
      "confidence": "high/medium/low"
    }
  ],
  "market_sentiment": "overall market sentiment analysis",
  "key_events": ["upcoming key event 1", "event 2"]
}`;

    const url = `${GEMINI_API_BASE}/${MODELS[0]}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 }
      })
    });
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json(JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/signals', auth, async (req, res) => {
  try {
    const { marketType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'API key not configured' });

    const prompt = `You are an expert ${marketType} trader. Based on current market conditions and technical analysis, generate 5 realistic trading signals.

Respond in the following JSON format (respond with ONLY valid JSON, no markdown):
{
  "signals": [
    {
      "pair": "pair name (e.g., EUR/USD or BTC/USDT or AAPL)",
      "type": "BUY/SELL",
      "entry": "entry price",
      "stop_loss": "stop loss price",
      "take_profit": "take profit price",
      "timeframe": "timeframe",
      "confidence": "high/medium/low",
      "reason": "Brief reason for the signal"
    }
  ]
}`;

    const url = `${GEMINI_API_BASE}/${MODELS[0]}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
      })
    });
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json(JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
