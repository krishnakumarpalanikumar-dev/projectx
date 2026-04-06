// ============================================
// TradeVision AI — AI Chatbot Engine
// Rule-based trading assistant with context awareness
// ============================================

import { CHART_PATTERNS, INDICATOR_RULES, TIMEFRAME_CONTEXT, MARKET_KNOWLEDGE, RISK_MANAGEMENT_RULES, seededRandom, stringToSeed } from './knowledgeBase.js';

let currentAnalysis = null;
let chatHistory = [];

export function setChatAnalysis(analysis) {
  currentAnalysis = analysis;
}

export function getChatHistory() {
  return [...chatHistory];
}

export function clearChatHistory() {
  chatHistory = [];
}

/**
 * Process a user message and generate a response
 */
export function processMessage(userMessage) {
  const msg = userMessage.toLowerCase().trim();
  chatHistory.push({ role: 'user', text: userMessage, time: new Date() });

  let response;

  // Greeting patterns
  if (/^(hi|hello|hey|sup|yo|greetings|good\s*(morning|afternoon|evening))/.test(msg)) {
    response = "Hey! 👋 I'm your TradeVision AI assistant. I can help you with:\n\n• **Chart analysis** questions\n• **Trading strategies** and setups\n• **Risk management** advice\n• **Technical indicators** (RSI, MACD, MAs)\n• **Chart patterns** identification\n• **Position sizing** calculations\n\nWhat would you like to know?";
  }
  // Current analysis questions
  else if (currentAnalysis && (msg.includes('what do you see') || msg.includes('analysis') || msg.includes('what does the chart show') || msg.includes('summary') || msg.includes('tell me about'))) {
    response = buildAnalysisSummary();
  }
  // Should I buy/sell?
  else if (msg.includes('should i buy') || msg.includes('should i sell') || msg.includes('should i trade') || msg.includes('should i enter')) {
    response = buildTradeAdvice();
  }
  // Entry point
  else if (msg.includes('entry') || msg.includes('where to enter') || msg.includes('when to enter') || msg.includes('entry point') || msg.includes('entry price')) {
    response = buildEntryAdvice();
  }
  // Stop loss
  else if (msg.includes('stop loss') || msg.includes('stoploss') || msg.includes('sl') || msg.includes('where to put stop') || msg.includes('protect')) {
    response = buildStopLossAdvice();
  }
  // Take profit
  else if (msg.includes('take profit') || msg.includes('tp') || msg.includes('target') || msg.includes('where to take profit') || msg.includes('exit')) {
    response = buildTakeProfitAdvice();
  }
  // Risk management
  else if (msg.includes('risk') || msg.includes('position size') || msg.includes('lot size') || msg.includes('how much') || msg.includes('money management')) {
    response = buildRiskManagementAdvice();
  }
  // RSI
  else if (msg.includes('rsi')) {
    response = buildRSIExplanation();
  }
  // MACD
  else if (msg.includes('macd')) {
    response = buildMACDExplanation();
  }
  // Moving averages
  else if (msg.includes('moving average') || msg.includes(' ma ') || msg.includes('ema') || msg.includes('sma') || msg.includes('golden cross') || msg.includes('death cross')) {
    response = buildMAExplanation();
  }
  // Bollinger bands
  else if (msg.includes('bollinger') || msg.includes('bands')) {
    response = buildBollingerExplanation();
  }
  // Support resistance
  else if (msg.includes('support') || msg.includes('resistance') || msg.includes('s/r') || msg.includes('levels')) {
    response = buildSRExplanation();
  }
  // Chart patterns
  else if (msg.includes('pattern') || msg.includes('head and shoulder') || msg.includes('double top') || msg.includes('double bottom') || msg.includes('triangle') || msg.includes('flag') || msg.includes('wedge') || msg.includes('engulfing') || msg.includes('doji') || msg.includes('hammer') || msg.includes('candle') || msg.includes('candlestick')) {
    response = buildPatternExplanation(msg);
  }
  // Trend
  else if (msg.includes('trend') || msg.includes('direction') || msg.includes('bullish') || msg.includes('bearish')) {
    response = buildTrendExplanation();
  }
  // Timeframe
  else if (msg.includes('timeframe') || msg.includes('time frame') || msg.includes('which timeframe') || msg.includes('best timeframe')) {
    response = buildTimeframeAdvice();
  }
  // Forex specific
  else if (msg.includes('forex') || msg.includes('currency') || msg.includes('pip')) {
    response = buildForexInfo();
  }
  // Crypto specific
  else if (msg.includes('crypto') || msg.includes('bitcoin') || msg.includes('btc') || msg.includes('ethereum') || msg.includes('eth')) {
    response = buildCryptoInfo();
  }
  // Volume
  else if (msg.includes('volume')) {
    response = buildVolumeExplanation();
  }
  // Fibonacci
  else if (msg.includes('fibonacci') || msg.includes('fib') || msg.includes('retracement')) {
    response = buildFibonacciExplanation();
  }
  // Scalping
  else if (msg.includes('scalp') || msg.includes('scalping')) {
    response = "**Scalping Strategy Tips** ⚡\n\n• Use **1m to 5m** timeframes\n• Look for **high-volume** sessions (London/NY overlap)\n• Keep risk per trade very low (**0.5-1%**)\n• Use tight stop losses (**5-15 pips** in forex)\n• Target small, consistent profits (**3-10 pips**)\n• Focus on **major pairs** with low spreads\n• Use **EMA(9)** and **EMA(21)** for quick signals\n• **Avoid scalping** during news releases\n• Keep a minimum **1:1.5 risk-reward ratio**\n\n⚠️ Scalping requires intense focus and low-latency execution. It's not recommended for beginners.";
  }
  // Swing trading
  else if (msg.includes('swing')) {
    response = "**Swing Trading Guide** 📊\n\n• Use **4h to 1D** timeframes for entries\n• Hold positions for **2-10 days** typically\n• Look for **pullbacks to key levels** in trending markets\n• Use **MA(50)** and **MA(200)** for trend confirmation\n• Risk **1-2% per trade** max\n• Set wider stops (**50-150 pips** in forex)\n• Target **2:1 to 3:1 risk-reward**\n• Use **weekly charts** for overall bias\n• Great for part-time traders with day jobs\n\n✅ Swing trading offers the best balance of effort vs. returns for most traders.";
  }
  // News trading
  else if (msg.includes('news') || msg.includes('nfp') || msg.includes('fomc') || msg.includes('cpi') || msg.includes('interest rate')) {
    response = "**News & Economic Events** 📰\n\n**High-Impact Events:**\n• 🇺🇸 **NFP** (Non-Farm Payrolls) — 1st Friday monthly\n• 🏦 **FOMC** Rate Decisions — 8x/year\n• 📊 **CPI** (Inflation) — Monthly, huge volatility\n• 🇪🇺 **ECB** Rate Decisions\n• 🇬🇧 **BoE** Rate Decisions\n\n**How to Trade News:**\n1. Don't trade INTO the news — wait for release\n2. Wait 15-30min after release for volatility to settle\n3. Trade the REACTION, not the news itself\n4. Use wider stops or stay out entirely\n5. Check the economic calendar daily\n\n⚠️ **Warning:** Spreads widen dramatically during news. Many experienced traders avoid news trading entirely.";
  }
  // Psychology
  else if (msg.includes('psychology') || msg.includes('emotion') || msg.includes('discipline') || msg.includes('fear') || msg.includes('greed') || msg.includes('revenge')) {
    response = "**Trading Psychology** 🧠\n\n**Common Pitfalls:**\n• 😨 **Fear** — Missing entries or cutting winners too early\n• 🤑 **Greed** — Over-leveraging or holding losers too long\n• 😤 **Revenge trading** — Trying to recover losses immediately\n• 📱 **FOMO** — Entering late because you missed a move\n\n**Solutions:**\n1. **Always use a trading plan** — never trade on impulse\n2. **Risk only 1-2%** per trade — makes losses manageable\n3. **Journal every trade** — review and learn\n4. **Accept losses** — they're a cost of doing business\n5. **Take breaks** after 2-3 consecutive losses\n6. **Don't check P&L** obsessively during a trade\n\n💡 The best traders are **boring** traders. Consistency beats excitement every time.";
  }
  // Thank you
  else if (msg.includes('thank') || msg.includes('thanks') || msg.includes('appreciate')) {
    response = "You're welcome! 😊 Happy to help. Remember:\n\n• Always practice **risk management**\n• Never risk more than you can afford to lose\n• **Paper trade** new strategies before going live\n• Keep learning — the market always teaches\n\nFeel free to ask me anything else! 📈";
  }
  // Help
  else if (msg.includes('help') || msg.includes('what can you do') || msg.includes('what do you know')) {
    response = "Here's everything I can help you with:\n\n**📊 Analysis:**\n• Explain the current chart analysis\n• Discuss trend direction and strength\n• Support & resistance levels\n\n**📈 Trading:**\n• Entry, stop loss, take profit advice\n• Risk management & position sizing\n• Scalping, swing trading strategies\n• News trading guidance\n\n**📚 Education:**\n• RSI, MACD, Moving Averages\n• Bollinger Bands, Fibonacci\n• Chart patterns (H&S, triangles, etc.)\n• Candlestick patterns\n• Trading psychology\n\n**💱 Markets:**\n• Forex basics and sessions\n• Crypto market dynamics\n• Volume analysis\n\nJust ask! 🚀";
  }
  // Default - intelligent fallback
  else {
    response = buildContextualResponse(msg);
  }

  chatHistory.push({ role: 'assistant', text: response, time: new Date() });
  return response;
}

// ============================================
// Response Builders
// ============================================

function buildAnalysisSummary() {
  if (!currentAnalysis) {
    return "No chart has been analyzed yet. Upload a chart screenshot and run the analysis first, then I can discuss the results with you! 📊";
  }

  const a = currentAnalysis;
  const dir = a.trend?.direction || 'unknown';
  const str = a.trend?.strength || 'unknown';
  const rec = a.signals?.recommendation || 'HOLD';
  const conf = a.signals?.confidence || 'unknown';

  return `**Current Analysis Summary** 📊\n\n` +
    `**Trend:** ${dir.charAt(0).toUpperCase() + dir.slice(1)} (${str})\n` +
    `**Signal:** ${rec === 'BUY' ? '🟢 BUY' : rec === 'SELL' ? '🔴 SELL' : '🟡 HOLD'}\n` +
    `**Confidence:** ${conf}\n\n` +
    `**Key Levels:**\n` +
    `• Entry: **${a.signals?.entry_price || 'N/A'}**\n` +
    `• Stop Loss: **${a.signals?.stop_loss || 'N/A'}**\n` +
    `• TP1: **${a.signals?.take_profit_1 || 'N/A'}**\n` +
    `• TP2: **${a.signals?.take_profit_2 || 'N/A'}**\n` +
    `• TP3: **${a.signals?.take_profit_3 || 'N/A'}**\n` +
    `• R:R: **${a.signals?.risk_reward_ratio || 'N/A'}**\n\n` +
    `**Patterns Detected:** ${(a.patterns?.detected || []).join(', ') || 'None'}\n\n` +
    `${a.trend?.description || ''}\n\n` +
    `💡 Ask me about entry timing, risk management, or any specific indicator!`;
}

function buildTradeAdvice() {
  if (!currentAnalysis) {
    return "I need to see a chart analysis first! Upload a chart and run the analysis, then I'll give you my honest take on whether it's tradeable. 📊";
  }

  const a = currentAnalysis;
  const rec = a.signals?.recommendation;
  const conf = a.signals?.confidence;

  let advice;
  if (rec === 'BUY' && conf === 'high') {
    advice = `Based on my analysis, this looks like a **strong BUY setup** 🟢\n\n`;
    advice += `**Why:**\n`;
    advice += `• Trend is ${a.trend?.direction} with ${a.trend?.strength} momentum\n`;
    advice += `• Patterns detected: ${(a.patterns?.detected || []).join(', ')}\n`;
    advice += `• Risk-reward ratio: ${a.signals?.risk_reward_ratio}\n\n`;
    advice += `**Trade Plan:**\n`;
    advice += `• Enter at **${a.signals?.entry_price}**\n`;
    advice += `• Stop loss at **${a.signals?.stop_loss}**\n`;
    advice += `• TP1: ${a.signals?.take_profit_1} | TP2: ${a.signals?.take_profit_2} | TP3: ${a.signals?.take_profit_3}\n\n`;
  } else if (rec === 'SELL' && conf === 'high') {
    advice = `Based on my analysis, this looks like a **strong SELL setup** 🔴\n\n`;
    advice += `**Why:**\n`;
    advice += `• Trend is ${a.trend?.direction} with ${a.trend?.strength} momentum\n`;
    advice += `• Patterns detected: ${(a.patterns?.detected || []).join(', ')}\n`;
    advice += `• Risk-reward ratio: ${a.signals?.risk_reward_ratio}\n\n`;
    advice += `**Trade Plan:**\n`;
    advice += `• Enter short at **${a.signals?.entry_price}**\n`;
    advice += `• Stop loss at **${a.signals?.stop_loss}**\n`;
    advice += `• TP1: ${a.signals?.take_profit_1} | TP2: ${a.signals?.take_profit_2} | TP3: ${a.signals?.take_profit_3}\n\n`;
  } else if (rec === 'HOLD' || conf === 'low') {
    advice = `⚠️ I'd recommend **staying out** of this trade right now.\n\n`;
    advice += `**Reasons:**\n`;
    advice += `• Trend shows ${a.trend?.direction} with ${a.trend?.strength} conviction\n`;
    advice += `• Confidence is ${conf} — not enough edge\n`;
    advice += `• Market may be in consolidation/indecision\n\n`;
    advice += `**What to do:** Wait for clearer signals. Sometimes the best trade is no trade.\n\n`;
  } else {
    advice = `There's a potential **${rec}** signal with **${conf}** confidence.\n\n`;
    advice += `• Entry: ${a.signals?.entry_price}\n`;
    advice += `• SL: ${a.signals?.stop_loss}\n`;
    advice += `• TP: ${a.signals?.take_profit_1}\n\n`;
  }

  advice += `⚠️ **Remember:** No signal is 100% guaranteed. Always:\n`;
  advice += `• Risk only **1-2%** of your account\n`;
  advice += `• Use a **stop loss** — no exceptions\n`;
  advice += `• Don't chase the market if you missed the entry`;

  return advice;
}

function buildEntryAdvice() {
  if (!currentAnalysis) return "Upload and analyze a chart first, then I'll show you the optimal entry zone! 📊";

  const a = currentAnalysis;
  return `**Entry Point Analysis** 🎯\n\n` +
    `**Suggested Entry:** ${a.signals?.entry_price || 'N/A'}\n` +
    `**Signal:** ${a.signals?.recommendation || 'N/A'}\n` +
    `**Confidence:** ${a.signals?.confidence || 'N/A'}\n\n` +
    `**Entry Rules:**\n` +
    `1. Wait for the price to reach the entry zone\n` +
    `2. Look for a **confirmation candle** (engulfing, pin bar, or momentum candle)\n` +
    `3. Check that volume supports the move\n` +
    `4. Don't enter if you've already missed 50%+ of the move\n` +
    `5. Set your stop loss **BEFORE** entering the trade\n\n` +
    `**Pro Tip:** Use limit orders at the entry price instead of market orders to get better fills and avoid slippage.`;
}

function buildStopLossAdvice() {
  if (!currentAnalysis) return "Analyze a chart first, then I'll help you with stop loss placement! 🛡️";

  const a = currentAnalysis;
  return `**Stop Loss Guide** 🛡️\n\n` +
    `**Suggested SL:** ${a.signals?.stop_loss || 'N/A'}\n\n` +
    `**Stop Loss Rules:**\n` +
    `1. Place SL below recent **swing low** (for longs) or above **swing high** (for shorts)\n` +
    `2. Add a **buffer** of 5-10 pips beyond the level to avoid stop hunting\n` +
    `3. Account for the **spread** when setting your SL\n` +
    `4. **NEVER** move your SL further away from entry — only trail it in profit\n` +
    `5. Risk should be **1-2%** of your account maximum\n\n` +
    `**Position Sizing Formula:**\n` +
    `\`Lot Size = (Account × Risk%) ÷ (SL in pips × Pip Value)\`\n\n` +
    `For example, with a $10,000 account risking 1%:\n` +
    `Risk Amount = $100\n` +
    `If SL = 30 pips: Lot Size = $100 ÷ (30 × $10) = 0.33 lots\n\n` +
    `⚠️ **Never trade without a stop loss!** It's your insurance policy.`;
}

function buildTakeProfitAdvice() {
  if (!currentAnalysis) return "Analyze a chart first, then I'll help you with take profit targets! 🎯";

  const a = currentAnalysis;
  return `**Take Profit Strategy** 🎯\n\n` +
    `**TP Levels:**\n` +
    `• TP1: **${a.signals?.take_profit_1 || 'N/A'}** (close 50% of position)\n` +
    `• TP2: **${a.signals?.take_profit_2 || 'N/A'}** (close 30% of position)\n` +
    `• TP3: **${a.signals?.take_profit_3 || 'N/A'}** (let remainder run with trailing SL)\n\n` +
    `**Risk/Reward:** ${a.signals?.risk_reward_ratio || 'N/A'}\n\n` +
    `**Scaling Out Strategy:**\n` +
    `1. At **TP1**: Close half, move SL to **breakeven**\n` +
    `2. At **TP2**: Close most, trail SL to TP1 level\n` +
    `3. At **TP3**: Close remaining or use a tight trailing stop\n\n` +
    `This way, even if the market reverses after TP1, you've locked in profit and the rest is risk-free! 📈`;
}

function buildRiskManagementAdvice() {
  return `**Risk Management — The #1 Skill** 🛡️\n\n` +
    `**Golden Rules:**\n` +
    `• Risk **1-2%** per trade maximum\n` +
    `• Minimum **1:2 risk-reward** ratio (preferably 1:3)\n` +
    `• Max **3 open trades** at a time\n` +
    `• **Never** risk more than 5% of total account at once\n\n` +
    `**Position Size Calculator:**\n` +
    `\`Position Size = (Account Balance × Risk%) ÷ |Entry - Stop Loss|\`\n\n` +
    `**Example:**\n` +
    `• Account: $10,000\n` +
    `• Risk: 1% = $100\n` +
    `• Entry: 1.0850 (EUR/USD)\n` +
    `• Stop Loss: 1.0810 (40 pips)\n` +
    `• Position: $100 ÷ (0.0040 × 100,000) = **0.25 lots**\n\n` +
    `**Why R:R Matters:**\n` +
    `With 1:2 R:R, you only need to win **34% of trades** to break even.\n` +
    `With 1:3 R:R, you only need to win **25% of trades** to break even.\n\n` +
    `💡 Most successful traders have win rates of 40-55%. Risk management is what keeps them profitable.`;
}

function buildRSIExplanation() {
  let response = `**RSI (Relative Strength Index)** 📊\n\n` +
    `RSI measures momentum on a scale of 0-100.\n\n` +
    `**Key Levels:**\n` +
    `• **Above 70** → Overbought (potential reversal down)\n` +
    `• **Below 30** → Oversold (potential reversal up)\n` +
    `• **50 level** → Trend direction filter\n\n` +
    `**How to Use:**\n` +
    `1. Look for **RSI divergence** with price (most powerful signal)\n` +
    `2. Use as a **trend filter** — above 50 = bullish, below 50 = bearish\n` +
    `3. Don't blindly sell when overbought in strong uptrends\n` +
    `4. Best on **1h+ timeframes** (noisy on lower TFs)\n\n`;

  if (currentAnalysis?.indicators?.rsi_reading) {
    response += `**Current Reading:** ${currentAnalysis.indicators.rsi_reading}\n\n`;
  }

  response += `💡 **Pro Tip:** RSI divergence + support/resistance = high-probability trade setup.`;
  return response;
}

function buildMACDExplanation() {
  return `**MACD (Moving Average Convergence Divergence)** 📈\n\n` +
    `MACD shows the relationship between two EMAs and momentum.\n\n` +
    `**Components:**\n` +
    `• **MACD Line** = EMA(12) - EMA(26)\n` +
    `• **Signal Line** = EMA(9) of MACD Line\n` +
    `• **Histogram** = MACD - Signal\n\n` +
    `**Signals:**\n` +
    `• 🟢 **Bullish Cross:** MACD crosses above Signal\n` +
    `• 🔴 **Bearish Cross:** MACD crosses below Signal\n` +
    `• 📊 **Histogram growing:** Momentum increasing\n` +
    `• 📊 **Histogram shrinking:** Momentum fading\n\n` +
    `**Best Practices:**\n` +
    `1. Combine MACD crossovers with **support/resistance** levels\n` +
    `2. Use MACD **divergence** for reversal signals\n` +
    `3. Works best on **4h and daily** timeframes\n` +
    `4. Don't use MACD alone — always confirm with price action`;
}

function buildMAExplanation() {
  return `**Moving Averages** 📉\n\n` +
    `MAs smooth price data to identify trends.\n\n` +
    `**Common Types:**\n` +
    `• **SMA** (Simple) — equal weight to all periods\n` +
    `• **EMA** (Exponential) — more weight to recent prices (faster)\n\n` +
    `**Key Moving Averages:**\n` +
    `• **EMA 9/20** — Short-term trend (scalping/intraday)\n` +
    `• **EMA/SMA 50** — Medium-term trend (swing trading)\n` +
    `• **SMA 200** — Long-term trend (institutional level)\n\n` +
    `**Powerful Signals:**\n` +
    `• 🟢 **Golden Cross:** MA(50) crosses above MA(200) — very bullish\n` +
    `• 🔴 **Death Cross:** MA(50) crosses below MA(200) — very bearish\n` +
    `• 📊 **Price bouncing off MA** — dynamic support/resistance\n\n` +
    `**How to Trade:**\n` +
    `1. Buy when price bounces off rising EMA(20) or SMA(50)\n` +
    `2. Sell when price rejects falling EMA(20) or SMA(50)\n` +
    `3. Use MA crossovers for trend direction confirmation\n` +
    `4. Don't use MAs in sideways/choppy markets — they give false signals`;
}

function buildBollingerExplanation() {
  return `**Bollinger Bands** 📊\n\n` +
    `Bollinger Bands measure volatility with 3 lines:\n` +
    `• **Upper Band** = SMA(20) + 2 standard deviations\n` +
    `• **Middle Band** = SMA(20)\n` +
    `• **Lower Band** = SMA(20) - 2 standard deviations\n\n` +
    `**How to Use:**\n` +
    `• **Band Squeeze** = low volatility → big move incoming! 💥\n` +
    `• **Upper Band Touch** = possible overbought (in ranges)\n` +
    `• **Lower Band Touch** = possible oversold (in ranges)\n` +
    `• **Walking the Band** = strong trend (don't fade it!)\n\n` +
    `**Strategy (Mean Reversion):**\n` +
    `1. Wait for price to touch the outer band\n` +
    `2. Look for a reversal candle\n` +
    `3. Enter toward the middle band\n` +
    `4. SL beyond the outer band\n\n` +
    `⚠️ In strong trends, price can "walk" along the upper or lower band for extended periods. Don't blindly fade.`;
}

function buildSRExplanation() {
  let response = `**Support & Resistance** 📏\n\n` +
    `S/R levels are price zones where buying/selling pressure has historically been strong.\n\n` +
    `**How to Identify:**\n` +
    `1. Look for areas where price has **bounced multiple times**\n` +
    `2. Round numbers (1.3000, $50,000) act as psychological S/R\n` +
    `3. Previous **swing highs** become resistance\n` +
    `4. Previous **swing lows** become support\n` +
    `5. Broken resistance becomes **new support** (and vice versa)\n\n` +
    `**Trading S/R:**\n` +
    `• **Bounce trade:** Enter at S/R with confirmation candle\n` +
    `• **Breakout trade:** Enter after clean break + retest\n` +
    `• Place SL just beyond the level (with buffer)\n\n`;

  if (currentAnalysis?.support_resistance) {
    const sr = currentAnalysis.support_resistance;
    response += `**Current Levels:**\n`;
    response += `• Support: ${(sr.support_levels || []).join(' | ')}\n`;
    response += `• Resistance: ${(sr.resistance_levels || []).join(' | ')}\n`;
    response += `• Key Level: ${sr.key_level || 'See analysis'}\n`;
  }

  return response;
}

function buildPatternExplanation(msg) {
  let response = `**Chart Patterns Guide** 📐\n\n`;

  if (msg.includes('head and shoulder') || msg.includes('h&s')) {
    response += `**Head and Shoulders** (Reversal Pattern)\n\n`;
    response += `• Forms at the **top** of an uptrend\n`;
    response += `• Three peaks: left shoulder, head (highest), right shoulder\n`;
    response += `• **Neckline** break confirms the pattern\n`;
    response += `• Target = Head height projected from neckline break\n`;
    response += `• Inverse H&S forms at **bottoms** (bullish)\n\n`;
    response += `⚡ One of the most reliable reversal patterns with ~83% success rate when properly formed.`;
  } else if (msg.includes('double top') || msg.includes('double bottom')) {
    response += `**Double Top/Bottom** (Reversal Pattern)\n\n`;
    response += `**Double Top (M-shape):** 🔴\n`;
    response += `• Price hits resistance twice, fails both times\n`;
    response += `• Sell on neckline break with SL above the tops\n\n`;
    response += `**Double Bottom (W-shape):** 🟢\n`;
    response += `• Price hits support twice, holds both times\n`;
    response += `• Buy on neckline break with SL below the bottoms\n\n`;
    response += `Target = Height of the pattern from neckline break.`;
  } else if (msg.includes('triangle')) {
    response += `**Triangles** (Continuation/Reversal)\n\n`;
    response += `**Ascending Triangle:** 🟢 Bullish bias\n`;
    response += `• Flat resistance + rising support\n\n`;
    response += `**Descending Triangle:** 🔴 Bearish bias\n`;
    response += `• Dropping resistance + flat support\n\n`;
    response += `**Symmetrical Triangle:** ⚪ Either direction\n`;
    response += `• Converging trendlines\n\n`;
    response += `Trade the **breakout** with volume confirmation. Target = Height of triangle.`;
  } else if (msg.includes('engulfing') || msg.includes('doji') || msg.includes('hammer') || msg.includes('candle')) {
    response += `**Key Candlestick Patterns:**\n\n`;
    response += `🟢 **Bullish Patterns:**\n`;
    response += `• **Bullish Engulfing** — large green candle swallows previous red\n`;
    response += `• **Hammer** — small body, long lower wick (at support)\n`;
    response += `• **Morning Star** — 3-candle reversal at bottoms\n\n`;
    response += `🔴 **Bearish Patterns:**\n`;
    response += `• **Bearish Engulfing** — large red candle swallows previous green\n`;
    response += `• **Shooting Star** — small body, long upper wick (at resistance)\n`;
    response += `• **Evening Star** — 3-candle reversal at tops\n\n`;
    response += `⚪ **Indecision:**\n`;
    response += `• **Doji** — open = close, shows market indecision\n\n`;
    response += `💡 Candlestick patterns are most powerful at **key S/R levels**.`;
  } else {
    response += `**Bullish Patterns:** Double Bottom, Inverse H&S, Ascending Triangle, Bullish Flag, Cup & Handle\n\n`;
    response += `**Bearish Patterns:** Double Top, H&S, Descending Triangle, Bearish Flag, Rising Wedge\n\n`;
    response += `**Neutral:** Symmetrical Triangle, Rectangle, Doji\n\n`;

    if (currentAnalysis?.patterns?.detected?.length) {
      response += `**Detected in your chart:** ${currentAnalysis.patterns.detected.join(', ')}\n\n`;
    }

    response += `Ask me about a specific pattern for detailed explanation! 📐`;
  }

  return response;
}

function buildTrendExplanation() {
  let response = `**Trend Analysis** 📈\n\n`;

  if (currentAnalysis?.trend) {
    const t = currentAnalysis.trend;
    response += `**Current Trend:** ${t.direction} (${t.strength})\n\n`;
    response += `${t.description}\n\n`;
  }

  response += `**Identifying Trends:**\n`;
  response += `• **Uptrend:** Higher highs + Higher lows\n`;
  response += `• **Downtrend:** Lower lows + Lower highs\n`;
  response += `• **Sideways:** No clear HH/HL or LL/LH pattern\n\n`;
  response += `**"The Trend is Your Friend"** 🤝\n`;
  response += `• Trade WITH the trend for higher probability\n`;
  response += `• Use pullbacks to enter in the trend direction\n`;
  response += `• Counter-trend trades have lower win rates\n`;
  response += `• Use MA(200) on daily chart for overall trend bias`;

  return response;
}

function buildTimeframeAdvice() {
  return `**Timeframe Guide** ⏱️\n\n` +
    `| Style | Timeframe | Hold Time |\n` +
    `|-------|-----------|----------|\n` +
    `| Scalping | 1m-5m | Minutes |\n` +
    `| Day Trading | 15m-1h | Hours |\n` +
    `| Swing Trading | 4h-1D | Days-Weeks |\n` +
    `| Position Trading | 1W-1M | Weeks-Months |\n\n` +
    `**Multi-Timeframe Analysis:**\n` +
    `1. Use a **higher TF** for overall trend (e.g., Daily)\n` +
    `2. Use a **medium TF** for trade setup (e.g., 4H)\n` +
    `3. Use a **lower TF** for precise entry (e.g., 1H)\n\n` +
    `**Rule of Thumb:** Your analysis timeframe should be 4-6x your entry timeframe.\n\n` +
    `💡 **Best for beginners:** Start with 4H charts for analysis, 1H for entries.`;
}

function buildForexInfo() {
  return `**Forex Market Basics** 💱\n\n` +
    `**Trading Sessions (GMT):**\n` +
    `• 🇦🇺 Sydney: 22:00 - 07:00\n` +
    `• 🇯🇵 Tokyo: 00:00 - 09:00\n` +
    `• 🇬🇧 London: 08:00 - 16:00\n` +
    `• 🇺🇸 New York: 13:00 - 21:00\n\n` +
    `**Best Time to Trade:** London-NY overlap (13:00-16:00 GMT) — highest volatility & liquidity\n\n` +
    `**Major Pairs:** EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CHF\n\n` +
    `**Pip Values (Standard Lot):**\n` +
    `• EUR/USD: ~$10 per pip\n` +
    `• GBP/USD: ~$10 per pip\n` +
    `• USD/JPY: ~$6.70 per pip\n\n` +
    `**Key Drivers:** Interest rates, inflation, GDP, employment, geopolitics`;
}

function buildCryptoInfo() {
  return `**Crypto Market Insights** 🪙\n\n` +
    `**Key Characteristics:**\n` +
    `• 24/7 market — no official close\n` +
    `• Very high volatility (5-15% daily swings)\n` +
    `• Highly correlated with Bitcoin\n` +
    `• Lower liquidity on weekends\n\n` +
    `**BTC Halving Cycle:**\n` +
    `• Halving reduces new supply by 50%\n` +
    `• Historically leads to bull runs 12-18 months later\n` +
    `• Past halvings: 2012, 2016, 2020, 2024\n\n` +
    `**Trading Crypto:**\n` +
    `• Focus on BTC/ETH for lower risk\n` +
    `• Altcoins are higher risk, higher reward\n` +
    `• Use wider stop losses due to volatility\n` +
    `• Never invest more than you can afford to lose\n` +
    `• Watch exchange funding rates for sentiment`;
}

function buildVolumeExplanation() {
  return `**Volume Analysis** 📊\n\n` +
    `Volume = the number of shares/contracts/units traded.\n\n` +
    `**Volume Rules:**\n` +
    `• ✅ **High volume + price move** = Strong conviction\n` +
    `• ❌ **Low volume + price move** = Weak/fake move\n` +
    `• ✅ **Volume spike at S/R** = Breakout likely\n` +
    `• ❌ **Low volume at S/R** = Rejection likely\n\n` +
    `**Volume Divergence:**\n` +
    `• Price going UP + Volume going DOWN = uptrend weakening\n` +
    `• Price going DOWN + Volume going DOWN = downtrend weakening\n\n` +
    `💡 Volume confirms price action. Never trust a move without volume backing it up.`;
}

function buildFibonacciExplanation() {
  return `**Fibonacci Retracement** 🔢\n\n` +
    `Fibonacci levels help identify potential reversal zones:\n\n` +
    `**Key Levels:**\n` +
    `• **23.6%** — Shallow retracement (strong trend)\n` +
    `• **38.2%** — Common retracement level\n` +
    `• **50.0%** — Halfway point (not true Fib, but widely used)\n` +
    `• **61.8%** — "Golden Ratio" — most important level ⭐\n` +
    `• **78.6%** — Deep retracement (trend may be reversing)\n\n` +
    `**How to Draw:**\n` +
    `1. Identify a clear swing high and swing low\n` +
    `2. In uptrend: draw from low to high\n` +
    `3. In downtrend: draw from high to low\n` +
    `4. Look for price reactions at key levels\n\n` +
    `**Trading Strategy:**\n` +
    `• Enter at **61.8%** retracement with confirmation\n` +
    `• SL below **78.6%** level\n` +
    `• TP at previous swing high/low\n\n` +
    `💡 **Fib + S/R confluence** = The strongest trade setups you'll find!`;
}

function buildContextualResponse(msg) {
  // Try to match partial keywords
  if (msg.includes('lot') || msg.includes('size') || msg.includes('position')) {
    return buildRiskManagementAdvice();
  }
  if (msg.includes('when') && (msg.includes('trade') || msg.includes('best time'))) {
    return buildForexInfo();
  }
  if (msg.includes('indicator')) {
    return "I can explain these indicators:\n\n• **RSI** — momentum oscillator\n• **MACD** — trend & momentum\n• **Moving Averages** — trend direction\n• **Bollinger Bands** — volatility\n• **Fibonacci** — retracement levels\n\nWhich one would you like to learn about?";
  }

  return "I'm not sure I understood that completely. Here are some things you can ask me:\n\n" +
    "• \"What do you see in the chart?\"\n" +
    "• \"Should I buy or sell?\"\n" +
    "• \"Where should I place my stop loss?\"\n" +
    "• \"Explain RSI / MACD / Moving Averages\"\n" +
    "• \"Tell me about risk management\"\n" +
    "• \"What chart patterns do you see?\"\n" +
    "• \"Help\" — see all topics\n\n" +
    "Try asking in a different way! 🤔";
}
