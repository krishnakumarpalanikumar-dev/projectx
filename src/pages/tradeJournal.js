// ============================================
// Trade Journal — Log, Track & Analyze Trades
// ============================================

import { showToast } from '../utils/toast.js';
import { STORAGE_KEYS, storage } from '../utils/storage.js';


let cachedTrades = [];

// ─── Stats Calculation ──────────────────────────────────────────────────────
function calcStats(trades) {
  if (trades.length === 0) return { total: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0, totalPnL: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, bestTrade: 0, worstTrade: 0, streak: 0 };

  let wins = 0, losses = 0, breakeven = 0, totalPnL = 0;
  let grossProfit = 0, grossLoss = 0;
  let best = -Infinity, worst = Infinity;
  let currentStreak = 0, bestStreak = 0;

  trades.forEach(t => {
    const pnl = parseFloat(t.pnl) || 0;
    totalPnL += pnl;
    if (pnl > 0) {
      wins++;
      grossProfit += pnl;
      currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
    } else if (pnl < 0) {
      losses++;
      grossLoss += Math.abs(pnl);
      currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
    } else {
      breakeven++;
      currentStreak = 0;
    }
    if (pnl > best) best = pnl;
    if (pnl < worst) worst = pnl;
    if (Math.abs(currentStreak) > Math.abs(bestStreak)) bestStreak = currentStreak;
  });

  return {
    total: trades.length,
    wins,
    losses,
    breakeven,
    winRate: trades.length > 0 ? ((wins / trades.length) * 100) : 0,
    totalPnL,
    avgWin: wins > 0 ? grossProfit / wins : 0,
    avgLoss: losses > 0 ? grossLoss / losses : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    bestTrade: best === -Infinity ? 0 : best,
    worstTrade: worst === Infinity ? 0 : worst,
    streak: bestStreak,
  };
}

// ─── Render ─────────────────────────────────────────────────────────────────
export function renderTradeJournal(container) {
  container.innerHTML = `<div style="padding: 40px; text-align: center;">Loading journal data...</div>`;
  
  try {
    const stored = storage.get(STORAGE_KEYS.TRADE_JOURNAL);
    cachedTrades = Array.isArray(stored) ? stored : [];
  } catch (err) {
    showToast('Failed to load trades', 'error');
    cachedTrades = [];
  }

  const stats = calcStats(cachedTrades);

  container.innerHTML = `
    <div class="tj-layout" style="animation: fadeIn 0.4s ease;">

      <!-- ── Performance Overview ──────────────── -->
      <div class="tj-perf-grid">
        <div class="tj-perf-card ${stats.totalPnL >= 0 ? 'profit' : 'loss'}">
          <div class="tj-perf-label">Total P&L</div>
          <div class="tj-perf-value">${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toFixed(2)}</div>
        </div>
        <div class="tj-perf-card">
          <div class="tj-perf-label">Win Rate</div>
          <div class="tj-perf-value">${stats.winRate.toFixed(1)}%</div>
          <div class="tj-perf-bar-track"><div class="tj-perf-bar-fill ${stats.winRate >= 50 ? 'good' : 'bad'}" style="width:${Math.min(stats.winRate, 100)}%"></div></div>
        </div>
        <div class="tj-perf-card">
          <div class="tj-perf-label">Total Trades</div>
          <div class="tj-perf-value">${stats.total}</div>
          <div class="tj-perf-sub">${stats.wins}W / ${stats.losses}L / ${stats.breakeven}BE</div>
        </div>
        <div class="tj-perf-card">
          <div class="tj-perf-label">Profit Factor</div>
          <div class="tj-perf-value">${stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}</div>
          <div class="tj-perf-sub">${stats.profitFactor >= 1.5 ? '✅ Good' : stats.profitFactor >= 1 ? '⚠️ Marginal' : '❌ Negative'}</div>
        </div>
      </div>

      <!-- ── Two Column Layout ────────────────── -->
      <div class="tj-grid">

        <!-- LEFT: Add Trade Form -->
        <div class="tj-left-col">
          <div class="card tj-card">
            <div class="card-header">
              <span class="card-title">📝 Log New Trade</span>
              <span class="card-badge badge-purple">Manual</span>
            </div>
            <div class="tj-form" id="tj-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="tj-pair">Trading Pair</label>
                  <input type="text" id="tj-pair" placeholder="e.g., EUR/USD" />
                </div>
                <div class="form-group">
                  <label for="tj-direction">Direction</label>
                  <select id="tj-direction">
                    <option value="LONG">🟢 LONG (Buy)</option>
                    <option value="SHORT">🔴 SHORT (Sell)</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="tj-entry">Entry Price</label>
                  <input type="number" id="tj-entry" placeholder="e.g., 1.0850" step="any" />
                </div>
                <div class="form-group">
                  <label for="tj-exit">Exit Price</label>
                  <input type="number" id="tj-exit" placeholder="e.g., 1.0920" step="any" />
                </div>
              </div>
              <div class="form-group">
                <label for="tj-size">Position Size (units)</label>
                <input type="number" id="tj-size" placeholder="e.g., 10000" step="any" />
              </div>
              <div class="form-group">
                <label for="tj-notes">Notes</label>
                <textarea id="tj-notes" rows="3" placeholder="Why did you take this trade? What was the setup?"></textarea>
              </div>
              <button class="tj-submit-btn" id="tj-add-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Log Trade
              </button>
            </div>
          </div>

          <!-- Extra Stats Card -->
          <div class="card tj-card">
            <div class="card-header">
              <span class="card-title">📊 Detailed Stats</span>
            </div>
            <div class="tj-detail-stats">
              <div class="tj-dstat">
                <span class="tj-dstat-label">Avg Win</span>
                <span class="tj-dstat-value buy">+$${stats.avgWin.toFixed(2)}</span>
              </div>
              <div class="tj-dstat">
                <span class="tj-dstat-label">Avg Loss</span>
                <span class="tj-dstat-value sell">-$${stats.avgLoss.toFixed(2)}</span>
              </div>
              <div class="tj-dstat">
                <span class="tj-dstat-label">Best Trade</span>
                <span class="tj-dstat-value buy">+$${stats.bestTrade.toFixed(2)}</span>
              </div>
              <div class="tj-dstat">
                <span class="tj-dstat-label">Worst Trade</span>
                <span class="tj-dstat-value sell">$${stats.worstTrade.toFixed(2)}</span>
              </div>
              <div class="tj-dstat">
                <span class="tj-dstat-label">Best Streak</span>
                <span class="tj-dstat-value">${stats.streak > 0 ? stats.streak + 'W' : stats.streak < 0 ? Math.abs(stats.streak) + 'L' : '—'}</span>
              </div>
              <div class="tj-dstat">
                <span class="tj-dstat-label">Avg R:R</span>
                <span class="tj-dstat-value">${stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Trade History Table -->
        <div class="tj-right-col">
          <div class="card tj-card">
            <div class="card-header">
              <span class="card-title">📋 Trade History</span>
            </div>
            <div id="tj-trade-list">
              <!-- trade rows go here -->
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  renderTradeList();
  initJournalEvents();
}

// ─── Trade List ─────────────────────────────────────────────────────────────
function renderTradeList() {
  const el = document.getElementById('tj-trade-list');
  if (!el) return;

  const trades = cachedTrades;
  if (trades.length === 0) {
    el.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;">
        <h3 style="color:var(--gray-500);font-size:1rem;margin-bottom:6px;">No Trades Yet</h3>
        <p style="color:var(--gray-400);font-size:0.85rem;">Use the form on the left to log your first trade.</p>
      </div>
    `;
    return;
  }

  const rows = trades.map((t, i) => {
    const pnl = parseFloat(t.pnl) || 0;
    const isWin = pnl > 0;
    const isLoss = pnl < 0;
    const d = new Date(t.date);

    return `
      <div class="tj-row ${isWin ? 'win' : isLoss ? 'loss' : 'be'}">
        <div class="tj-row-main">
          <div class="tj-row-pair">
            <span class="tj-dir-badge ${t.direction === 'LONG' ? 'long' : 'short'}">${t.direction === 'LONG' ? '▲' : '▼'}</span>
            <span class="tj-pair-name">${t.pair}</span>
          </div>
          <div class="tj-row-prices">
            <span>Entry: <strong>${t.entry}</strong></span>
            <span class="tj-arrow">→</span>
            <span>Exit: <strong>${t.exit}</strong></span>
          </div>
          <div class="tj-row-pnl ${isWin ? 'buy' : isLoss ? 'sell' : ''}">
            ${isWin ? '+' : ''}$${pnl.toFixed(2)}
          </div>
          <div class="tj-row-date">${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
          <button class="tj-del-btn" data-id="${t._id}" title="Delete trade">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
        ${t.notes ? `<div class="tj-row-notes">📝 ${t.notes}</div>` : ''}
      </div>
    `;
  }).join('');

  el.innerHTML = rows;

  // Delete buttons
  el.querySelectorAll('.tj-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      cachedTrades = cachedTrades.filter(t => t._id !== id);
      storage.set(STORAGE_KEYS.TRADE_JOURNAL, cachedTrades);
      showToast('Trade deleted', 'info');
      const container = document.getElementById('page-container');
      if (container) renderTradeJournal(container);
    });
  });
}

// ─── Events ─────────────────────────────────────────────────────────────────
function initJournalEvents() {
  document.getElementById('tj-add-btn')?.addEventListener('click', () => {
    const pair = document.getElementById('tj-pair').value.trim().toUpperCase();
    const direction = document.getElementById('tj-direction').value;
    const entry = parseFloat(document.getElementById('tj-entry').value);
    const exit = parseFloat(document.getElementById('tj-exit').value);
    const size = parseFloat(document.getElementById('tj-size').value);
    const notes = document.getElementById('tj-notes').value.trim();

    if (!pair || !entry || !exit || !size) { 
      showToast('Please fill all required fields', 'error'); 
      return; 
    }

    let pnl = direction === 'LONG' ? (exit - entry) * size : (entry - exit) * size;
    pnl = parseFloat(pnl.toFixed(2));

    const trade = { _id: Date.now().toString(), pair, direction, entry, exit, pnl, notes, date: new Date().toISOString() };
    cachedTrades.unshift(trade);
    storage.set(STORAGE_KEYS.TRADE_JOURNAL, cachedTrades);
    showToast(`Trade logged: ${pair} ${direction}`, 'success');
    
    const container = document.getElementById('page-container');
    if (container) renderTradeJournal(container);
  });
}
