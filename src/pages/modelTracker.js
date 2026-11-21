// Model Tracker & Strategy Backtesting Page
import { api } from '../utils/api.js';
import { showToast } from '../utils/toast.js';

export function renderModelTracker(container) {
  container.innerHTML = `
    <div class="mt-controls">
      <div class="mt-field">
        <label for="mt-pair">Trading Pair</label>
        <select id="mt-pair">
          <option value="EURUSD" selected>EUR/USD (Forex)</option>
          <option value="XAUUSD">XAU/USD (Gold)</option>
          <option value="GBPUSD">GBP/USD (Forex)</option>
          <option value="USDJPY">USD/JPY (Forex)</option>
          <option value="AUDUSD">AUD/USD (Forex)</option>
          <option value="BTCUSDT">BTC/USDT (Crypto)</option>
        </select>
      </div>

      <div class="mt-field">
        <label for="mt-timeframe">Timeframe</label>
        <select id="mt-timeframe">
          <option value="15min">15 Minutes</option>
          <option value="1h" selected>1 Hour</option>
          <option value="4h">4 Hours</option>
          <option value="1day">1 Day</option>
        </select>
      </div>

      <div class="mt-field">
        <label for="mt-lookback">Lookback Period</label>
        <select id="mt-lookback">
          <option value="30">30 Days</option>
          <option value="90">90 Days</option>
          <option value="180">180 Days</option>
          <option value="365" selected>365 Days (1 Year)</option>
        </select>
      </div>

      <button class="btn btn-primary" id="mt-run-btn" style="height:42px;padding:0 24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Run Backtest
      </button>
    </div>

    <div id="mt-results-area">
      <div class="card" style="text-align:center;padding:48px 24px;">
        <div style="font-size:2.6rem;margin-bottom:12px;">📊</div>
        <h3 style="margin-bottom:8px;color:var(--gray-800);">Rule-Based Strategy Backtester</h3>
        <p style="color:var(--gray-500);font-size:0.9rem;max-width:540px;margin:0 auto 16px;">
          Evaluate the accuracy of TradeVision's RSI, MACD, and EMA-20 indicator rules on up to 5,000 historical Twelve Data candles with 1:2 risk-to-reward ATR stop/profit targets.
        </p>
        <span style="font-size:0.8rem;background:var(--purple-50);color:var(--purple-600);padding:4px 12px;border-radius:20px;">
          Click "Run Backtest" to begin historical simulation
        </span>
      </div>
    </div>
  `;

  document.getElementById('mt-run-btn').addEventListener('click', async () => {
    const btn = document.getElementById('mt-run-btn');
    const resultsArea = document.getElementById('mt-results-area');
    const pair = document.getElementById('mt-pair').value;
    const timeframe = document.getElementById('mt-timeframe').value;
    const lookback_days = parseInt(document.getElementById('mt-lookback').value, 10);

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Running Backtest...';
    resultsArea.innerHTML = `
      <div class="card" style="text-align:center;padding:48px 24px;">
        <div class="spinner" style="width:36px;height:36px;border:3px solid var(--purple-100);border-top-color:var(--purple-600);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
        <h3 style="margin-bottom:6px;color:var(--gray-800);">Fetching Historical Candles & Simulating...</h3>
        <p style="color:var(--gray-500);font-size:0.88rem;">Computing local RSI, MACD, EMA-20 indicators over Twelve Data history...</p>
      </div>
    `;

    try {
      const data = await api.post('/backtest/run', {
        pair,
        timeframe,
        lookback_days
      });

      renderBacktestResults(data, resultsArea);
      showToast(`Backtest completed! ${data.total_signals} signals evaluated.`, 'success');
    } catch (err) {
      showToast(`Backtest failed: ${err.message}`, 'error');
      resultsArea.innerHTML = `
        <div class="card" style="border:1.5px solid var(--danger);background:#fef2f2;padding:32px;text-align:center;">
          <div style="font-size:2.2rem;margin-bottom:8px;">⚠️</div>
          <h3 style="color:var(--danger);margin-bottom:8px;">Backtest Failed</h3>
          <p style="color:var(--gray-700);">${err.message}</p>
        </div>
      `;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Run Backtest
      `;
    }
  });
}

function renderBacktestResults(data, container) {
  const { total_signals, wins, losses, skipped, win_rate_pct, breakdown, trades, pair, symbol, timeframe, candles_analyzed } = data;

  const winRateColor = win_rate_pct >= 50 ? 'var(--success, #10b981)' : win_rate_pct >= 35 ? 'var(--warning, #f59e0b)' : 'var(--danger, #ef4444)';

  container.innerHTML = `
    <!-- Performance Summary Cards -->
    <div class="mt-header-grid">
      <div class="mt-stat-card">
        <div class="mt-stat-title">Win Rate</div>
        <div class="mt-stat-value" style="color:${winRateColor};">
          ${win_rate_pct}%
        </div>
        <div class="mt-stat-sub">${wins} Wins / ${losses} Losses (${skipped} Open/Skip)</div>
      </div>

      <div class="mt-stat-card">
        <div class="mt-stat-title">Total Signals</div>
        <div class="mt-stat-value">${total_signals}</div>
        <div class="mt-stat-sub">Across ${candles_analyzed} candles (${symbol})</div>
      </div>

      <div class="mt-stat-card">
        <div class="mt-stat-title">Strong Signals</div>
        <div class="mt-stat-value" style="color:var(--purple-600, #4f46e5);">
          ${breakdown.strong.win_rate_pct}%
        </div>
        <div class="mt-stat-sub">${breakdown.strong.wins}W / ${breakdown.strong.losses}L (Total: ${breakdown.strong.total})</div>
      </div>

      <div class="mt-stat-card">
        <div class="mt-stat-title">Medium Signals</div>
        <div class="mt-stat-value" style="color:var(--gray-700, #374151);">
          ${breakdown.medium.win_rate_pct}%
        </div>
        <div class="mt-stat-sub">${breakdown.medium.wins}W / ${breakdown.medium.losses}L (Total: ${breakdown.medium.total})</div>
      </div>
    </div>

    <!-- Trade Results Log -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border,#e5e7eb);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:0.95rem;color:var(--gray-800);">Trade Log (${trades.length} trades)</span>
        <span class="card-badge badge-purple">${symbol} • ${timeframe}</span>
      </div>
      <div class="mt-table-container" style="border:none;border-radius:0;">
        <table class="mt-table">
          <thead>
            <tr>
              <th>Entry Time</th>
              <th>Signal</th>
              <th>Entry Price</th>
              <th>Stop Loss</th>
              <th>Take Profit</th>
              <th>Exit Price</th>
              <th>Held</th>
              <th>Pips / Points</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            ${trades.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align:center;padding:32px;color:var(--gray-400);">No signals were triggered in this period.</td>
              </tr>
            ` : trades.slice(0, 100).map(t => {
              const outcomeBadge = t.outcome === 'win' 
                ? '<span class="badge-win">✓ WIN</span>' 
                : t.outcome === 'loss' 
                ? '<span class="badge-loss">✕ LOSS</span>' 
                : '<span class="badge-skipped">— SKIP</span>';

              const pipsColor = t.pips_points > 0 ? 'color:var(--success,#10b981);font-weight:600;' 
                : t.pips_points < 0 ? 'color:var(--danger,#ef4444);font-weight:600;' 
                : 'color:var(--gray-500);';

              const sigColor = t.signal.includes('BUY') ? 'color:var(--success,#10b981);font-weight:600;' : 'color:var(--danger,#ef4444);font-weight:600;';

              return `
                <tr>
                  <td style="font-size:0.8rem;color:var(--gray-600);white-space:nowrap;">${t.entry_time}</td>
                  <td style="${sigColor}">${t.signal}</td>
                  <td>${t.entry_price}</td>
                  <td style="color:var(--danger,#ef4444);">${t.stop_loss}</td>
                  <td style="color:var(--success,#10b981);">${t.take_profit}</td>
                  <td>${t.exit_price}</td>
                  <td>${t.candles_held} bars</td>
                  <td style="${pipsColor}">${t.pips_points > 0 ? '+' : ''}${t.pips_points}</td>
                  <td>${outcomeBadge}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${trades.length > 100 ? `
        <div style="padding:12px;text-align:center;font-size:0.8rem;color:var(--gray-500);background:var(--surface-light,#f9fafb);border-top:1px solid var(--border,#e5e7eb);">
          Showing first 100 of ${trades.length} trades.
        </div>
      ` : ''}
    </div>
  `;
}
