// ============================================
// Trade Journal — Log, Track & Analyze Trades
// ============================================

import { showToast } from '../utils/toast.js';

const JOURNAL_KEY = 'tradevision_trade_journal';

// ─── Persistence ────────────────────────────────────────────────────────────
function loadJournal() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveJournal(journal) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
}

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
  const trades = loadJournal();
  const stats = calcStats(trades);

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
              <div class="form-group">
                <label for="tj-pair">Trading Pair</label>
                <input type="text" id="tj-pair" placeholder="e.g., EUR/USD, BTC/USDT" />
              </div>
              <div class="form-group">
                <label for="tj-direction">Direction</label>
                <select id="tj-direction">
                  <option value="LONG">🟢 LONG (Buy)</option>
                  <option value="SHORT">🔴 SHORT (Sell)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="tj-entry">Entry Price</label>
                <input type="number" id="tj-entry" placeholder="e.g., 1.0850" step="any" />
              </div>
              <div class="form-group">
                <label for="tj-exit">Exit Price</label>
                <input type="number" id="tj-exit" placeholder="e.g., 1.0920" step="any" />
              </div>
              <div class="form-group">
                <label for="tj-size">Position Size (units)</label>
                <input type="number" id="tj-size" placeholder="e.g., 10000" step="any" />
              </div>
              <div class="form-group">
                <label for="tj-timeframe">Timeframe</label>
                <select id="tj-timeframe">
                  <option value="1m">1 Minute</option>
                  <option value="5m">5 Minutes</option>
                  <option value="15m">15 Minutes</option>
                  <option value="30m">30 Minutes</option>
                  <option value="1h" selected>1 Hour</option>
                  <option value="4h">4 Hours</option>
                  <option value="1d">1 Day</option>
                  <option value="1w">1 Week</option>
                </select>
              </div>
              <div class="form-group" style="grid-column:1/-1;">
                <label for="tj-notes">Notes</label>
                <textarea id="tj-notes" rows="3" placeholder="Why did you take this trade? What was the setup?" style="width:100%;padding:10px 14px;border:1px solid var(--gray-200);border-radius:var(--radius-md);font-size:0.88rem;color:var(--gray-800);resize:vertical;outline:none;font-family:inherit;"></textarea>
              </div>
              <button class="analyze-btn" id="tj-add-btn" style="grid-column:1/-1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Log Trade
              </button>
            </div>
          </div>

          <!-- Extra Stats Card -->
          <div class="card tj-card" style="margin-top:20px;">
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
              <div style="display:flex;gap:8px;">
                <button class="btn btn-outline" id="tj-export-btn" style="padding:4px 12px;font-size:0.72rem;">Export CSV</button>
                <button class="btn btn-outline" id="tj-clear-btn" style="padding:4px 12px;font-size:0.72rem;color:var(--danger);border-color:rgba(220,38,38,0.3);">Clear All</button>
              </div>
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

  const trades = loadJournal();
  if (trades.length === 0) {
    el.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:var(--gray-300);margin:0 auto 16px;display:block;">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
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
            <span class="tj-tf-badge">${t.timeframe}</span>
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
          <button class="tj-del-btn" data-index="${i}" title="Delete trade">
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
      const idx = parseInt(btn.dataset.index);
      const journal = loadJournal();
      journal.splice(idx, 1);
      saveJournal(journal);
      showToast('Trade deleted', 'info');
      const container = document.getElementById('page-container');
      if (container) renderTradeJournal(container);
    });
  });
}

// ─── Events ─────────────────────────────────────────────────────────────────
function initJournalEvents() {
  // Add trade
  document.getElementById('tj-add-btn')?.addEventListener('click', () => {
    const pair = document.getElementById('tj-pair').value.trim().toUpperCase();
    const direction = document.getElementById('tj-direction').value;
    const entry = parseFloat(document.getElementById('tj-entry').value);
    const exit = parseFloat(document.getElementById('tj-exit').value);
    const size = parseFloat(document.getElementById('tj-size').value);
    const timeframe = document.getElementById('tj-timeframe').value;
    const notes = document.getElementById('tj-notes').value.trim();

    if (!pair) { showToast('Enter the trading pair', 'error'); return; }
    if (!entry || !exit) { showToast('Enter entry and exit prices', 'error'); return; }
    if (!size || size <= 0) { showToast('Enter a valid position size', 'error'); return; }

    // Calculate P&L
    let pnl;
    if (direction === 'LONG') {
      pnl = (exit - entry) * size;
    } else {
      pnl = (entry - exit) * size;
    }

    const trade = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pair,
      direction,
      entry,
      exit,
      size,
      timeframe,
      notes,
      pnl: pnl.toFixed(2),
    };

    const journal = loadJournal();
    journal.unshift(trade);
    if (journal.length > 200) journal.pop();
    saveJournal(journal);

    const label = pnl >= 0 ? `+$${pnl.toFixed(2)} profit` : `-$${Math.abs(pnl).toFixed(2)} loss`;
    showToast(`Trade logged: ${pair} ${direction} — ${label}`, pnl >= 0 ? 'success' : 'error');

    const container = document.getElementById('page-container');
    if (container) renderTradeJournal(container);
  });

  // Export CSV
  document.getElementById('tj-export-btn')?.addEventListener('click', () => {
    const trades = loadJournal();
    if (trades.length === 0) { showToast('No trades to export', 'error'); return; }

    const header = 'Date,Pair,Direction,Entry,Exit,Size,Timeframe,P&L,Notes\n';
    const rows = trades.map(t => {
      const d = new Date(t.date);
      return `"${d.toLocaleDateString()} ${d.toLocaleTimeString()}","${t.pair}","${t.direction}",${t.entry},${t.exit},${t.size},"${t.timeframe}",${t.pnl},"${(t.notes || '').replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade_journal_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Trade journal exported!', 'success');
  });

  // Clear all
  document.getElementById('tj-clear-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL trade history? This cannot be undone.')) {
      saveJournal([]);
      showToast('All trades cleared', 'info');
      const container = document.getElementById('page-container');
      if (container) renderTradeJournal(container);
    }
  });
}
