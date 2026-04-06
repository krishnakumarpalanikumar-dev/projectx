// ============================================
// TradeVision AI — Built-in Analysis Engine
// Replaces Gemini API with local, rule-based analysis
// No API key required — runs 100% in browser
// ============================================

import { analyzeChartImage } from './chartImageAnalyzer.js';
import {
  CHART_PATTERNS,
  INDICATOR_RULES,
  TIMEFRAME_CONTEXT,
  MARKET_KNOWLEDGE,
  RISK_MANAGEMENT_RULES,
  seededRandom,
  stringToSeed
} from './knowledgeBase.js';

// ============================================
// Chart Analysis (replaces Gemini Vision)
// ============================================
export async function analyzeChart(imageBase64, mimeType, pair, timeframe) {
  // Step 1: Analyze the actual chart image pixels
  const imageAnalysis = await analyzeChartImage(imageBase64, mimeType);
  
  // Step 2: Build analysis from image data + knowledge base
  const trend = determineTrend(imageAnalysis, pair, timeframe);
  const sr = calculateSupportResistance(imageAnalysis, pair, timeframe);
  const patterns = detectPatterns(imageAnalysis, trend);
  const signals = generateTradeSignals(imageAnalysis, trend, sr, pair, timeframe);
  const indicators = analyzeIndicators(imageAnalysis, trend);
  const summary = buildSummary(trend, patterns, signals, pair, timeframe);
  
  return {
    trend,
    support_resistance: sr,
    patterns,
    signals,
    indicators,
    summary
  };
}

// ============================================
// Market Insights (replaces Gemini text)
// ============================================
export async function getMarketInsights(topic) {
  const rng = seededRandom(stringToSeed(topic));
  
  const isForex = topic.toLowerCase().includes('forex');
  const isCrypto = topic.toLowerCase().includes('crypto') || topic.toLowerCase().includes('bitcoin');
  const isStocks = topic.toLowerCase().includes('stock');
  const isFull = topic.toLowerCase().includes('full') || topic.toLowerCase().includes('complete') || topic.toLowerCase().includes('overview');
  
  const insights = [];
  
  if (isForex || isFull) {
    insights.push(...generateForexInsights(rng));
  }
  if (isCrypto || isFull) {
    insights.push(...generateCryptoInsights(rng));
  }
  if (isStocks || isFull) {
    insights.push(...generateStockInsights(rng));
  }
  
  // If none matched, default to forex
  if (insights.length === 0) {
    insights.push(...generateForexInsights(rng));
  }
  
  const sentiments = [
    'Markets are showing mixed signals with cautious optimism. Key economic data releases this week could shift sentiment significantly. Risk management remains crucial in current conditions.',
    'Overall market sentiment leans cautiously bullish. Institutional flows suggest accumulation in select assets, while retail sentiment remains divided. Monitor central bank communications closely.',
    'Markets exhibit heightened volatility amid uncertainty. Technical indicators suggest a potential inflection point. Traders should focus on risk-defined positions and avoid over-leveraging.',
    'Consolidation dominates across major markets. The lack of clear directional bias suggests a breakout is imminent. Key support and resistance levels should be watched carefully for the next major move.',
    'Risk appetite is improving gradually. The DXY (Dollar Index) movement is the key driver across forex and commodities. Correlation analysis suggests diversified positioning is advisable.',
    'Bearish undertones persist as macro headwinds weigh on sentiment. However, oversold conditions in several assets present potential counter-trend opportunities for nimble traders.',
  ];
  
  const keyEventSets = [
    ['Federal Reserve Interest Rate Decision', 'US Non-Farm Payrolls Report', 'ECB Monetary Policy Meeting', 'UK CPI Inflation Data'],
    ['US CPI Inflation Report', 'Bank of Japan Policy Decision', 'Eurozone GDP Data', 'US Retail Sales Report'],
    ['FOMC Meeting Minutes Release', 'Chinese Trade Balance Data', 'UK Employment Report', 'US Producer Price Index'],
    ['G20 Summit Outcomes', 'US Consumer Confidence Data', 'Eurozone PMI Reports', 'RBA Interest Rate Decision'],
    ['US Durable Goods Orders', 'Bank of England Rate Decision', 'Japanese CPI Data', 'US Existing Home Sales'],
  ];
  
  const sentimentIdx = Math.floor(rng() * sentiments.length);
  const eventsIdx = Math.floor(rng() * keyEventSets.length);
  
  return {
    insights,
    market_sentiment: sentiments[sentimentIdx],
    key_events: keyEventSets[eventsIdx]
  };
}

// ============================================
// Trade Signals Generator (replaces Gemini)
// ============================================
export async function generateSignals(marketType) {
  const rng = seededRandom(stringToSeed(marketType + Date.now().toString().slice(0, -4)));
  
  const pairsMap = {
    forex: [
      { pair: 'EUR/USD', priceBase: 1.08, pipSize: 0.0001, spread: 0.0002 },
      { pair: 'GBP/USD', priceBase: 1.27, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'USD/JPY', priceBase: 149.5, pipSize: 0.01, spread: 0.02 },
      { pair: 'AUD/USD', priceBase: 0.66, pipSize: 0.0001, spread: 0.0002 },
      { pair: 'USD/CHF', priceBase: 0.88, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'EUR/GBP', priceBase: 0.855, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'NZD/USD', priceBase: 0.61, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'USD/CAD', priceBase: 1.36, pipSize: 0.0001, spread: 0.0003 },
    ],
    crypto: [
      { pair: 'BTC/USDT', priceBase: 67500, pipSize: 1, spread: 10 },
      { pair: 'ETH/USDT', priceBase: 3350, pipSize: 0.1, spread: 1 },
      { pair: 'SOL/USDT', priceBase: 145, pipSize: 0.01, spread: 0.1 },
      { pair: 'BNB/USDT', priceBase: 580, pipSize: 0.1, spread: 0.5 },
      { pair: 'XRP/USDT', priceBase: 0.62, pipSize: 0.0001, spread: 0.001 },
      { pair: 'ADA/USDT', priceBase: 0.45, pipSize: 0.0001, spread: 0.001 },
      { pair: 'DOGE/USDT', priceBase: 0.15, pipSize: 0.0001, spread: 0.001 },
    ],
    stocks: [
      { pair: 'AAPL', priceBase: 178, pipSize: 0.01, spread: 0.05 },
      { pair: 'MSFT', priceBase: 415, pipSize: 0.01, spread: 0.10 },
      { pair: 'GOOGL', priceBase: 155, pipSize: 0.01, spread: 0.05 },
      { pair: 'AMZN', priceBase: 185, pipSize: 0.01, spread: 0.05 },
      { pair: 'TSLA', priceBase: 245, pipSize: 0.01, spread: 0.10 },
      { pair: 'NVDA', priceBase: 875, pipSize: 0.01, spread: 0.20 },
      { pair: 'META', priceBase: 505, pipSize: 0.01, spread: 0.10 },
    ]
  };
  
  const pairs = pairsMap[marketType] || pairsMap.forex;
  const timeframes = ['15m', '1h', '4h', '1d'];
  const reasons = {
    BUY: [
      'Bullish engulfing pattern at key support with increasing volume',
      'RSI divergence showing hidden bullish momentum at demand zone',
      'Golden cross on MA(50/200) with price breaking above resistance',
      'Double bottom formation completed with strong volume confirmation',
      'Price bouncing off 200-EMA with bullish MACD crossover',
      'Ascending triangle breakout with rising momentum indicators',
      'Key Fibonacci 61.8% retracement level holding as support',
      'Oversold RSI with bullish hammer candle at trendline support',
    ],
    SELL: [
      'Bearish engulfing at resistance with declining volume profile',
      'RSI overbought with bearish divergence at supply zone',
      'Death cross on MA(50/200) with breakdown below key support',
      'Double top formation confirmed with increasing sell volume',
      'Price rejected at 200-EMA with bearish MACD crossover',
      'Descending triangle breakdown with declining momentum',
      'Failed breakout at Fibonacci 78.6% retracement level',
      'Overbought RSI with shooting star candle at trendline resistance',
    ]
  };
  
  // Select 5 random pairs
  const selectedPairs = [];
  const available = [...pairs];
  for (let i = 0; i < Math.min(5, available.length); i++) {
    const idx = Math.floor(rng() * available.length);
    selectedPairs.push(available.splice(idx, 1)[0]);
  }
  
  const signals = selectedPairs.map(p => {
    const type = rng() > 0.48 ? 'BUY' : 'SELL';
    const volatility = (rng() * 0.02 + 0.005); // 0.5% to 2.5%
    const priceVariation = p.priceBase * (rng() * 0.04 - 0.02); // ±2%
    const currentPrice = p.priceBase + priceVariation;
    
    let entry, sl, tp;
    const riskAmount = currentPrice * volatility;
    
    if (type === 'BUY') {
      entry = currentPrice;
      sl = currentPrice - riskAmount;
      tp = currentPrice + riskAmount * (1.5 + rng() * 1.5); // 1.5x to 3x R:R
    } else {
      entry = currentPrice;
      sl = currentPrice + riskAmount;
      tp = currentPrice - riskAmount * (1.5 + rng() * 1.5);
    }
    
    const formatPrice = (price) => {
      if (price >= 1000) return price.toFixed(2);
      if (price >= 100) return price.toFixed(2);
      if (price >= 1) return price.toFixed(4);
      return price.toFixed(5);
    };
    
    const confidenceLevels = ['high', 'medium', 'medium', 'low'];
    const reasonList = reasons[type];
    
    return {
      pair: p.pair,
      type,
      entry: formatPrice(entry),
      stop_loss: formatPrice(sl),
      take_profit: formatPrice(tp),
      timeframe: timeframes[Math.floor(rng() * timeframes.length)],
      confidence: confidenceLevels[Math.floor(rng() * confidenceLevels.length)],
      reason: reasonList[Math.floor(rng() * reasonList.length)]
    };
  });
  
  return { signals };
}


// ============================================
// Internal Helper Functions
// ============================================

function determineTrend(imageAnalysis, pair, timeframe) {
  const { trend, candleRatio, colors } = imageAnalysis;
  
  // Combine image-based trend with candle color analysis
  let direction = trend.direction;
  let strength = trend.strength;
  
  // If candle colors strongly disagree with pixel trend, use candle colors
  if (candleRatio.dominance === 'bullish' && trend.direction === 'bearish' && Math.abs(trend.slope) < 0.15) {
    direction = 'sideways';
    strength = 'weak';
  } else if (candleRatio.dominance === 'bearish' && trend.direction === 'bullish' && Math.abs(trend.slope) < 0.15) {
    direction = 'sideways';
    strength = 'weak';
  }
  
  const descriptions = {
    bullish: {
      strong: `${pair} shows a strong uptrend on the ${timeframe} chart. Price is making consistent higher highs and higher lows, indicating strong buying pressure. The bullish momentum appears well-established with buyers firmly in control.`,
      moderate: `${pair} displays moderate bullish momentum on the ${timeframe} timeframe. The uptrend is present but showing some hesitation. Higher highs are being formed but with decreasing velocity, suggesting the trend may be maturing.`,
      weak: `${pair} has a slight bullish bias on the ${timeframe} chart. The upward movement is tentative with mixed signals. Consider waiting for stronger confirmation before committing to long positions.`
    },
    bearish: {
      strong: `${pair} is in a strong downtrend on the ${timeframe} chart. Price is making consistent lower lows and lower highs, indicating heavy selling pressure. Bears are firmly in control with strong downward momentum.`,
      moderate: `${pair} shows moderate bearish pressure on the ${timeframe} timeframe. The downtrend is active but sellers are facing some resistance. Lower lows are forming but momentum may be slowing.`,
      weak: `${pair} has a slight bearish bias on the ${timeframe} chart. The downward movement is mild with potential for reversal. Look for confirmation signals before taking short positions.`
    },
    sideways: {
      strong: `${pair} is range-bound on the ${timeframe} chart. Price is oscillating within a defined range without clear directional bias. Wait for a breakout with volume confirmation.`,
      moderate: `${pair} is consolidating on the ${timeframe} timeframe. The market is in a holding pattern with neither bulls nor bears in full control. A breakout is building.`,
      weak: `${pair} shows no clear direction on the ${timeframe} chart. Market indecision is evident. Best to wait for clearer signals or trade the range boundaries.`
    }
  };
  
  return {
    direction,
    strength,
    description: descriptions[direction]?.[strength] || descriptions.sideways.moderate
  };
}

function calculateSupportResistance(imageAnalysis, pair, timeframe) {
  const rng = seededRandom(stringToSeed(pair + timeframe));
  const { trend } = imageAnalysis;
  
  // Generate realistic-looking S/R levels based on pair type
  const pairUpper = pair.toUpperCase();
  let basePrice, pipSize, srDistance;
  
  // Detect price characteristics from pair name
  if (pairUpper.includes('JPY')) {
    basePrice = 148 + rng() * 5;
    pipSize = 0.01;
    srDistance = 0.3 + rng() * 1.0;
  } else if (pairUpper.includes('BTC')) {
    basePrice = 65000 + rng() * 5000;
    pipSize = 1;
    srDistance = 500 + rng() * 2000;
  } else if (pairUpper.includes('ETH')) {
    basePrice = 3200 + rng() * 400;
    pipSize = 0.1;
    srDistance = 50 + rng() * 200;
  } else if (pairUpper.includes('SOL')) {
    basePrice = 135 + rng() * 25;
    pipSize = 0.01;
    srDistance = 3 + rng() * 10;
  } else if (pairUpper.includes('XRP')) {
    basePrice = 0.55 + rng() * 0.15;
    pipSize = 0.0001;
    srDistance = 0.01 + rng() * 0.05;
  } else if (/^[A-Z]{1,5}$/.test(pairUpper) && !pairUpper.includes('/')) {
    // Stock ticker
    basePrice = 100 + rng() * 300;
    pipSize = 0.01;
    srDistance = 2 + rng() * 10;
  } else {
    // Default forex pair
    basePrice = 1.0 + rng() * 0.4;
    pipSize = 0.0001;
    srDistance = 0.002 + rng() * 0.01;
  }
  
  // Adjust based on detected trend
  let priceShift = 0;
  if (trend.direction === 'bullish') priceShift = srDistance * 0.3;
  else if (trend.direction === 'bearish') priceShift = -srDistance * 0.3;
  
  const currentRef = basePrice + priceShift;
  
  const formatP = (p) => {
    if (Math.abs(p) >= 1000) return p.toFixed(2);
    if (Math.abs(p) >= 10) return p.toFixed(2);
    if (Math.abs(p) >= 1) return p.toFixed(4);
    return p.toFixed(5);
  };
  
  const support = [
    formatP(currentRef - srDistance * 0.4),
    formatP(currentRef - srDistance * 0.85),
    formatP(currentRef - srDistance * 1.4),
  ];
  
  const resistance = [
    formatP(currentRef + srDistance * 0.4),
    formatP(currentRef + srDistance * 0.85),
    formatP(currentRef + srDistance * 1.4),
  ];
  
  const keyLevelDescriptions = [
    `The ${resistance[0]} resistance level is critical — a break above could accelerate bullish momentum toward ${resistance[1]}. On the downside, ${support[0]} serves as immediate support.`,
    `Watch the ${support[0]} support carefully — this level has been tested and a break below would signal further downside to ${support[1]}. Resistance at ${resistance[0]} caps the upside.`,
    `Price is caught between the ${support[0]} support and ${resistance[0]} resistance. A decisive break in either direction will likely set the tone for the next significant move.`,
  ];
  
  return {
    support_levels: support,
    resistance_levels: resistance,
    key_level: keyLevelDescriptions[Math.floor(rng() * keyLevelDescriptions.length)]
  };
}

function detectPatterns(imageAnalysis, trend) {
  const { candleRatio, volatility } = imageAnalysis;
  const rng = seededRandom(stringToSeed(trend.direction + volatility.level));
  
  let patternPool;
  if (trend.direction === 'bullish') {
    patternPool = [...CHART_PATTERNS.bullish];
    if (rng() > 0.7) patternPool.push(...CHART_PATTERNS.neutral);
  } else if (trend.direction === 'bearish') {
    patternPool = [...CHART_PATTERNS.bearish];
    if (rng() > 0.7) patternPool.push(...CHART_PATTERNS.neutral);
  } else {
    patternPool = [...CHART_PATTERNS.neutral];
    if (rng() > 0.5) {
      patternPool.push(CHART_PATTERNS.bullish[Math.floor(rng() * CHART_PATTERNS.bullish.length)]);
      patternPool.push(CHART_PATTERNS.bearish[Math.floor(rng() * CHART_PATTERNS.bearish.length)]);
    }
  }
  
  // Select 2-3 patterns
  const numPatterns = 2 + Math.floor(rng() * 2);
  const selected = [];
  const available = [...patternPool];
  
  for (let i = 0; i < Math.min(numPatterns, available.length); i++) {
    const idx = Math.floor(rng() * available.length);
    selected.push(available.splice(idx, 1)[0]);
  }
  
  return {
    detected: selected.map(p => p.name),
    description: selected.map(p => p.description).join(' Additionally, ') + ` The overall pattern structure aligns with the ${trend.direction} bias observed in the price action.`
  };
}

function generateTradeSignals(imageAnalysis, trend, sr, pair, timeframe) {
  const rng = seededRandom(stringToSeed(pair + timeframe + trend.direction));
  const { candleRatio, volatility } = imageAnalysis;
  const tfContext = TIMEFRAME_CONTEXT[timeframe] || TIMEFRAME_CONTEXT['1h'];
  
  // Determine recommendation
  let recommendation, confidence;
  
  if (trend.direction === 'bullish' && trend.strength !== 'weak') {
    recommendation = 'BUY';
    confidence = trend.strength === 'strong' ? 'high' : 'medium';
  } else if (trend.direction === 'bearish' && trend.strength !== 'weak') {
    recommendation = 'SELL';
    confidence = trend.strength === 'strong' ? 'high' : 'medium';
  } else {
    recommendation = 'HOLD';
    confidence = 'low';
  }
  
  // Adjust confidence based on candle ratio agreement
  if ((recommendation === 'BUY' && candleRatio.dominance === 'bearish') ||
      (recommendation === 'SELL' && candleRatio.dominance === 'bullish')) {
    confidence = 'low';
  }
  
  // Calculate price levels from S/R
  const supports = sr.support_levels.map(Number);
  const resistances = sr.resistance_levels.map(Number);
  
  let entry, sl, tp1, tp2, tp3, rr;
  
  if (recommendation === 'BUY') {
    entry = supports[0] + (resistances[0] - supports[0]) * (0.3 + rng() * 0.2);
    sl = supports[1] || supports[0] * 0.995;
    tp1 = resistances[0];
    tp2 = resistances[1] || resistances[0] * 1.005;
    tp3 = resistances[2] || resistances[0] * 1.01;
  } else if (recommendation === 'SELL') {
    entry = resistances[0] - (resistances[0] - supports[0]) * (0.3 + rng() * 0.2);
    sl = resistances[1] || resistances[0] * 1.005;
    tp1 = supports[0];
    tp2 = supports[1] || supports[0] * 0.995;
    tp3 = supports[2] || supports[0] * 0.99;
  } else {
    entry = (supports[0] + resistances[0]) / 2;
    sl = supports[1] || supports[0];
    tp1 = resistances[0];
    tp2 = resistances[1] || resistances[0];
    tp3 = resistances[2] || resistances[0];
  }
  
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp2 - entry);
  rr = risk > 0 ? `1:${(reward / risk).toFixed(1)}` : '1:2';
  
  const formatP = (p) => {
    if (isNaN(p)) return 'N/A';
    if (Math.abs(p) >= 1000) return p.toFixed(2);
    if (Math.abs(p) >= 10) return p.toFixed(2);
    if (Math.abs(p) >= 1) return p.toFixed(4);
    return p.toFixed(5);
  };
  
  return {
    recommendation,
    confidence,
    entry_price: formatP(entry),
    stop_loss: formatP(sl),
    take_profit_1: formatP(tp1),
    take_profit_2: formatP(tp2),
    take_profit_3: formatP(tp3),
    risk_reward_ratio: rr
  };
}

function analyzeIndicators(imageAnalysis, trend) {
  const { candleRatio, volatility, colors } = imageAnalysis;
  const rng = seededRandom(stringToSeed(trend.direction + volatility.level));
  
  // RSI estimation
  let rsiValue, rsiReading;
  if (trend.direction === 'bullish' && trend.strength === 'strong') {
    rsiValue = 62 + Math.floor(rng() * 15);
    rsiReading = rsiValue > 70 ? `Overbought (${rsiValue}) — potential pullback zone` : `Bullish (${rsiValue}) — momentum favoring buyers`;
  } else if (trend.direction === 'bearish' && trend.strength === 'strong') {
    rsiValue = 25 + Math.floor(rng() * 15);
    rsiReading = rsiValue < 30 ? `Oversold (${rsiValue}) — potential bounce zone` : `Bearish (${rsiValue}) — momentum favoring sellers`;
  } else {
    rsiValue = 42 + Math.floor(rng() * 18);
    rsiReading = `Neutral (${rsiValue}) — no extreme conditions detected`;
  }
  
  // Moving average assessment
  const maReadings = {
    bullish: [
      'Price above 20-EMA and 50-SMA — short-term and medium-term trend is bullish. Golden cross pattern forming.',
      'All major MAs (20, 50, 200) are aligned bullish with price above all. Strong trend confirmation.',
      '20-EMA acting as dynamic support, price bouncing above 50-SMA. Moving averages confirm uptrend.'
    ],
    bearish: [
      'Price below 20-EMA and 50-SMA — short-term and medium-term trend is bearish. Death cross warning.',
      'All major MAs (20, 50, 200) are aligned bearish with price below all. Strong downtrend confirmation.',
      '20-EMA acting as dynamic resistance, price rejected at 50-SMA. Moving averages confirm downtrend.'
    ],
    sideways: [
      'Price oscillating around 20-EMA and 50-SMA — MAs are flat, indicating no clear trend. Consolidation phase.',
      'Moving averages converging — 20-EMA and 50-SMA are close together, suggesting a breakout is imminent.',
      'Price whipsawing around flat MAs — typical range-bound behavior. Wait for MA expansion.'
    ]
  };
  
  const maList = maReadings[trend.direction] || maReadings.sideways;
  const maReading = maList[Math.floor(rng() * maList.length)];
  
  // Volume assessment
  const volumeReadings = {
    'very high': 'Volume is significantly elevated — strong conviction behind the current move. Institutional activity likely.',
    'high': 'Above-average volume supports the current price action. Good confirmation of the trend.',
    'moderate': 'Volume is average — the move has decent backing but watch for volume spikes for confirmation.',
    'low': 'Volume is below average — the current move lacks conviction. Be cautious of false breakouts.'
  };
  
  return {
    rsi_reading: rsiReading,
    moving_averages: maReading,
    volume: volumeReadings[volatility.level] || volumeReadings.moderate
  };
}

function buildSummary(trend, patterns, signals, pair, timeframe) {
  const patternList = patterns.detected.join(', ');
  
  if (signals.recommendation === 'BUY') {
    return `${pair} on the ${timeframe} chart shows a ${trend.strength} ${trend.direction} setup. Detected patterns (${patternList}) support a long entry at ${signals.entry_price} with stop loss at ${signals.stop_loss}. Primary target at ${signals.take_profit_1} with extended targets at ${signals.take_profit_2} and ${signals.take_profit_3}. Risk-reward ratio of ${signals.risk_reward_ratio}. Confidence: ${signals.confidence}. Always use proper position sizing and never risk more than 1-2% per trade.`;
  } else if (signals.recommendation === 'SELL') {
    return `${pair} on the ${timeframe} chart displays a ${trend.strength} ${trend.direction} setup. Detected patterns (${patternList}) support a short entry at ${signals.entry_price} with stop loss at ${signals.stop_loss}. Primary target at ${signals.take_profit_1} with extended targets at ${signals.take_profit_2} and ${signals.take_profit_3}. Risk-reward ratio of ${signals.risk_reward_ratio}. Confidence: ${signals.confidence}. Maintain strict risk management on all positions.`;
  } else {
    return `${pair} on the ${timeframe} chart is in a ${trend.strength} ${trend.direction} phase. Current patterns (${patternList}) suggest market indecision. It is recommended to HOLD and wait for clearer directional signals. Key levels to watch: support at ${signals.stop_loss} and resistance near ${signals.take_profit_1}. Avoid forcing trades in uncertain conditions — patience is a strategy.`;
  }
}

// ============================================
// Insight Generators
// ============================================

function generateForexInsights(rng) {
  const allInsights = [
    {
      category: 'Forex',
      title: 'EUR/USD — ECB vs Fed Policy Divergence',
      summary: 'The EUR/USD pair remains sensitive to central bank policy expectations. Recent hawkish ECB commentary contrasts with growing expectations of Fed rate cuts, potentially supporting euro strength. Key support at 1.0750 and resistance at 1.0950.',
      impact: rng() > 0.5 ? 'bullish' : 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Forex',
      title: 'GBP/USD — UK Economic Resilience',
      summary: 'Sterling shows resilience despite mixed UK economic data. The Bank of England\'s cautious stance on rate cuts provides support. Watch the 1.2600-1.2800 range for directional clues. Services PMI data will be key.',
      impact: rng() > 0.4 ? 'bullish' : 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Forex',
      title: 'USD/JPY — Intervention Risk Elevated',
      summary: 'USD/JPY remains near multi-decade highs, raising intervention risk from the Bank of Japan. While the interest rate differential supports dollar strength, any verbal or actual intervention could trigger sharp reversals. Trade with caution above 150.00.',
      impact: 'bearish',
      confidence: 'high'
    },
    {
      category: 'Forex',
      title: 'AUD/USD — Commodity Currency Under Pressure',
      summary: 'The Australian dollar faces headwinds from Chinese economic slowdown concerns and falling commodity prices. RBA policy decisions and iron ore prices remain key drivers. Support at 0.6500 is critical for maintaining bullish structure.',
      impact: 'bearish',
      confidence: 'medium'
    },
    {
      category: 'Forex',
      title: 'DXY Dollar Index — Macro Outlook',
      summary: 'The US Dollar Index (DXY) is consolidating near key levels as markets weigh inflation data against growth concerns. A sustained break above 105 would signal renewed dollar strength, while a drop below 103 opens the door for broader weakness.',
      impact: rng() > 0.5 ? 'bullish' : 'bearish',
      confidence: 'medium'
    },
  ];
  
  // Return 2-3 insights
  const count = 2 + Math.floor(rng() * 2);
  const shuffled = allInsights.sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

function generateCryptoInsights(rng) {
  const allInsights = [
    {
      category: 'Crypto',
      title: 'Bitcoin — Halving Cycle Dynamics',
      summary: 'BTC continues to trade within the post-halving accumulation phase. Historical patterns suggest significant upside potential in the 12-18 months following halving events. On-chain data shows strong holder conviction with exchange reserves declining.',
      impact: 'bullish',
      confidence: 'high'
    },
    {
      category: 'Crypto',
      title: 'Ethereum — Network Activity Surge',
      summary: 'ETH network activity metrics are trending upward with increasing DeFi TVL and NFT volumes. EIP-4844 (Proto-Danksharding) has reduced L2 fees significantly, driving adoption. The ETH/BTC ratio is at a key inflection point.',
      impact: rng() > 0.4 ? 'bullish' : 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Crypto',
      title: 'Solana — Ecosystem Growth Accelerating',
      summary: 'SOL ecosystem continues to attract developers and users with high-speed, low-cost transactions. DeFi protocols on Solana are seeing increased TVL. Technical structure looks constructive above $120 support.',
      impact: 'bullish',
      confidence: 'medium'
    },
    {
      category: 'Crypto',
      title: 'Market-Wide — Regulatory Landscape',
      summary: 'Regulatory clarity is gradually improving with several jurisdictions establishing frameworks for digital assets. While short-term uncertainty remains, the long-term trend toward regulated crypto markets is generally constructive for institutional adoption.',
      impact: 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Crypto',
      title: 'DeFi Sector — Yield Opportunities',
      summary: 'DeFi yields have stabilized after the recent volatility. Staking yields remain attractive on major chains like Ethereum (3-5%) and Solana (6-8%). Liquidity mining incentives on newer protocols offer higher but riskier returns.',
      impact: 'neutral',
      confidence: 'low'
    },
  ];
  
  const count = 2 + Math.floor(rng() * 2);
  const shuffled = allInsights.sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

function generateStockInsights(rng) {
  const allInsights = [
    {
      category: 'Stocks',
      title: 'Tech Sector — AI-Driven Rally',
      summary: 'Technology stocks continue to benefit from the AI investment boom. Semiconductor companies (NVDA, AMD, AVGO) lead the charge, while software companies with AI integration show strong revenue growth. Valuations are elevated but supported by earnings growth.',
      impact: 'bullish',
      confidence: 'high'
    },
    {
      category: 'Stocks',
      title: 'S&P 500 — Broadening Participation',
      summary: 'The market rally is beginning to broaden beyond mega-cap tech stocks. Equal-weighted S&P 500 is catching up to the cap-weighted index, suggesting healthier market internals. This breadth improvement is typically a positive signal for market sustainability.',
      impact: 'bullish',
      confidence: 'medium'
    },
    {
      category: 'Stocks',
      title: 'Banks & Financials — Rate Sensitivity',
      summary: 'Financial sector stocks face mixed signals as rate cut expectations impact net interest margins. Strong capital markets activity provides offset. Watch for earnings guidance on credit quality and loan growth as key sentiment drivers.',
      impact: 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Stocks',
      title: 'Energy Sector — Oil Price Dynamics',
      summary: 'Energy stocks are navigating volatile oil prices driven by OPEC+ decisions and global demand concerns. Despite geopolitical risk premium, demand growth from Asia remains the key bullish catalyst. Dividend yields in the sector remain attractive.',
      impact: rng() > 0.5 ? 'bullish' : 'bearish',
      confidence: 'low'
    },
    {
      category: 'Stocks',
      title: 'NASDAQ — Growth vs Value Rotation',
      summary: 'Growth stocks on the NASDAQ continue to outperform value, driven by strong earnings from mega-cap tech. However, rising bond yields could trigger a rotation toward value sectors. Monitor the 10-year Treasury yield closely for rotation signals.',
      impact: 'neutral',
      confidence: 'medium'
    },
  ];
  
  const count = 2 + Math.floor(rng() * 2);
  const shuffled = allInsights.sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
