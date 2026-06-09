// Trading Knowledge Hub Page — TradePedia

const TOPICS = [
  {
    id: 1, num: '01', title: 'What is Trading?', tagline: 'Buy low, sell high — the foundation of all markets',
    icon: '💹', iconColor: 'blue', level: 'Beginner', tag2: 'Foundation', cat: 'basics',
    body: `
      <p class="tk-body-text">Trading is buying and selling financial assets (like currency pairs, stocks, gold) to make a profit from price changes. If you buy EUR/USD at 1.1000 and it rises to 1.1050 — you profit.</p>
      <h5 class="tk-body-label">Markets you can trade</h5>
      <div class="tk-pills blue">
        <span>Stocks</span><span>Forex (currencies)</span><span>Gold / Silver / Oil</span><span>Indices (Nifty, Dow)</span><span>Cryptocurrencies</span><span>Bonds</span>
      </div>
      <h5 class="tk-body-label">Two-sided trading</h5>
      <div class="tk-mini-row">
        <div class="tk-mini-card green">
          <div class="tk-mini-title">📈 BUY (Long)</div>
          <p>You think price will go <strong>UP</strong>. Buy now, sell later at a higher price.</p>
        </div>
        <div class="tk-mini-card red">
          <div class="tk-mini-title">📉 SELL (Short)</div>
          <p>You think price will go <strong>DOWN</strong>. Sell now, buy back cheaper later.</p>
        </div>
      </div>
      <div class="tk-example-box">
        <div class="tk-example-label">💡 Real Example</div>
        <p>Buy Gold at $3,300 → sell at $3,350 = <strong>$50 profit per unit</strong>.<br>Sell EUR/USD at 1.1500 → buy back at 1.1450 = <strong>50 pip profit</strong>.</p>
      </div>
    `
  },
  {
    id: 2, num: '02', title: 'Types of Trading', tagline: 'From seconds to months — find your style',
    icon: '⏱', iconColor: 'green', level: 'Beginner', tag2: 'Style', cat: 'basics',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Scalping</span><span class="tk-kv-val">Seconds to minutes. Many small profits. Needs fast execution.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Day Trading</span><span class="tk-kv-val">Open and close same day. No overnight risk.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Swing Trading</span><span class="tk-kv-val">Hold days to weeks. Most beginner-friendly.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Position Trading</span><span class="tk-kv-val">Hold months. Based on long-term trends.</span></div>
      </div>
      <div class="tk-note good">
        <span class="tk-note-icon">💡</span>
        <p><strong>For beginners:</strong> start with Swing Trading. It gives you time to think, doesn't require constant screen watching, and works well with a full-time job.</p>
      </div>
    `
  },
  {
    id: 3, num: '03', title: 'Market Structure', tagline: 'How price really moves — trends and ranges',
    icon: '📈', iconColor: 'blue', level: 'Beginner', tag2: 'Price Action', cat: 'basics',
    body: `
      <div class="tk-mini-row">
        <div class="tk-mini-card green">
          <div class="tk-mini-title">📈 Uptrend</div>
          <p>Higher Highs (HH) + Higher Lows (HL). Price stairstepping upward.</p>
        </div>
        <div class="tk-mini-card red">
          <div class="tk-mini-title">📉 Downtrend</div>
          <p>Lower Highs (LH) + Lower Lows (LL). Price stairstepping down.</p>
        </div>
      </div>
      <div class="tk-mini-card amber full-width">
        <div class="tk-mini-title">↔️ Range / Sideways</div>
        <p>Price bouncing between a defined high and low. No clear direction.</p>
      </div>
      <h5 class="tk-body-label">Uptrend visual</h5>
      <pre class="tk-mono-chart">      HH
     /\\
    /  HL
       /
      HH
     /  HL
    /</pre>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>Always identify the market structure before entering a trade. Don't buy in a downtrend — trade with the trend, not against it.</p>
      </div>
    `
  },
  {
    id: 4, num: '04', title: 'Candlestick Basics', tagline: 'Every candle tells a story about buyers vs sellers',
    icon: '🕯', iconColor: 'amber', level: 'Beginner', tag2: 'Essential', cat: 'basics',
    body: `
      <p class="tk-body-text"><strong>Anatomy:</strong> Each candle shows 4 values: Open, High, Low, Close. The body shows open-to-close. The wicks show the extreme high and low.</p>
      <div class="tk-mini-row">
        <div class="tk-mini-card green">
          <div class="tk-mini-title">🟢 Bullish (Green)</div>
          <p>Close is <strong>ABOVE</strong> open. Buyers won this period.</p>
        </div>
        <div class="tk-mini-card red">
          <div class="tk-mini-title">🔴 Bearish (Red)</div>
          <p>Close is <strong>BELOW</strong> open. Sellers won this period.</p>
        </div>
      </div>
      <h5 class="tk-body-label">Key patterns</h5>
      <div class="tk-pills amber">
        <span>Doji</span><span>Hammer</span><span>Inverted Hammer</span><span>Shooting Star</span><span>Marubozu</span><span>Spinning Top</span>
      </div>
      <div class="tk-note good">
        <span class="tk-note-icon">💡</span>
        <p>The <strong>Hammer</strong> is one of the most reliable patterns — a small body with a long lower wick means sellers tried to push price down but buyers rejected it strongly.</p>
      </div>
    `
  },
  {
    id: 5, num: '05', title: 'Support & Resistance', tagline: 'The price levels every trader watches',
    icon: '📊', iconColor: 'purple', level: 'Intermediate', tag2: 'Key Concept', cat: 'technical',
    body: `
      <div class="tk-mini-row">
        <div class="tk-mini-card green">
          <div class="tk-mini-title">📗 Support</div>
          <p>A price floor where buyers historically enter. Price tends to bounce <strong>UP</strong> from here.</p>
        </div>
        <div class="tk-mini-card red">
          <div class="tk-mini-title">📕 Resistance</div>
          <p>A price ceiling where sellers enter. Price tends to reverse <strong>DOWN</strong> from here.</p>
        </div>
      </div>
      <pre class="tk-mono-chart">Resistance ─────────── ← Sellers push price DOWN here
            ↑  ↓
Support    ─────────── ← Buyers push price UP here</pre>
      <div class="tk-example-box">
        <div class="tk-example-label">🔑 Key Rule</div>
        <p>When price breaks through resistance, that level often becomes new support (<strong>role reversal</strong>). This is one of the most powerful concepts in trading.</p>
      </div>
      <div class="tk-note warn">
        <span class="tk-note-icon">⚠️</span>
        <p>S&R levels are <strong>zones</strong>, not exact lines. Price may briefly spike through before reversing — don't place stops exactly on the level.</p>
      </div>
    `
  },
  {
    id: 6, num: '06', title: 'Trendlines', tagline: 'Connect the dots to see where price is heading',
    icon: '📉', iconColor: 'blue', level: 'Beginner', tag2: 'Chart Drawing', cat: 'technical',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Ascending trendline</span><span class="tk-kv-val">Connect two or more Higher Lows. Acts as support in an uptrend.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Descending trendline</span><span class="tk-kv-val">Connect two or more Lower Highs. Acts as resistance in a downtrend.</span></div>
      </div>
      <div class="tk-pills blue">
        <span>Identify trend direction</span><span>Find entry points on bounces</span><span>Trade breakouts when line breaks</span>
      </div>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>The more times price touches and respects a trendline, the <strong>stronger and more significant</strong> that line is.</p>
      </div>
    `
  },
  {
    id: 7, num: '07', title: 'Chart Patterns', tagline: 'Recurring shapes that predict the next big move',
    icon: '🔷', iconColor: 'green', level: 'Intermediate', tag2: 'Patterns', cat: 'technical',
    body: `
      <h5 class="tk-body-label">Reversal Patterns</h5>
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Head & Shoulders</span><span class="tk-kv-val">Bearish reversal — three peaks, middle is tallest</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Inverse H&S</span><span class="tk-kv-val">Bullish reversal</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Double Top</span><span class="tk-kv-val">Bearish — two equal highs, price reverses down</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Double Bottom</span><span class="tk-kv-val">Bullish — two equal lows, price reverses up</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Triple Top / Bottom</span><span class="tk-kv-val">Stronger version of double top/bottom</span></div>
      </div>
      <h5 class="tk-body-label">Continuation Patterns</h5>
      <div class="tk-pills green">
        <span>Flag</span><span>Pennant</span><span>Rectangle</span><span>Cup and Handle</span><span>Ascending Triangle</span><span>Descending Triangle</span><span>Symmetrical Triangle</span>
      </div>
      <div class="tk-note good">
        <span class="tk-note-icon">💡</span>
        <p>The <strong>Double Bottom</strong> is one of the most reliable bullish patterns for beginners. Wait for the second bottom to form and price to break the 'neckline' before entering.</p>
      </div>
    `
  },
  {
    id: 8, num: '08', title: 'Candlestick Patterns', tagline: 'Multi-candle formations that signal reversals',
    icon: '🕯', iconColor: 'amber', level: 'Intermediate', tag2: 'Price Action', cat: 'technical',
    body: `
      <h5 class="tk-body-label">Bullish Reversal Patterns</h5>
      <div class="tk-pills green">
        <span>Bullish Engulfing</span><span>Hammer</span><span>Morning Star</span><span>Three White Soldiers</span><span>Piercing Pattern</span>
      </div>
      <h5 class="tk-body-label">Bearish Reversal Patterns</h5>
      <div class="tk-pills red">
        <span>Bearish Engulfing</span><span>Evening Star</span><span>Shooting Star</span><span>Dark Cloud Cover</span><span>Three Black Crows</span>
      </div>
      <div class="tk-example-box">
        <div class="tk-example-label">⭐ Most Important</div>
        <p>A <strong>Bullish Engulfing</strong> occurs when a large green candle completely 'engulfs' the previous red candle. It signals buyers have taken control. Look for this at support levels for high-probability entries.</p>
      </div>
      <div class="tk-note warn">
        <span class="tk-note-icon">⚠️</span>
        <p>Never trade a candlestick pattern alone. Always confirm with support/resistance level, trend direction, and ideally a second indicator like RSI.</p>
      </div>
    `
  },
  {
    id: 9, num: '09', title: 'Technical Indicators', tagline: 'Mathematical tools that confirm what price is doing',
    icon: '🔧', iconColor: 'purple', level: 'Intermediate', tag2: 'Indicators', cat: 'technical',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Moving Average (MA)</span><span class="tk-kv-val">Shows average price over time. 20/50/100/200 EMA are key levels.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">RSI (0-100)</span><span class="tk-kv-val">Above 70 = overbought (possible sell). Below 30 = oversold (possible buy).</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">MACD</span><span class="tk-kv-val">Shows trend direction, momentum, and crossover signals.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Bollinger Bands</span><span class="tk-kv-val">Price outside the bands = potential reversal. Squeeze = big move coming.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">ATR</span><span class="tk-kv-val">Measures volatility. Used to set smart stop losses.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">VWAP</span><span class="tk-kv-val">Institutional benchmark. Price above = bullish bias.</span></div>
      </div>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>Don't use too many indicators — it leads to 'analysis paralysis'. Master <strong>RSI + MACD + 2 EMAs</strong> first before adding more.</p>
      </div>
    `
  },
  {
    id: 10, num: '10', title: 'Volume Analysis', tagline: 'Volume confirms whether a move is real or fake',
    icon: '📦', iconColor: 'blue', level: 'Intermediate', tag2: 'Confirmation', cat: 'technical',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Rising price + Rising volume</span><span class="tk-kv-val">✅ Strong bullish move — real buying</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Falling price + Rising volume</span><span class="tk-kv-val">🔴 Strong bearish move — real selling</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Rising price + Falling volume</span><span class="tk-kv-val">⚠️ Weak move — may reverse soon</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Breakout + High volume</span><span class="tk-kv-val">✅ Reliable breakout — likely to continue</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Breakout + Low volume</span><span class="tk-kv-val">⚠️ False breakout risk</span></div>
      </div>
      <div class="tk-note good">
        <span class="tk-note-icon">💡</span>
        <p>Volume is one of the most underused tools by beginners. Always check if a breakout has <strong>volume behind it</strong> before entering.</p>
      </div>
    `
  },
  {
    id: 11, num: '11', title: 'Risk Management', tagline: 'The most important skill — protecting your capital',
    icon: '🛡', iconColor: 'red', level: 'Essential', tag2: 'Money Management', cat: 'risk',
    body: `
      <h5 class="tk-body-label">Golden Rules</h5>
      <div class="tk-rules">
        <div class="tk-rule-row"><span class="tk-rule-icon">📐</span><p>1–2% risk per trade maximum. Never risk more than 2% of your account on a single trade.</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">⚖️</span><p>Minimum 1:2 risk-reward ratio. For every ₹1 you risk, aim to make ₹2.</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">🛑</span><p>Always set a stop loss BEFORE entering. No exceptions.</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">🎯</span><p>Set a take profit level. Know your exit before entering.</p></div>
      </div>
      <div class="tk-calc-box">
        <div class="tk-calc-title">📊 Example Calculation</div>
        <p>Account: <strong>₹10,000</strong> — Risk 1%</p>
        <p>Max loss per trade = <strong>₹100</strong></p>
        <p>With 1:2 RR → target profit = <strong>₹200</strong></p>
        <p>Win 6 of 10 trades → +₹1,200 − ₹400 = <strong>+₹800 net</strong></p>
      </div>
      <div class="tk-note warn">
        <span class="tk-note-icon">⚠️</span>
        <p>Most traders lose not because their analysis is wrong, but because they <strong>risk too much</strong> on a single trade. Even a 65% win rate loses money with poor risk management.</p>
      </div>
    `
  },
  {
    id: 12, num: '12', title: 'Trading Psychology', tagline: 'Your mind is your biggest edge — or your biggest enemy',
    icon: '🧠', iconColor: 'green', level: 'Essential', tag2: 'Mindset', cat: 'risk',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Revenge Trading</span><span class="tk-kv-val">Taking a loss then immediately re-entering with bigger size to 'get it back'</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">FOMO</span><span class="tk-kv-val">Entering a trade just because price moved and you fear missing out</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Greed</span><span class="tk-kv-val">Moving take profit further and further, turning wins into losses</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Overtrading</span><span class="tk-kv-val">Taking too many trades, exhausting yourself and your account</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Fear</span><span class="tk-kv-val">Closing a trade early before your target is hit</span></div>
      </div>
      <h5 class="tk-body-label">Traits of Profitable Traders</h5>
      <div class="tk-pills green">
        <span>Discipline</span><span>Patience</span><span>Consistency</span><span>Process-focused</span><span>Accepts losses calmly</span>
      </div>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>90% of traders fail due to <strong>psychology, not strategy</strong>. A mediocre strategy executed with discipline beats a perfect strategy executed emotionally.</p>
      </div>
    `
  },
  {
    id: 13, num: '13', title: 'Fundamental Analysis', tagline: "What's moving the market behind the scenes",
    icon: '📰', iconColor: 'amber', level: 'Intermediate', tag2: 'Analysis', cat: 'technical',
    body: `
      <h5 class="tk-body-label">Key Forex Events</h5>
      <div class="tk-pills amber">
        <span>Interest Rate Decisions</span><span>Inflation (CPI)</span><span>GDP Data</span><span>Employment / NFP</span><span>Central Bank Speeches</span><span>Trade Balance</span>
      </div>
      <h5 class="tk-body-label">Key Stock Metrics</h5>
      <div class="tk-pills blue">
        <span>Revenue & Profit</span><span>P/E Ratio</span><span>EPS</span><span>Debt Levels</span><span>Cash Flow</span><span>Industry trends</span>
      </div>
      <div class="tk-note warn">
        <span class="tk-note-icon">⚠️</span>
        <p>Never hold a trade through a high-impact news event (like US NFP or Fed rate decision) without being prepared for <strong>extreme volatility</strong>. These events can move 100+ pips in seconds.</p>
      </div>
    `
  },
  {
    id: 14, num: '14', title: 'Forex Concepts', tagline: 'Currency pairs, pips, leverage, and lot sizes explained',
    icon: '💱', iconColor: 'blue', level: 'Beginner', tag2: 'Forex', cat: 'basics',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Pip</span><span class="tk-kv-val">Smallest price move. For EUR/USD, 1 pip = 0.0001</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Spread</span><span class="tk-kv-val">Difference between buy and sell price — broker's fee</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Leverage</span><span class="tk-kv-val">Borrowed capital. 1:100 means ₹1,000 controls ₹1,00,000</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Margin</span><span class="tk-kv-val">Deposit required to open a leveraged trade</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Lot Size</span><span class="tk-kv-val">Standard = 100,000 units. Mini = 10,000. Micro = 1,000</span></div>
      </div>
      <h5 class="tk-body-label">Major Pairs</h5>
      <div class="tk-pills blue">
        <span>EUR/USD</span><span>GBP/USD</span><span>USD/JPY</span><span>USD/CHF</span><span>USD/CAD</span><span>AUD/USD</span><span>NZD/USD</span>
      </div>
      <div class="tk-note warn">
        <span class="tk-note-icon">⚠️</span>
        <p>Leverage is a double-edged sword. 1:100 leverage means a 1% price move either <strong>doubles your account or wipes it</strong>. Always use proper position sizing.</p>
      </div>
    `
  },
  {
    id: 15, num: '15', title: 'Smart Money Concepts (SMC)', tagline: 'How banks and institutions really move the market',
    icon: '🏦', iconColor: 'purple', level: 'Advanced', tag2: 'Institutional', cat: 'advanced',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Liquidity</span><span class="tk-kv-val">Clusters of stop losses that big players target before reversing</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Order Blocks (OB)</span><span class="tk-kv-val">Last candle before a big institutional move — price returns here</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Fair Value Gap (FVG)</span><span class="tk-kv-val">Price gap created by fast moves — price fills these gaps later</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Break of Structure (BOS)</span><span class="tk-kv-val">Confirms trend continuation after a swing break</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Change of Character (CHOCH)</span><span class="tk-kv-val">First sign trend is reversing</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Inducement</span><span class="tk-kv-val">Price traps retail traders before the real move</span></div>
      </div>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>SMC is based on the idea that banks need large pools of liquidity to fill their massive orders. They <strong>'hunt' retail stop losses</strong> to generate that liquidity, then reverse.</p>
      </div>
    `
  },
  {
    id: 16, num: '16', title: 'ICT Concepts', tagline: "Michael Huddleston's institutional trading framework",
    icon: '🎓', iconColor: 'blue', level: 'Advanced', tag2: 'ICT', cat: 'advanced',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Power of 3</span><span class="tk-kv-val">Accumulation, Manipulation, Distribution — daily market cycle</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Judas Swing</span><span class="tk-kv-val">False move in the wrong direction at market open to grab liquidity</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Liquidity Sweep</span><span class="tk-kv-val">Price briefly spikes past a high/low to grab stops before reversing</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Premium & Discount</span><span class="tk-kv-val">Buy in discount zones (below midpoint), sell in premium zones (above)</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Market Maker Model</span><span class="tk-kv-val">The recurring pattern institutions use to accumulate and distribute</span></div>
      </div>
      <div class="tk-note warn">
        <span class="tk-note-icon">⚠️</span>
        <p>ICT concepts are powerful but complex. Master basic price action, support/resistance, and SMC <strong>before diving into ICT</strong>. Jumping to advanced concepts too early creates confusion.</p>
      </div>
    `
  },
  {
    id: 17, num: '17', title: 'Wyckoff Theory', tagline: 'How institutions accumulate and distribute positions',
    icon: '🌊', iconColor: 'green', level: 'Advanced', tag2: 'Institutional', cat: 'advanced',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Accumulation</span><span class="tk-kv-val">Institutions quietly buying at low prices while retail sells</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Markup</span><span class="tk-kv-val">Price rises after accumulation — retail buyers start entering</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Distribution</span><span class="tk-kv-val">Institutions quietly selling at high prices while retail buys</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Markdown</span><span class="tk-kv-val">Price drops after distribution — retail panic sells at the bottom</span></div>
      </div>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>Wyckoff explains why markets seem to 'trap' retail traders at highs and lows. The institutions are operating on a <strong>completely different timeframe and objective</strong>.</p>
      </div>
    `
  },
  {
    id: 18, num: '18', title: 'Elliott Wave Theory', tagline: 'Markets move in predictable wave patterns',
    icon: '〰️', iconColor: 'amber', level: 'Advanced', tag2: 'Wave Theory', cat: 'advanced',
    body: `
      <div class="tk-mini-card blue full-width">
        <div class="tk-mini-title">Complete Market Cycle</div>
        <pre class="tk-mono-chart" style="margin:8px 0 0;border:none;padding:0;background:transparent;">    3
   /\\  5
  1/  \\/  \\
   2    4   → Then ABC correction down</pre>
      </div>
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Impulse waves</span><span class="tk-kv-val">5 waves in the direction of the trend (1,2,3,4,5)</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Corrective waves</span><span class="tk-kv-val">3 waves against the trend (A,B,C)</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Wave 3</span><span class="tk-kv-val">Always the longest and strongest impulse wave</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Wave 2</span><span class="tk-kv-val">Never retraces more than 100% of Wave 1</span></div>
      </div>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>Elliott Wave is often combined with Fibonacci levels — Wave 2 typically retraces <strong>61.8% of Wave 1</strong>, and Wave 3 extends to 161.8% or 261.8% of Wave 1.</p>
      </div>
    `
  },
  {
    id: 19, num: '19', title: 'Fibonacci Trading', tagline: 'Mathematical ratios hidden in every price move',
    icon: '🌀', iconColor: 'purple', level: 'Intermediate', tag2: 'Fibonacci', cat: 'technical',
    body: `
      <h5 class="tk-body-label">Key Levels</h5>
      <div class="tk-fib-levels">
        <div class="tk-fib-row"><span class="tk-fib-label">23.6%</span><div class="tk-fib-bar"><div class="tk-fib-fill purple" style="width:23.6%"></div></div></div>
        <div class="tk-fib-row"><span class="tk-fib-label">38.2%</span><div class="tk-fib-bar"><div class="tk-fib-fill purple" style="width:38.2%"></div></div></div>
        <div class="tk-fib-row"><span class="tk-fib-label">50.0%</span><div class="tk-fib-bar"><div class="tk-fib-fill purple" style="width:50%"></div></div></div>
        <div class="tk-fib-row golden"><span class="tk-fib-label">61.8% <em>Golden Ratio</em></span><div class="tk-fib-bar"><div class="tk-fib-fill green" style="width:61.8%"></div></div></div>
        <div class="tk-fib-row"><span class="tk-fib-label">78.6%</span><div class="tk-fib-bar"><div class="tk-fib-fill amber" style="width:78.6%"></div></div></div>
      </div>
      <h5 class="tk-body-label">Uses</h5>
      <div class="tk-pills purple">
        <span>Pullback entry points</span><span>Profit targets</span><span>Stop loss placement</span><span>Wave target projections</span>
      </div>
      <div class="tk-note good">
        <span class="tk-note-icon">💡</span>
        <p>The <strong>61.8% 'golden ratio'</strong> is the most powerful Fibonacci level. Price very frequently retraces to exactly this level before continuing its original direction.</p>
      </div>
    `
  },
  {
    id: 20, num: '20', title: 'Advanced Market Concepts', tagline: 'Liquidity, manipulation, and institutional mechanics',
    icon: '🔬', iconColor: 'red', level: 'Advanced', tag2: 'Institutional', cat: 'advanced',
    body: `
      <div class="tk-kv-table">
        <div class="tk-kv-row"><span class="tk-kv-key">Liquidity</span><span class="tk-kv-val">Where large clusters of stop losses sit — banks target these</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Stop Hunts</span><span class="tk-kv-val">Price briefly breaks a key level to trigger retail stops before reversing</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Market Correlation</span><span class="tk-kv-val">Gold rises when USD falls. EUR/USD and DXY move inversely.</span></div>
        <div class="tk-kv-row"><span class="tk-kv-key">Institutional Orders</span><span class="tk-kv-val">Banks use limit orders so large they move the market — they need to be filled over time</span></div>
      </div>
      <div class="tk-note warn">
        <span class="tk-note-icon">⚠️</span>
        <p>Understanding manipulation doesn't mean you can predict it every time. Use it as <strong>context</strong> — look for stop hunts at key levels before entering in the opposite direction.</p>
      </div>
    `
  },
  {
    id: 21, num: '21', title: 'Your Trading Plan', tagline: 'Every trade needs a plan — no plan, no trade',
    icon: '📋', iconColor: 'green', level: 'Essential', tag2: 'Discipline', cat: 'risk',
    body: `
      <h5 class="tk-body-label">Pre-Trade Checklist</h5>
      <div class="tk-rules checklist">
        <div class="tk-rule-row"><span class="tk-rule-icon">✅</span><p>Trend direction confirmed on higher timeframe</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">✅</span><p>Clear entry point with a reason (pattern, level, signal)</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">✅</span><p>Stop loss level defined and placed</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">✅</span><p>Take profit level defined (minimum 1:2 RR)</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">✅</span><p>Risk % calculated (max 2% of account)</p></div>
        <div class="tk-rule-row"><span class="tk-rule-icon">✅</span><p>Written reason for entry in trade journal</p></div>
      </div>
      <div class="tk-note info">
        <span class="tk-note-icon">ℹ️</span>
        <p>If you cannot tick every item on this checklist, <strong>do not take the trade</strong>. A good trade missed is better than a bad trade taken.</p>
      </div>
    `
  },
  {
    id: 22, num: '22', title: 'Best Learning Order', tagline: 'The fastest path from beginner to profitable trader',
    icon: '🗺', iconColor: 'blue', level: 'Roadmap', tag2: 'All Levels', cat: 'basics',
    body: `
      <div class="tk-learning-path">
        <div class="tk-step"><span class="tk-step-num">1</span><span>Candlesticks — the language of markets</span></div>
        <div class="tk-step"><span class="tk-step-num">2</span><span>Support & Resistance — key price levels</span></div>
        <div class="tk-step"><span class="tk-step-num">3</span><span>Market Structure — trend identification</span></div>
        <div class="tk-step"><span class="tk-step-num">4</span><span>Trendlines — drawing and trading</span></div>
        <div class="tk-step"><span class="tk-step-num">5</span><span>Volume — confirming moves</span></div>
        <div class="tk-step"><span class="tk-step-num">6</span><span>RSI + Moving Averages — your first indicators</span></div>
        <div class="tk-step"><span class="tk-step-num">7</span><span>Chart Patterns — reversal and continuation</span></div>
        <div class="tk-step"><span class="tk-step-num">8</span><span>Risk Management — protecting capital</span></div>
        <div class="tk-step"><span class="tk-step-num">9</span><span>Psychology — the true edge</span></div>
        <div class="tk-step"><span class="tk-step-num">10</span><span>Forex concepts, then SMC, then ICT</span></div>
      </div>
      <div class="tk-note good">
        <span class="tk-note-icon">💡</span>
        <p>Master the basics for <strong>3 months</strong> before touching SMC or ICT. The traders who skip fundamentals to learn advanced concepts end up more confused, not less.</p>
      </div>
    `
  }
];

let openCardId = null;
let activeFilter = 'all';
let searchQuery = '';

function getLevelClass(level) {
  const l = level.toLowerCase();
  if (l === 'beginner' || l === 'essential' || l === 'roadmap') return 'green';
  if (l === 'intermediate') return 'amber';
  if (l === 'advanced') return 'red';
  return 'blue';
}

function getCatLabel(cat) {
  const map = { basics: 'Basics', technical: 'Technical', risk: 'Risk', advanced: 'Advanced' };
  return map[cat] || cat;
}

function getCatClass(cat) {
  const map = { basics: 'blue', technical: 'purple', risk: 'red', advanced: 'amber' };
  return map[cat] || 'blue';
}

function matchesSearch(topic, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return topic.title.toLowerCase().includes(s) ||
    topic.tagline.toLowerCase().includes(s) ||
    topic.body.toLowerCase().includes(s) ||
    topic.tag2.toLowerCase().includes(s) ||
    topic.level.toLowerCase().includes(s);
}

function matchesCat(topic, cat) {
  if (cat === 'all') return true;
  return topic.cat === cat;
}

function renderCards() {
  const grid = document.getElementById('tk-card-grid');
  if (!grid) return;

  const filtered = TOPICS.filter(t => matchesSearch(t, searchQuery) && matchesCat(t, activeFilter));

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="tk-empty">
        <div class="tk-empty-icon">🔍</div>
        <h4>No topics found</h4>
        <p>Try adjusting your search or filter.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(t => {
    const isOpen = openCardId === t.id;
    return `
      <div class="tk-card ${isOpen ? 'open' : ''}" data-id="${t.id}">
        <div class="tk-card-header" data-id="${t.id}">
          <div class="tk-card-icon ${t.iconColor}">${t.icon}</div>
          <div class="tk-card-info">
            <span class="tk-topic-num">Topic ${t.num}</span>
            <h4 class="tk-card-title">${t.title}</h4>
            <p class="tk-card-tagline">${t.tagline}</p>
            <div class="tk-card-tags">
              <span class="tk-tag ${getLevelClass(t.level)}">${t.level}</span>
              <span class="tk-tag outline">${t.tag2}</span>
              <span class="tk-tag ${getCatClass(t.cat)}">${getCatLabel(t.cat)}</span>
            </div>
          </div>
          <span class="tk-chevron ${isOpen ? 'open' : ''}">⌄</span>
        </div>
        ${isOpen ? `<div class="tk-card-body">${t.body}</div>` : ''}
      </div>`;
  }).join('');

  // Bind click handlers on headers
  grid.querySelectorAll('.tk-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const id = parseInt(header.dataset.id);
      openCardId = openCardId === id ? null : id;
      renderCards();
    });
  });
}

export function renderTradingKnowledge(container) {
  openCardId = null;
  activeFilter = 'all';
  searchQuery = '';

  container.innerHTML = `
    <!-- Hero Banner -->
    <div class="tk-hero">
      <div class="tk-hero-content">
        <span class="tk-hero-eyebrow">Trading Knowledge Hub</span>
        <h2 class="tk-hero-title"><em>Everything you need to trade with confidence</em></h2>
        <p class="tk-hero-subtitle">22 topics covering every layer of trading — from reading your first candlestick to institutional Smart Money Concepts. Built into your TradeVision AI platform.</p>
        <div class="tk-hero-stats">
          <div class="tk-hero-stat">
            <span class="tk-hero-stat-value">22</span>
            <span class="tk-hero-stat-label">Topics</span>
          </div>
          <div class="tk-hero-stat">
            <span class="tk-hero-stat-value">100+</span>
            <span class="tk-hero-stat-label">Concepts</span>
          </div>
          <div class="tk-hero-stat">
            <span class="tk-hero-stat-value">6</span>
            <span class="tk-hero-stat-label">Skill Levels</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="tk-filter-bar">
      <div class="tk-search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="tk-search" placeholder="Search any concept, indicator, pattern…" />
      </div>
      <div class="tk-chips">
        <button class="tk-chip active" data-cat="all">All Topics</button>
        <button class="tk-chip" data-cat="basics">Basics</button>
        <button class="tk-chip" data-cat="technical">Technical</button>
        <button class="tk-chip" data-cat="risk">Risk</button>
        <button class="tk-chip" data-cat="advanced">Advanced</button>
      </div>
    </div>

    <!-- Card Grid -->
    <div class="tk-card-grid" id="tk-card-grid"></div>

    <!-- CTA Bar -->
    <div class="tk-cta-bar">
      <h3 class="tk-cta-title">Ready to start trading?</h3>
      <div class="tk-cta-actions">
        <button class="btn btn-outline" id="tk-cta-markets">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/></svg>
          View Live Markets
        </button>
        <button class="btn btn-primary" id="tk-cta-chart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/></svg>
          Start Chart Analysis
        </button>
      </div>
    </div>
  `;

  // Initial render
  renderCards();

  // Search
  document.getElementById('tk-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCards();
  });

  // Filter chips
  document.querySelectorAll('.tk-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.cat;
      document.querySelectorAll('.tk-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderCards();
    });
  });

  // CTA buttons
  document.getElementById('tk-cta-markets')?.addEventListener('click', () => {
    document.querySelector('[data-page="markets"]')?.click();
  });
  document.getElementById('tk-cta-chart')?.addEventListener('click', () => {
    document.querySelector('[data-page="chart-analysis"]')?.click();
  });
}
