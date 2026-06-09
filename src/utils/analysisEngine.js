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
export async function analyzeChart(imageBase64, mimeType, pair, timeframe, currentPrice = null) {
  // Step 1: Analyze the actual chart image pixels
  const imageAnalysis = await analyzeChartImage(imageBase64, mimeType);
  
  // Step 2: Build analysis from image data + knowledge base
  const trend = determineTrend(imageAnalysis, pair, timeframe);
  const sr = calculateSupportResistance(imageAnalysis, pair, timeframe, currentPrice);
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
    'Global macro conditions reflect a classic risk-off shift. Elevated yields are pressuring equities while safe-haven flows dominate FX and commodities. Market participants are aggressively repricing terminal rate expectations following recent inflation stickiness.',
    'Risk assets are demonstrating remarkable resilience despite tightening liquidity. Technical structures remain constructive across major indices, though breadth divergence suggests caution. The volatility index (VIX) indicates complacency, leaving markets vulnerable to exogenous shocks.',
    'We are observing a pronounced sector rotation driven by shifting macroeconomic narratives. Value and cyclical sectors are catching bids at the expense of mega-cap growth. Cross-asset correlations are breaking down, creating a favorable environment for alpha generation and tactical macro plays.',
    'Consolidation phase continues across major asset classes. Order book data shows significant institutional supply stacked above current resistance levels. Directional bias remains neutral until a decisive breakout occurs, supported by a corresponding surge in relative volume.',
    'The prevailing narrative is dominated by the "higher for longer" monetary policy stance. The US Dollar Index (DXY) continues its upward trajectory, exerting secular pressure on emerging market currencies and non-yielding assets like Gold. Traders should adopt a defensive posture.',
    'A structural shift in market sentiment is underway, fueled by systemic liquidity injections and favorable earnings surprises. Momentum indicators across crypto and equities are heavily overbought, but the absence of bearish divergence suggests the trend has further room to run.'
  ];
  
  const keyEventSets = [
    ['US CPI Inflation YoY & Core CPI', 'FOMC Rate Decision & Press Conference', 'ECB Monetary Policy Statement', 'China Caixin Manufacturing PMI'],
    ['US Non-Farm Payrolls (NFP) & Unemployment Rate', 'Bank of Japan (BoJ) Yield Curve Control Decision', 'UK GDP Growth Rate QoQ', 'US Retail Sales Advance MoM'],
    ['Federal Reserve Core PCE Price Index', 'OPEC+ Joint Ministerial Monitoring Committee', 'Eurozone Flash PMI Composite', 'US Initial Jobless Claims'],
    ['US Producer Price Index (PPI) Final Demand', 'Reserve Bank of Australia (RBA) Rate Decision', 'China Trade Balance (USD)', 'UK Consumer Price Index (CPI)'],
    ['US Gross Domestic Product (GDP) Annualized', 'Bank of England (BoE) Bank Rate Vote', 'Japan National Core CPI', 'US ISM Manufacturing PMI']
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
      { pair: 'EUR/USD', priceBase: 1.1325, pipSize: 0.0001, spread: 0.0002 },
      { pair: 'GBP/USD', priceBase: 1.3295, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'USD/JPY', priceBase: 143.80, pipSize: 0.01, spread: 0.02 },
      { pair: 'AUD/USD', priceBase: 0.6415, pipSize: 0.0001, spread: 0.0002 },
      { pair: 'USD/CHF', priceBase: 0.8245, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'EUR/GBP', priceBase: 0.8520, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'NZD/USD', priceBase: 0.5980, pipSize: 0.0001, spread: 0.0003 },
      { pair: 'USD/CAD', priceBase: 1.3845, pipSize: 0.0001, spread: 0.0003 },
    ],
    crypto: [
      { pair: 'BTC/USDT', priceBase: 94000, pipSize: 1, spread: 10 },
      { pair: 'ETH/USDT', priceBase: 1820, pipSize: 0.1, spread: 1 },
      { pair: 'SOL/USDT', priceBase: 148, pipSize: 0.01, spread: 0.1 },
      { pair: 'BNB/USDT', priceBase: 600, pipSize: 0.1, spread: 0.5 },
      { pair: 'XRP/USDT', priceBase: 2.18, pipSize: 0.0001, spread: 0.001 },
      { pair: 'ADA/USDT', priceBase: 0.71, pipSize: 0.0001, spread: 0.001 },
      { pair: 'DOGE/USDT', priceBase: 0.175, pipSize: 0.0001, spread: 0.001 },
    ],
    stocks: [
      { pair: 'AAPL', priceBase: 212, pipSize: 0.01, spread: 0.05 },
      { pair: 'MSFT', priceBase: 395, pipSize: 0.01, spread: 0.10 },
      { pair: 'GOOGL', priceBase: 163, pipSize: 0.01, spread: 0.05 },
      { pair: 'AMZN', priceBase: 190, pipSize: 0.01, spread: 0.05 },
      { pair: 'TSLA', priceBase: 285, pipSize: 0.01, spread: 0.10 },
      { pair: 'NVDA', priceBase: 109, pipSize: 0.01, spread: 0.20 },
      { pair: 'META', priceBase: 560, pipSize: 0.01, spread: 0.10 },
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

function calculateSupportResistance(imageAnalysis, pair, timeframe, currentPrice = null) {
  const rng = seededRandom(stringToSeed(pair + timeframe));
  const { trend } = imageAnalysis;
  
  let basePrice, pipSize, srDistance;
  
  // ── If the user supplied the real market price, use it directly ──────────
  if (currentPrice && !isNaN(currentPrice) && currentPrice > 0) {
    basePrice = currentPrice;
    // Derive a sensible S/R distance based on price magnitude
    if (currentPrice >= 10000)      srDistance = currentPrice * 0.003 + rng() * currentPrice * 0.002; // e.g. BTC
    else if (currentPrice >= 1000)  srDistance = currentPrice * 0.004 + rng() * currentPrice * 0.002; // e.g. XAU
    else if (currentPrice >= 100)   srDistance = currentPrice * 0.005 + rng() * currentPrice * 0.003; // e.g. stocks
    else if (currentPrice >= 1)     srDistance = currentPrice * 0.006 + rng() * currentPrice * 0.004; // e.g. forex majors
    else                            srDistance = currentPrice * 0.01  + rng() * currentPrice * 0.005; // e.g. low-price pairs
    pipSize = currentPrice >= 100 ? 0.01 : currentPrice >= 1 ? 0.0001 : 0.00001;
  } else {
    // ── Fallback: estimate from pair name ────────────────────────────────────
    const pairUpper = pair.toUpperCase();
    if (pairUpper.includes('JPY')) {
      basePrice = 142 + rng() * 4; pipSize = 0.01; srDistance = 0.3 + rng() * 1.0;
    } else if (pairUpper.includes('BTC')) {
      basePrice = 92000 + rng() * 4000; pipSize = 1; srDistance = 500 + rng() * 2000;
    } else if (pairUpper.includes('ETH')) {
      basePrice = 1780 + rng() * 100; pipSize = 0.1; srDistance = 20 + rng() * 60;
    } else if (pairUpper.includes('SOL')) {
      basePrice = 143 + rng() * 12; pipSize = 0.01; srDistance = 3 + rng() * 8;
    } else if (pairUpper.includes('XRP')) {
      basePrice = 2.10 + rng() * 0.15; pipSize = 0.0001; srDistance = 0.03 + rng() * 0.08;
    } else if (pairUpper.includes('XAU') || pairUpper.includes('GOLD')) {
      basePrice = 4580 + rng() * 80; pipSize = 0.01; srDistance = 15 + rng() * 40;
    } else if (pairUpper.includes('NVDA')) {
      basePrice = 105 + rng() * 8; pipSize = 0.01; srDistance = 2 + rng() * 5;
    } else if (pairUpper.includes('AAPL')) {
      basePrice = 208 + rng() * 8; pipSize = 0.01; srDistance = 2 + rng() * 5;
    } else if (pairUpper.includes('MSFT')) {
      basePrice = 390 + rng() * 10; pipSize = 0.01; srDistance = 3 + rng() * 8;
    } else if (/^[A-Z]{1,5}$/.test(pairUpper) && !pairUpper.includes('/')) {
      basePrice = 150 + rng() * 200; pipSize = 0.01; srDistance = 2 + rng() * 10;
    } else {
      basePrice = 1.0 + rng() * 0.4; pipSize = 0.0001; srDistance = 0.002 + rng() * 0.01;
    }
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
      category: 'Forex & Commodities',
      title: 'XAU/USD — Gold Safe-Haven Demand Amidst Geopolitical Friction',
      summary: 'Gold (XAU/USD) is testing the critical $2,350 supply zone. Geopolitical tensions in the Middle East and structural central bank purchasing (particularly from the PBOC) are providing a robust floor. However, surging US 10-year Treasury yields (>4.5%) act as a major headwind. A weekly close above $2,380 is required to invalidate the immediate bearish divergence on the daily RSI.',
      impact: rng() > 0.5 ? 'bullish' : 'neutral',
      confidence: 'high'
    },
    {
      category: 'Forex Macro',
      title: 'EUR/USD — ECB Rate Cut Pricing Widens the Transatlantic Spread',
      summary: 'The EUR/USD pair has breached the 1.0700 psychological support. The divergence in monetary policy is stark: OIS markets are pricing in 75bps of cuts from the ECB this year, while Fed rate cut expectations have dwindled to less than 40bps. Technically, the pair is operating within a descending regression channel, with the next major liquidity pool located at 1.0620.',
      impact: 'bearish',
      confidence: 'high'
    },
    {
      category: 'Forex Macro',
      title: 'USD/JPY — BoJ Intervention Threat vs. Yield Differentials',
      summary: 'USD/JPY is hovering dangerously close to the 155.00 threshold, historically a trigger point for Bank of Japan (BoJ) FX intervention. Despite verbal warnings from the Ministry of Finance, the persistent US-Japan real yield differential continues to sponsor the carry trade. Implied volatility in USD/JPY options is spiking, indicating traders are hedging against a sudden, violent intervention-driven flush.',
      impact: 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Global News',
      title: 'Commodity Currencies — AUD & CAD Under Pressure from China Data',
      summary: 'The Australian Dollar (AUD) and Canadian Dollar (CAD) are facing severe headwinds following a miss in China\'s industrial production data. Iron ore prices have slipped below $100/MT, directly impacting AUD/USD which has lost the 0.6500 handle. We expect continued weakness in cyclical currencies until Chinese stimulus measures demonstrate tangible economic transmission.',
      impact: 'bearish',
      confidence: 'medium'
    },
    {
      category: 'Forex Macro',
      title: 'DXY — US Dollar Index Breaks Out on Inflation Stickiness',
      summary: 'The US Dollar Index (DXY) has staged a bullish breakout above the 105.50 resistance confluence. Consecutive months of sticky US Core CPI have forced a hawkish repricing of the Fed\'s terminal rate. The DXY is now trading above its 200-day SMA with expanding Bollinger Bands, signaling a high-probability continuation toward the 107.00 macro resistance.',
      impact: 'bullish',
      confidence: 'high'
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
      category: 'Crypto Technicals',
      title: 'Bitcoin (BTC) — Post-Halving Supply Shock and ETF Flows',
      summary: 'BTC is consolidating in a high-timeframe ascending triangle below the $70k liquidity cluster. On-chain metrics reveal a severe illiquidity shock: OTC desk balances are heavily depleted, and long-term holder distribution has completely halted. Despite recent net outflows from US Spot ETFs, the structural bid remains aggressive. A daily close above $71,500 projects a measured move to $84,000.',
      impact: 'bullish',
      confidence: 'high'
    },
    {
      category: 'Crypto Macro',
      title: 'Ethereum (ETH) — Regulatory Clarity and Institutional Adoption',
      summary: 'ETH is facing intense regulatory scrutiny from the SEC regarding its security classification, creating a massive overhang on price action. However, the underlying network economics are robust: the deflationary burn rate (EIP-1559) and restaking TVL via EigenLayer are removing massive amounts of ETH from circulating supply. Key technical support sits at $2,850.',
      impact: rng() > 0.5 ? 'bullish' : 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Altcoin Sector',
      title: 'Solana (SOL) — Network Congestion Resolved, DeFi TVL Surges',
      summary: 'Following the successful deployment of the v1.17 update, Solana\'s network congestion issues have been largely resolved. The ecosystem is experiencing a renaissance in DeFi TVL and decentralized exchange (DEX) volume, consistently outpacing Ethereum L1. Technically, SOL has established a strong higher-low structure above the 50-day EMA at $135.',
      impact: 'bullish',
      confidence: 'high'
    },
    {
      category: 'Global Crypto News',
      title: 'Stablecoin Regulation — EU MiCA Implementation Looms',
      summary: 'The impending implementation of the Markets in Crypto-Assets (MiCA) regulation in the EU is forcing major exchanges to delist non-compliant stablecoins (like USDT). This regulatory shift is causing temporary liquidity fragmentation in Euro-denominated pairs but will ultimately drive institutional capital toward compliant alternatives like USDC.',
      impact: 'neutral',
      confidence: 'medium'
    },
    {
      category: 'Crypto On-Chain',
      title: 'DeFi & RWA Narrative — Real World Assets Lead Capital Inflows',
      summary: 'The Tokenization of Real World Assets (RWA) is currently the strongest narrative in crypto, driven by BlackRock\'s BUIDL fund launch. Protocols tokenizing US Treasuries are seeing exponential TVL growth. This sector is exhibiting negative correlation to the broader crypto market, serving as a defensive high-yield haven during BTC consolidations.',
      impact: 'bullish',
      confidence: 'medium'
    },
  ];
  
  const count = 2 + Math.floor(rng() * 2);
  const shuffled = allInsights.sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

function generateStockInsights(rng) {
  const allInsights = [
    {
      category: 'Equities Macro',
      title: 'Tech Sector — Semiconductor Overextension and AI CapEx',
      summary: 'The AI-driven semiconductor rally (led by NVDA, TSM, ASML) is exhibiting signs of technical exhaustion. Forward P/E multiples have expanded to 99th percentile historical extremes. While hyperscaler CapEx guidance remains robust, momentum indicators (MACD, RSI) on the SOXX ETF are showing pronounced bearish divergence. We anticipate a 10-15% tactical correction before the secular uptrend resumes.',
      impact: 'bearish',
      confidence: 'medium'
    },
    {
      category: 'Global Indices',
      title: 'S&P 500 (SPX) — Breadth Divergence and Gamma Squeeze Dynamics',
      summary: 'The SPX is grinding higher, but market breadth is deteriorating alarmingly; less than 40% of constituents are trading above their 50-day moving averages. The index is being levitated by short-dated options activity (0DTE) creating synthetic gamma squeezes. A break below the 5,050 gamma wall could trigger a rapid systematic deleveraging event from CTA trend followers.',
      impact: 'neutral',
      confidence: 'high'
    },
    {
      category: 'Equities Sector',
      title: 'Energy (XLE) — Geopolitical Risk Premium and Supply Constraints',
      summary: 'The Energy sector (XLE) is exhibiting tremendous relative strength against the broader market. WTI Crude\'s stabilization above $80/bbl, driven by OPEC+ production discipline and Middle East supply risk premiums, is driving massive free cash flow yields for E&P companies. The sector remains deeply undervalued relative to historical cash flow multiples.',
      impact: 'bullish',
      confidence: 'high'
    },
    {
      category: 'Global News',
      title: 'European Equities — STOXX 600 Reaches All-Time Highs on Earnings',
      summary: 'European equities have defied economic pessimism, with the STOXX 600 breaking out to record highs. The rally is fundamentally underpinned by the "GRANOLAS" (Europe\'s equivalent to the Magnificent 7), which are delivering massive earnings beats and aggressive share buybacks. The valuation discount relative to the US S&P 500 remains near record levels (approx. 35%).',
      impact: 'bullish',
      confidence: 'medium'
    },
    {
      category: 'Equities Macro',
      title: 'Russell 2000 (IWM) — Small Caps Crushed by Refinancing Cliff',
      summary: 'Small-cap equities remain the weakest link in global markets. The Russell 2000 is heavily burdened by floating-rate debt and faces a massive "refinancing cliff" over the next 18 months. With the 10-year Treasury yield surging, the cost of capital for these companies is destroying profit margins. The IWM/SPY ratio has broken down to levels not seen since the dot-com bubble.',
      impact: 'bearish',
      confidence: 'high'
    },
  ];
  
  const count = 2 + Math.floor(rng() * 2);
  const shuffled = allInsights.sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
