// ============================================
// TradeVision AI — Analysis Module
// Primary: Built-in AI Engine (no API key needed)
// Fallback: Gemini API (if API key is configured)
// ============================================

import { getApiKey } from './storage.js';
import {
  analyzeChart as engineAnalyzeChart,
  getMarketInsights as engineGetMarketInsights,
  generateSignals as engineGenerateSignals
} from './analysisEngine.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

// ============================================
// Check if we should use Gemini API or built-in engine
// ============================================
function shouldUseGemini() {
  const key = getApiKey();
  const useBuiltIn = localStorage.getItem('tradevision_use_builtin') !== 'false'; // Default: true
  return !useBuiltIn && key && key.length > 10;
}

export function setUseBuiltIn(value) {
  localStorage.setItem('tradevision_use_builtin', value ? 'true' : 'false');
}

export function getUseBuiltIn() {
  return localStorage.getItem('tradevision_use_builtin') !== 'false';
}

// ============================================
// Chart Analysis — Smart routing
// ============================================
export async function analyzeChart(imageBase64, mimeType, pair, timeframe) {
  // Always use built-in engine (works without API key)
  if (!shouldUseGemini()) {
    console.log('🧠 Using TradeVision Built-in AI Engine');
    return await engineAnalyzeChart(imageBase64, mimeType, pair, timeframe);
  }

  // Optional: Try Gemini API
  console.log('🌐 Attempting Gemini API...');
  try {
    return await geminiAnalyzeChart(imageBase64, mimeType, pair, timeframe);
  } catch (error) {
    console.warn('⚠️ Gemini API failed, falling back to built-in engine:', error.message);
    return await engineAnalyzeChart(imageBase64, mimeType, pair, timeframe);
  }
}

// ============================================
// Market Insights — Smart routing
// ============================================
export async function getMarketInsights(topic) {
  if (!shouldUseGemini()) {
    console.log('🧠 Using TradeVision Built-in AI Engine');
    return await engineGetMarketInsights(topic);
  }

  try {
    return await geminiGetMarketInsights(topic);
  } catch (error) {
    console.warn('⚠️ Gemini API failed, falling back to built-in engine:', error.message);
    return await engineGetMarketInsights(topic);
  }
}

// ============================================
// Trade Signals — Smart routing
// ============================================
export async function generateSignals(marketType) {
  if (!shouldUseGemini()) {
    console.log('🧠 Using TradeVision Built-in AI Engine');
    return await engineGenerateSignals(marketType);
  }

  try {
    return await geminiGenerateSignals(marketType);
  } catch (error) {
    console.warn('⚠️ Gemini API failed, falling back to built-in engine:', error.message);
    return await engineGenerateSignals(marketType);
  }
}


// ============================================
// Gemini API Functions (optional fallback)
// ============================================

async function callGeminiAPI(apiKey, body) {
  let lastError = null;
  for (const model of MODELS) {
    try {
      const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        const errMsg = err.error?.message || 'API request failed';
        if (errMsg.toLowerCase().includes('quota') || response.status === 429 || response.status === 404) {
          console.warn(`${model} unavailable (${response.status}), trying next...`);
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No response from AI');

      console.log(`✅ Using Gemini model: ${model}`);
      return text;
    } catch (error) {
      if (error.message?.toLowerCase().includes('quota') || error.message?.includes('429') || error.message?.toLowerCase().includes('not found')) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('All Gemini models unavailable.');
}

async function geminiAnalyzeChart(imageBase64, mimeType, pair, timeframe) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not configured');

  const prompt = `You are an expert forex, crypto, and stock market technical analyst. Analyze this chart image carefully.

Market Pair: ${pair}
Timeframe: ${timeframe}

Provide a comprehensive technical analysis in the following JSON format (respond with ONLY valid JSON, no markdown):
{
  "trend": {
    "direction": "bullish/bearish/sideways",
    "strength": "strong/moderate/weak",
    "description": "Brief description of the current trend"
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
    "entry_price": "suggested entry",
    "stop_loss": "suggested SL",
    "take_profit_1": "TP1",
    "take_profit_2": "TP2",
    "take_profit_3": "TP3",
    "risk_reward_ratio": "R:R ratio"
  },
  "indicators": {
    "rsi_reading": "overbought/oversold/neutral with estimated value",
    "moving_averages": "What MAs suggest",
    "volume": "Volume analysis"
  },
  "summary": "A 2-3 sentence executive summary of the overall analysis with clear actionable advice"
}`;

  const text = await callGeminiAPI(apiKey, {
    contents: [{
      parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: prompt }
      ]
    }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
  });

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

async function geminiGetMarketInsights(topic) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not configured');

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

  const text = await callGeminiAPI(apiKey, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 2048 }
  });

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

async function geminiGenerateSignals(marketType) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not configured');

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

  const text = await callGeminiAPI(apiKey, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
  });

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}
