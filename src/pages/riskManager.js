// ============================================
// Risk Manager — Position Sizing & Risk Control
// ============================================

import { showToast } from '../utils/toast.js';

const RISK_STORAGE_KEY = 'tradevision_risk_settings';
const TRADE_LOG_KEY = 'tradevision_trade_log';

// ─── Persistence ────────────────────────────────────────────────────────────
function loadRiskSettings() {
  try {
    const raw = localStorage.getItem(RISK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultSettings();
  } catch { return getDefaultSettings(); }
}

function saveRiskSettings(settings) {
  localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(settings));
}

function getDefaultSettings() {
  return {
    accountBalance: 10000,
    riskPercent: 1,
    maxDailyLoss: 3,
    maxOpenTrades: 3,
    dailyLossUsed: 0,
    dailyLossDate: new Date().toDateString(),
    tradesBlockedToday: false,
  };
}

function loadTradeLog() {
  try {
    const raw = localStorage.getItem(TRADE_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTradeLog(log) {
  localStorage.setItem(TRADE_LOG_KEY, JSON.stringify(log));
}

// ─── Render ─────────────────────────────────────────────────────────────────
export function renderRiskManager(container) {
  const s = loadRiskSettings();

  // Reset daily loss if date changed
  if (s.dailyLossDate !== new Date().toDateString()) {
    s.dailyLossUsed = 0;
    s.dailyLossDate = new Date().toDateString();
    s.tradesBlockedToday = false;
    saveRiskSettings(s);
  }

  const dailyLossMax = s.accountBalance * (s.maxDailyLoss / 100);
  const dailyLossPercUsed = dailyLossMax > 0 ? Math.min((s.dailyLossUsed / dailyLossMax) * 100, 100) : 0;
  const isBlocked = s.dailyLossUsed >= dailyLossMax;

  container.innerHTML = `
    <div class="risk-manager-layout" style="animation: fadeIn 0.4s ease;">

      <!-- ── Top Alert Bar ────────────────────────── -->
      <div class="rm-alert-bar ${isBlocked ? 'rm-alert-danger' : dailyLossPercUsed > 60 ? 'rm-alert-warning' : 'rm-alert-safe'}" id="rm-alert-bar">
        <div class="rm-alert-icon">
          ${isBlocked ? '🚫' : dailyLossPercUsed > 60 ? '⚠️' : '🛡️'}
        </div>
        <div class="rm-alert-text">
          ${isBlocked
            ? '<strong>TRADING BLOCKED</strong> — Daily loss limit reached. No more trades today. Reset tomorrow.'
            : dailyLossPercUsed > 60
            ? `<strong>CAUTION</strong> — You've used ${dailyLossPercUsed.toFixed(0)}% of your daily loss limit. Trade carefully.`
            : '<strong>Risk Manager Active</strong> — Your account is protected. All limits within safe range.'}
        </div>
      </div>

      <!-- ── Two Column Layout ────────────────────── -->
      <div class="rm-grid">

        <!-- LEFT: Account & Settings -->
        <div class="rm-left-col">

          <!-- Account Settings Card -->
          <div class="card rm-card">
            <div class="card-header">
              <span class="card-title">💰 Account Settings</span>
              <span class="card-badge badge-purple">Core</span>
            </div>
            <div class="rm-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="rm-balance">Account Balance ($)</label>
                  <input type="number" id="rm-balance" value="${s.accountBalance}" min="100" step="100" />
                </div>
                <div class="form-group">
                  <label for="rm-risk-pct">Risk Per Trade (%)</label>
                  <select id="rm-risk-pct">
                    <option value="0.25" ${s.riskPercent === 0.25 ? 'selected' : ''}>0.25% (Ultra Safe)</option>
                    <option value="0.5" ${s.riskPercent === 0.5 ? 'selected' : ''}>0.5% (Conservative)</option>
                    <option value="1" ${s.riskPercent === 1 ? 'selected' : ''}>1% (Recommended)</option>
                    <option value="1.5" ${s.riskPercent === 1.5 ? 'selected' : ''}>1.5% (Moderate)</option>
                    <option value="2" ${s.riskPercent === 2 ? 'selected' : ''}>2% (Aggressive)</option>
                    <option value="3" ${s.riskPercent === 3 ? 'selected' : ''}>3% (High Risk)</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="rm-max-daily">Max Daily Loss (%)</label>
                  <select id="rm-max-daily">
                    <option value="1" ${s.maxDailyLoss === 1 ? 'selected' : ''}>1% (Very Strict)</option>
                    <option value="2" ${s.maxDailyLoss === 2 ? 'selected' : ''}>2% (Strict)</option>
                    <option value="3" ${s.maxDailyLoss === 3 ? 'selected' : ''}>3% (Standard)</option>
                    <option value="5" ${s.maxDailyLoss === 5 ? 'selected' : ''}>5% (Relaxed)</option>
                    <option value="10" ${s.maxDailyLoss === 10 ? 'selected' : ''}>10% (Dangerous)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="rm-max-trades">Max Open Trades</label>
                  <select id="rm-max-trades">
                    <option value="1" ${s.maxOpenTrades === 1 ? 'selected' : ''}>1</option>
                    <option value="2" ${s.maxOpenTrades === 2 ? 'selected' : ''}>2</option>
                    <option value="3" ${s.maxOpenTrades === 3 ? 'selected' : ''}>3</option>
                    <option value="5" ${s.maxOpenTrades === 5 ? 'selected' : ''}>5</option>
                  </select>
                </div>
              </div>
              <button class="rm-save-btn" id="rm-save-settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Settings
              </button>
            </div>
          </div>

          <!-- Position Size Calculator -->
          <div class="card rm-card" style="margin-top:20px;">
            <div class="card-header">
              <span class="card-title">📐 Position Size Calculator</span>
            </div>
            <div class="rm-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="rm-entry">Entry Price</label>
                  <input type="number" id="rm-entry" placeholder="e.g. 1.0850" step="any" />
                </div>
                <div class="form-group">
                  <label for="rm-sl">Stop Loss Price</label>
                  <input type="number" id="rm-sl" placeholder="e.g. 1.0810" step="any" />
                </div>
              </div>
              <button class="rm-calc-btn" id="rm-calc-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
                Calculate Position Size
              </button>
            </div>
            <div id="rm-calc-result" style="margin-top:16px;"></div>
          </div>
        </div>

        <!-- RIGHT: Dashboard & Log -->
        <div class="rm-right-col">

          <!-- Risk Dashboard -->
          <div class="card rm-card">
            <div class="card-header">
              <span class="card-title">📊 Risk Dashboard</span>
              <span class="card-badge ${isBlocked ? 'badge-danger' : 'badge-success'}">${isBlocked ? 'Blocked' : 'Active'}</span>
            </div>

            <!-- Stats Row -->
            <div class="rm-stats-row">
              <div class="rm-stat">
                <div class="rm-stat-label">Account Balance</div>
                <div class="rm-stat-value">$${s.accountBalance.toLocaleString()}</div>
              </div>
              <div class="rm-stat">
                <div class="rm-stat-label">Risk Per Trade</div>
                <div class="rm-stat-value">${s.riskPercent}%</div>
                <div class="rm-stat-sub">$${(s.accountBalance * s.riskPercent / 100).toFixed(2)}</div>
              </div>
              <div class="rm-stat">
                <div class="rm-stat-label">Max Daily Loss</div>
                <div class="rm-stat-value">${s.maxDailyLoss}%</div>
                <div class="rm-stat-sub">$${dailyLossMax.toFixed(2)}</div>
              </div>
            </div>

            <!-- Daily Loss Meter -->
            <div class="rm-meter-section">
              <div class="rm-meter-header">
                <span>Daily Loss Used</span>
                <span class="rm-meter-value ${dailyLossPercUsed > 80 ? 'danger' : dailyLossPercUsed > 50 ? 'warning' : 'safe'}">
                  $${s.dailyLossUsed.toFixed(2)} / $${dailyLossMax.toFixed(2)}
                </span>
              </div>
              <div class="rm-meter-track">
                <div class="rm-meter-fill ${dailyLossPercUsed > 80 ? 'danger' : dailyLossPercUsed > 50 ? 'warning' : 'safe'}" style="width:${dailyLossPercUsed}%"></div>
              </div>
              <div class="rm-meter-labels">
                <span>0%</span>
                <span>${dailyLossPercUsed.toFixed(1)}% used</span>
                <span>100%</span>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="rm-info-grid">
              <div class="rm-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div>
                  <div class="rm-info-label">Max Risk Per Trade</div>
                  <div class="rm-info-value">$${(s.accountBalance * s.riskPercent / 100).toFixed(2)}</div>
                </div>
              </div>
              <div class="rm-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div>
                  <div class="rm-info-label">Remaining Today</div>
                  <div class="rm-info-value">$${Math.max(0, dailyLossMax - s.dailyLossUsed).toFixed(2)}</div>
                </div>
              </div>
              <div class="rm-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/></svg>
                <div>
                  <div class="rm-info-label">Max Open Trades</div>
                  <div class="rm-info-value">${s.maxOpenTrades}</div>
                </div>
              </div>
              <div class="rm-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div>
                  <div class="rm-info-label">Trades Until Block</div>
                  <div class="rm-info-value">${Math.max(0, Math.floor((dailyLossMax - s.dailyLossUsed) / (s.accountBalance * s.riskPercent / 100)))}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Simulate Loss / Trade Log -->
          <div class="card rm-card" style="margin-top:20px;">
            <div class="card-header">
              <span class="card-title">🧪 Trade Simulator</span>
              <button class="btn btn-outline" id="rm-reset-daily" style="padding:4px 12px;font-size:0.72rem;">Reset Daily</button>
            </div>
            <p style="font-size:0.82rem;color:var(--gray-500);margin-bottom:16px;line-height:1.6;">
              Log a simulated trade loss to test how the daily loss blocker works. Once you hit your daily limit, the Risk Manager will block further trades.
            </p>
            <div class="rm-sim-row">
              <div class="form-group">
                <label for="rm-sim-loss">Simulated Loss ($)</label>
                <input type="number" id="rm-sim-loss" placeholder="e.g. 100" min="0" step="10" />
              </div>
              <button class="rm-sim-btn" id="rm-log-loss" ${isBlocked ? 'disabled' : ''}>
                Log Loss
              </button>
            </div>

            <!-- Trade Log -->
            <div id="rm-trade-log" style="margin-top:20px;"></div>
          </div>

        </div>
      </div>
    </div>
  `;

  initRiskEvents();
  renderTradeLog();
}

// ─── Events ─────────────────────────────────────────────────────────────────
function initRiskEvents() {
  // Save settings
  document.getElementById('rm-save-settings')?.addEventListener('click', () => {
    const s = loadRiskSettings();
    s.accountBalance = parseFloat(document.getElementById('rm-balance').value) || 10000;
    s.riskPercent = parseFloat(document.getElementById('rm-risk-pct').value) || 1;
    s.maxDailyLoss = parseFloat(document.getElementById('rm-max-daily').value) || 3;
    s.maxOpenTrades = parseInt(document.getElementById('rm-max-trades').value) || 3;
    saveRiskSettings(s);
    showToast('Risk settings saved!', 'success');

    // Re-render to update dashboard
    const container = document.getElementById('page-container');
    if (container) renderRiskManager(container);
  });

  // Position Size Calculator
  document.getElementById('rm-calc-btn')?.addEventListener('click', () => {
    const s = loadRiskSettings();
    const entry = parseFloat(document.getElementById('rm-entry').value);
    const sl = parseFloat(document.getElementById('rm-sl').value);

    if (!entry || !sl || entry === sl) {
      showToast('Enter valid entry and stop loss prices', 'error');
      return;
    }

    const slDistance = Math.abs(entry - sl);
    const riskAmount = s.accountBalance * (s.riskPercent / 100);
    const positionSize = riskAmount / slDistance;
    const direction = entry > sl ? 'LONG' : 'SHORT';

    // Pip calculation (forex-style if < 10, else stock-style)
    const pipSize = entry < 10 ? 0.0001 : 0.01;
    const slPips = (slDistance / pipSize).toFixed(1);

    const resultEl = document.getElementById('rm-calc-result');
    resultEl.innerHTML = `
      <div class="rm-calc-output">
        <div class="rm-calc-header ${direction === 'LONG' ? 'long' : 'short'}">
          <span class="rm-calc-dir">${direction === 'LONG' ? '🟢' : '🔴'} ${direction}</span>
          <span class="rm-calc-risk">Risk: $${riskAmount.toFixed(2)} (${s.riskPercent}%)</span>
        </div>
        <div class="rm-calc-grid">
          <div class="rm-calc-item highlight">
            <div class="rm-calc-item-label">Position Size</div>
            <div class="rm-calc-item-value">${positionSize.toFixed(2)} units</div>
          </div>
          <div class="rm-calc-item">
            <div class="rm-calc-item-label">SL Distance</div>
            <div class="rm-calc-item-value">${slDistance.toFixed(entry >= 100 ? 2 : 5)} (${slPips} pips)</div>
          </div>
          <div class="rm-calc-item">
            <div class="rm-calc-item-label">Entry</div>
            <div class="rm-calc-item-value">${entry}</div>
          </div>
          <div class="rm-calc-item">
            <div class="rm-calc-item-label">Stop Loss</div>
            <div class="rm-calc-item-value">${sl}</div>
          </div>
          <div class="rm-calc-item">
            <div class="rm-calc-item-label">Max Loss</div>
            <div class="rm-calc-item-value sell">-$${riskAmount.toFixed(2)}</div>
          </div>
          <div class="rm-calc-item">
            <div class="rm-calc-item-label">Lots (Forex)</div>
            <div class="rm-calc-item-value">${(positionSize / 100000).toFixed(2)} standard</div>
          </div>
        </div>
      </div>
    `;
  });

  // Log a simulated loss
  document.getElementById('rm-log-loss')?.addEventListener('click', () => {
    const lossVal = parseFloat(document.getElementById('rm-sim-loss').value);
    if (!lossVal || lossVal <= 0) {
      showToast('Enter a valid loss amount', 'error');
      return;
    }

    const s = loadRiskSettings();
    const dailyMax = s.accountBalance * (s.maxDailyLoss / 100);

    if (s.dailyLossUsed >= dailyMax) {
      showToast('🚫 Trading is BLOCKED — daily loss limit reached!', 'error');
      return;
    }

    s.dailyLossUsed += lossVal;
    s.accountBalance -= lossVal;

    // Log the trade
    const log = loadTradeLog();
    log.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      loss: lossVal,
      balanceAfter: s.accountBalance,
      dailyLossAfter: s.dailyLossUsed,
    });
    if (log.length > 50) log.pop();
    saveTradeLog(log);

    if (s.dailyLossUsed >= dailyMax) {
      s.tradesBlockedToday = true;
      showToast('🚫 DAILY LOSS LIMIT REACHED — Trading blocked for today!', 'error');
    } else {
      showToast(`Loss of $${lossVal.toFixed(2)} logged. Balance: $${s.accountBalance.toFixed(2)}`, 'info');
    }

    saveRiskSettings(s);

    // Re-render
    const container = document.getElementById('page-container');
    if (container) renderRiskManager(container);
  });

  // Reset daily loss
  document.getElementById('rm-reset-daily')?.addEventListener('click', () => {
    const s = loadRiskSettings();
    s.dailyLossUsed = 0;
    s.tradesBlockedToday = false;
    saveRiskSettings(s);
    showToast('Daily loss counter reset!', 'success');

    const container = document.getElementById('page-container');
    if (container) renderRiskManager(container);
  });
}

// ─── Trade Log Render ───────────────────────────────────────────────────────
function renderTradeLog() {
  const logEl = document.getElementById('rm-trade-log');
  if (!logEl) return;

  const log = loadTradeLog();
  if (log.length === 0) {
    logEl.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--gray-400);font-size:0.85rem;">
        No trades logged yet. Use the simulator above to test your risk limits.
      </div>
    `;
    return;
  }

  const rows = log.slice(0, 10).map(t => {
    const d = new Date(t.date);
    return `
      <div class="rm-log-row">
        <div class="rm-log-date">${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        <div class="rm-log-loss">-$${t.loss.toFixed(2)}</div>
        <div class="rm-log-balance">$${t.balanceAfter.toFixed(2)}</div>
      </div>
    `;
  }).join('');

  logEl.innerHTML = `
    <div class="rm-log-header-row">
      <span>Date/Time</span>
      <span>Loss</span>
      <span>Balance After</span>
    </div>
    ${rows}
    ${log.length > 10 ? `<div style="text-align:center;padding:8px;font-size:0.78rem;color:var(--gray-400);">Showing last 10 of ${log.length} entries</div>` : ''}
  `;
}
