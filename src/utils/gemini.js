import {
  analyzeChart as engineAnalyzeChart,
  getMarketInsights as engineGetMarketInsights,
  generateSignals as engineGenerateSignals
} from './analysisEngine.js';
import { api } from './api.js';

export function setUseBuiltIn(value) {
  localStorage.setItem('tradevision_use_builtin', value ? 'true' : 'false');
}

export function getUseBuiltIn() {
  return localStorage.getItem('tradevision_use_builtin') !== 'false';
}

function shouldUseBackend() {
  const useBuiltIn = localStorage.getItem('tradevision_use_builtin') !== 'false';
  return !useBuiltIn;
}

export async function analyzeChart(imageBase64, mimeType, pair, timeframe, currentPrice = null, analysisDepth = 'detailed') {
  if (!shouldUseBackend()) {
    console.log('🧠 Using TradeVision Built-in AI Engine');
    return await engineAnalyzeChart(imageBase64, mimeType, pair, timeframe, currentPrice);
  }

  console.log('🌐 Attempting Backend Analysis API...');
  try {
    return await api.post('/analyze', { imageBase64, mimeType, pair, timeframe, currentPrice, analysisDepth });
  } catch (error) {
    console.warn('⚠️ Backend API failed, falling back to built-in engine:', error.message);
    return await engineAnalyzeChart(imageBase64, mimeType, pair, timeframe, currentPrice);
  }
}

export async function getMarketInsights(topic) {
  if (!shouldUseBackend()) {
    console.log('🧠 Using TradeVision Built-in AI Engine');
    return await engineGetMarketInsights(topic);
  }

  try {
    return await api.post('/analyze/insights', { topic });
  } catch (error) {
    console.warn('⚠️ Backend API failed, falling back to built-in engine:', error.message);
    return await engineGetMarketInsights(topic);
  }
}

export async function generateSignals(marketType) {
  if (!shouldUseBackend()) {
    console.log('🧠 Using TradeVision Built-in AI Engine');
    return await engineGenerateSignals(marketType);
  }

  try {
    return await api.post('/analyze/signals', { marketType });
  } catch (error) {
    console.warn('⚠️ Backend API failed, falling back to built-in engine:', error.message);
    return await engineGenerateSignals(marketType);
  }
}
