// ============================================
// TradeVision AI — Built-in Knowledge Base
// Comprehensive forex/crypto/stock market intelligence
// ============================================

export const CHART_PATTERNS = {
  bullish: [
    { name: 'Double Bottom', description: 'Price tested support twice and bounced, indicating a potential reversal to the upside. This W-shaped pattern suggests buyers are stepping in at this level.', strength: 'strong' },
    { name: 'Inverse Head and Shoulders', description: 'A three-trough pattern with the middle trough being the deepest. This classic reversal pattern indicates the downtrend is losing momentum.', strength: 'strong' },
    { name: 'Bullish Flag', description: 'After a strong upward move, price consolidates in a small downward channel before continuing higher. The flag represents a brief pause in the uptrend.', strength: 'moderate' },
    { name: 'Ascending Triangle', description: 'Higher lows converging toward a flat resistance level. Buyers are becoming more aggressive, and a breakout above resistance is likely.', strength: 'moderate' },
    { name: 'Cup and Handle', description: 'A rounded bottom followed by a small consolidation (handle). This pattern suggests accumulation and a potential breakout to the upside.', strength: 'strong' },
    { name: 'Bullish Engulfing', description: 'A large bullish candle completely engulfs the previous bearish candle, showing strong buying pressure overtaking sellers.', strength: 'moderate' },
    { name: 'Morning Star', description: 'A three-candle reversal pattern: bearish candle, small-bodied candle (indecision), then bullish candle. Signals potential bottom.', strength: 'moderate' },
    { name: 'Falling Wedge', description: 'Price makes lower highs and lower lows but converges. Despite the downward movement, this is typically a bullish reversal pattern.', strength: 'moderate' },
  ],
  bearish: [
    { name: 'Double Top', description: 'Price tested resistance twice and failed, indicating a potential reversal to the downside. This M-shaped pattern suggests sellers are defending this level.', strength: 'strong' },
    { name: 'Head and Shoulders', description: 'A three-peak pattern with the middle peak being the highest. This classic reversal pattern indicates the uptrend is exhausting.', strength: 'strong' },
    { name: 'Bearish Flag', description: 'After a strong downward move, price consolidates in a small upward channel before continuing lower. The flag represents a brief pause in the downtrend.', strength: 'moderate' },
    { name: 'Descending Triangle', description: 'Lower highs converging toward a flat support level. Sellers are becoming more aggressive, and a breakdown below support is likely.', strength: 'moderate' },
    { name: 'Bearish Engulfing', description: 'A large bearish candle completely engulfs the previous bullish candle, showing strong selling pressure overtaking buyers.', strength: 'moderate' },
    { name: 'Evening Star', description: 'A three-candle reversal pattern: bullish candle, small-bodied candle (indecision), then bearish candle. Signals potential top.', strength: 'moderate' },
    { name: 'Rising Wedge', description: 'Price makes higher highs and higher lows but converges. Despite the upward movement, this is typically a bearish reversal pattern.', strength: 'moderate' },
  ],
  neutral: [
    { name: 'Symmetrical Triangle', description: 'Price converges with lower highs and higher lows. This pattern shows indecision and can break in either direction.', strength: 'weak' },
    { name: 'Rectangle/Range', description: 'Price oscillates between horizontal support and resistance. The market is in consolidation, waiting for a catalyst.', strength: 'weak' },
    { name: 'Doji Formation', description: 'Candles with very small bodies indicate market indecision. Watch for the next candle to confirm direction.', strength: 'weak' },
  ]
};

export const INDICATOR_RULES = {
  rsi: {
    overbought: { threshold: 70, signal: 'bearish', description: 'RSI above 70 suggests the asset is overbought. A pullback or reversal may occur.' },
    oversold: { threshold: 30, signal: 'bullish', description: 'RSI below 30 suggests the asset is oversold. A bounce or reversal may occur.' },
    neutral: { description: 'RSI in the 40-60 range suggests no extreme conditions. Trend continuation is possible.' },
    divergence_bull: { description: 'Price making lower lows while RSI makes higher lows — bullish divergence, suggesting weakening downward momentum.' },
    divergence_bear: { description: 'Price making higher highs while RSI makes lower highs — bearish divergence, suggesting weakening upward momentum.' }
  },
  macd: {
    bullish_cross: { description: 'MACD line crossing above the signal line indicates bullish momentum. Consider long entries.' },
    bearish_cross: { description: 'MACD line crossing below the signal line indicates bearish momentum. Consider short entries or exits.' },
    histogram_growing: { description: 'MACD histogram bars growing indicate strengthening momentum in the current direction.' },
    histogram_shrinking: { description: 'MACD histogram bars shrinking indicate weakening momentum. A reversal may be approaching.' }
  },
  moving_averages: {
    golden_cross: { description: 'Short-term MA crossing above long-term MA (Golden Cross). Strong bullish signal for medium-term outlook.' },
    death_cross: { description: 'Short-term MA crossing below long-term MA (Death Cross). Strong bearish signal for medium-term outlook.' },
    price_above: { description: 'Price trading above key moving averages indicates bullish bias. MAs act as dynamic support.' },
    price_below: { description: 'Price trading below key moving averages indicates bearish bias. MAs act as dynamic resistance.' }
  },
  bollinger: {
    upper_touch: { description: 'Price touching upper Bollinger Band suggests potential overbought conditions or strong momentum.' },
    lower_touch: { description: 'Price touching lower Bollinger Band suggests potential oversold conditions or strong selling.' },
    squeeze: { description: 'Bollinger Bands narrowing (squeeze) indicates low volatility. A significant move is likely incoming.' }
  },
  volume: {
    high: { description: 'Above-average volume confirms the current price movement. Higher conviction in the trend.' },
    low: { description: 'Below-average volume suggests weak conviction. The move may not sustain.' },
    divergence: { description: 'Price moving in one direction while volume diverges suggests the move may be losing steam.' }
  }
};

export const TIMEFRAME_CONTEXT = {
  '1m': { type: 'scalping', noise: 'very high', suggestion: 'Suitable for scalping. Very noisy — use with tight stops and quick targets.' },
  '5m': { type: 'scalping', noise: 'high', suggestion: 'Good for scalping and intraday momentum plays. Confirm with higher timeframes.' },
  '15m': { type: 'intraday', noise: 'moderate', suggestion: 'Popular for intraday trading. Good balance between noise and signal clarity.' },
  '30m': { type: 'intraday', noise: 'moderate', suggestion: 'Solid intraday timeframe. Patterns are more reliable than lower timeframes.' },
  '1h': { type: 'swing-intraday', noise: 'low-moderate', suggestion: 'Excellent for intraday and short-term swing trades. Patterns and signals are fairly reliable.' },
  '4h': { type: 'swing', noise: 'low', suggestion: 'One of the most traded timeframes. Great for swing trading with clear pattern visibility.' },
  '1d': { type: 'position', noise: 'very low', suggestion: 'Best for position trading and trend identification. Highly reliable patterns and signals.' },
  '1w': { type: 'position', noise: 'minimal', suggestion: 'For long-term position trading. Signals are very reliable but require patience.' },
  '1M': { type: 'investment', noise: 'minimal', suggestion: 'For macro analysis and long-term investments. Use for market cycle identification.' }
};

export const MARKET_KNOWLEDGE = {
  forex: {
    majors: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD'],
    sessions: {
      london: { open: '08:00 GMT', close: '16:00 GMT', volatility: 'high', pairs: ['EUR/USD', 'GBP/USD', 'EUR/GBP'] },
      newyork: { open: '13:00 GMT', close: '21:00 GMT', volatility: 'high', pairs: ['EUR/USD', 'USD/CAD', 'USD/JPY'] },
      tokyo: { open: '00:00 GMT', close: '09:00 GMT', volatility: 'moderate', pairs: ['USD/JPY', 'AUD/USD', 'NZD/USD'] },
      overlap: { description: 'London-NY overlap (13:00-16:00 GMT) is the most volatile and liquid period.' }
    },
    tipicalSpreads: { major: '0.5-2 pips', minor: '2-5 pips', exotic: '5-50 pips' },
    keyFactors: [
      'Central bank interest rate decisions (Fed, ECB, BoE, BoJ)',
      'Non-Farm Payrolls (NFP) — first Friday of each month',
      'CPI/Inflation data releases',
      'GDP reports and economic growth data',
      'Geopolitical events and risk sentiment',
      'Trade balance and current account data'
    ]
  },
  crypto: {
    majors: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT'],
    characteristics: {
      volatility: 'Very high — 5-15% daily moves are common',
      trading: '24/7 market with no official close',
      correlation: 'Most altcoins highly correlated with BTC',
      weekends: 'Lower liquidity on weekends can cause sharp moves'
    },
    keyFactors: [
      'Bitcoin halving cycles and supply dynamics',
      'Regulatory news and government actions',
      'DeFi and ecosystem developments',
      'Whale wallet movements and on-chain data',
      'Macro risk sentiment (risk-on vs risk-off)',
      'Exchange listings and de-listings'
    ]
  },
  stocks: {
    indices: ['S&P 500', 'NASDAQ', 'DOW', 'FTSE 100', 'DAX', 'Nikkei 225'],
    characteristics: {
      hours: 'NYSE: 9:30-16:00 ET, Pre/After-market available',
      volatility: 'Moderate — earnings season increases volatility',
      correlation: 'Sector rotation and index correlation important'
    },
    keyFactors: [
      'Quarterly earnings reports and guidance',
      'Federal Reserve policy and interest rates',
      'Economic indicators (jobs, GDP, inflation)',
      'Sector rotation and fund flows',
      'Insider buying/selling activity',
      'Options expiration dates (triple/quad witching)'
    ]
  }
};

export const RISK_MANAGEMENT_RULES = {
  maxRiskPerTrade: '1-2% of account balance',
  riskRewardMinimum: '1:2 or better',
  stopLossRules: [
    'Always place a stop loss — no exceptions',
    'Place SL below recent swing low (for longs) or above swing high (for shorts)',
    'Account for spread when calculating SL distance',
    'Use ATR-based stops for volatile markets'
  ],
  positionSizing: 'Risk Amount ÷ (Entry - Stop Loss) = Position Size',
  correlationWarning: 'Avoid opening multiple positions in highly correlated pairs simultaneously'
};

// Seeded random for deterministic but varied results
export function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Generate a seed from string
export function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Add time-based component (changes every 5 minutes for variety)
  const timeBlock = Math.floor(Date.now() / 300000);
  return Math.abs(hash + timeBlock);
}
