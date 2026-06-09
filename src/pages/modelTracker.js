// ============================================
// Model Performance Tracker
// ============================================

const STORAGE_KEY = 'tv_model_predictions';

function getPredictions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function savePredictions(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function isToday(ts) {
  const d = new Date(ts), t = new Date();
  return d.toDateString() === t.toDateString();
}

function computeConfusion(preds) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  preds.forEach(p => {
    if (p.predicted === 'BUY' && p.actual === 'BUY') tp++;
    else if (p.predicted === 'BUY' && p.actual === 'SELL') fp++;
    else if (p.predicted === 'SELL' && p.actual === 'BUY') fn++;
    else tn++;
  });
  return { tp, fp, fn, tn };
}

function computeMetrics(preds, cm) {
  const { tp, fp, fn, tn } = cm;
  const total = tp + fp + fn + tn;
  if (total === 0) return { accuracy: 0, winRate: 0, precision: 0, recall: 0, f1: 0, specificity: 0, mcc: 0 };
  const accuracy = (tp + tn) / total;
  const wins = preds.filter(p => p.pnl > 0).length;
  const winRate = wins / total;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0;
  const denom = Math.sqrt((tp+fp) * (tp+fn) * (tn+fp) * (tn+fn));
  const mcc = denom > 0 ? (tp * tn - fp * fn) / denom : 0;
  return { accuracy, winRate, precision, recall, f1, specificity, mcc };
}

function metricStatus(value, thresholds) {
  if (value >= thresholds[0]) return 'good';
  if (value >= thresholds[1]) return 'warn';
  return 'bad';
}

function getStatus(key, val) {
  const t = {
    accuracy: [0.70, 0.50], winRate: [0.75, 0.65], precision: [0.70, 0.50],
    f1: [0.70, 0.50], specificity: [0.70, 0.50], mcc: [0.40, 0.20]
  };
  return metricStatus(val, t[key] || [0.70, 0.50]);
}

function pct(v) { return (v * 100).toFixed(1) + '%'; }
function fmt(v) { return v >= 0 ? '+$' + v.toFixed(2) : '-$' + Math.abs(v).toFixed(2); }

function metricCard(label, key, value) {
  const s = getStatus(key, value);
  const display = key === 'mcc' ? value.toFixed(3) : pct(value);
  return `<div class="mt-metric-card mt-${s}">
    <div class="mt-metric-label">${label}</div>
    <div class="mt-metric-value">${display}</div>
    <div class="mt-metric-status">${s === 'good' ? '✅ On Target' : s === 'warn' ? '⚠️ Borderline' : '🔴 Below Target'}</div>
  </div>`;
}

// ============================================
// Draw Equity Curve
// ============================================
function drawEquityCurve(predictions) {
  const canvas = document.getElementById('mt-equity-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth - 48;
  canvas.height = 200;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (predictions.length < 2) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Log at least 2 predictions to see equity curve', W / 2, H / 2);
    return;
  }

  let cumPnl = [0];
  predictions.forEach(p => cumPnl.push(cumPnl[cumPnl.length - 1] + p.pnl));
  const maxV = Math.max(...cumPnl), minV = Math.min(...cumPnl);
  const range = (maxV - minV) || 1;
  const pad = { t: 25, b: 25, l: 55, r: 20 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;

  const toX = i => pad.l + (i / (cumPnl.length - 1)) * cW;
  const toY = v => pad.t + (1 - (v - minV) / range) * cH;

  // Gridlines
  ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * cH;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    const val = maxV - (i / 4) * range;
    ctx.fillStyle = '#94A3B8'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText('$' + val.toFixed(0), pad.l - 8, y + 4);
  }

  // Zero line
  if (minV < 0 && maxV > 0) {
    const zY = toY(0);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, zY); ctx.lineTo(W - pad.r, zY); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Equity line with gradient fill
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(cumPnl[0]));
  for (let i = 1; i < cumPnl.length; i++) ctx.lineTo(toX(i), toY(cumPnl[i]));
  const lastVal = cumPnl[cumPnl.length - 1];
  ctx.strokeStyle = lastVal >= 0 ? '#16A34A' : '#DC2626';
  ctx.lineWidth = 2.5; ctx.stroke();

  // Fill
  ctx.lineTo(toX(cumPnl.length - 1), pad.t + cH);
  ctx.lineTo(toX(0), pad.t + cH); ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
  if (lastVal >= 0) { grad.addColorStop(0, 'rgba(22,163,74,0.15)'); grad.addColorStop(1, 'rgba(22,163,74,0)'); }
  else { grad.addColorStop(0, 'rgba(220,38,38,0.15)'); grad.addColorStop(1, 'rgba(220,38,38,0)'); }
  ctx.fillStyle = grad; ctx.fill();

  // Peak & Low markers
  const peakIdx = cumPnl.indexOf(maxV), lowIdx = cumPnl.indexOf(minV);
  [[peakIdx, maxV, '#16A34A', '▲'], [lowIdx, minV, '#DC2626', '▼']].forEach(([idx, val, color, arrow]) => {
    ctx.beginPath(); ctx.arc(toX(idx), toY(val), 4, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = color; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(arrow + ' $' + val.toFixed(2), toX(idx), toY(val) - 10);
  });
}

// ============================================
// Render
// ============================================
export function renderModelTracker(container) {
  const predictions = getPredictions();
  const cm = computeConfusion(predictions);
  const m = computeMetrics(predictions, cm);
  const last10 = predictions.slice(-10);
  const l10cm = computeConfusion(last10);
  const l10m = computeMetrics(last10, l10cm);
  const todayCount = predictions.filter(p => isToday(p.timestamp)).length;
  const totalPnl = predictions.reduce((s, p) => s + p.pnl, 0);
  const total = predictions.length;

  // Degradation check
  const isDegraded = total >= 10 && (m.winRate - l10m.winRate) > 0.10;

  container.innerHTML = `<div class="mt-layout">
    <!-- Degradation Alert -->
    ${isDegraded ? `<div class="rm-alert-bar rm-alert-danger mt-degrade-alert">
      <span class="rm-alert-icon">🚨</span>
      <div><strong>Model Degradation Detected!</strong> Your last 10 trades win rate (${pct(l10m.winRate)}) is ${pct(m.winRate - l10m.winRate)} below your overall (${pct(m.winRate)}). Consider retraining your model.</div>
    </div>` : ''}

    <!-- 6 Metric Cards -->
    <div class="mt-metrics-grid">
      ${metricCard('Accuracy', 'accuracy', m.accuracy)}
      ${metricCard('Win Rate', 'winRate', m.winRate)}
      ${metricCard('Precision', 'precision', m.precision)}
      ${metricCard('F1-Score', 'f1', m.f1)}
      ${metricCard('Specificity', 'specificity', m.specificity)}
      ${metricCard('MCC', 'mcc', m.mcc)}
    </div>

    <!-- Two-column layout -->
    <div class="mt-grid">
      <!-- Left: Target Tracker + Log Form -->
      <div class="mt-left-col">
        <div class="card">
          <div class="card-header"><span class="card-title">🎯 Target Tracker</span><span class="card-badge badge-purple">Live</span></div>
          <div class="mt-targets-grid">
            <div class="mt-target-item">
              <div class="mt-target-label">Min Win Rate (65%)</div>
              <div class="mt-target-bar"><div class="mt-target-fill ${m.winRate >= 0.65 ? 'good' : 'bad'}" style="width:${Math.min(m.winRate / 0.65 * 100, 100)}%"></div></div>
              <div class="mt-target-val ${m.winRate >= 0.65 ? 'buy' : 'sell'}">${pct(m.winRate)} ${m.winRate >= 0.65 ? '✅' : '❌'}</div>
            </div>
            <div class="mt-target-item">
              <div class="mt-target-label">Ideal Win Rate (75%)</div>
              <div class="mt-target-bar"><div class="mt-target-fill ${m.winRate >= 0.75 ? 'good' : m.winRate >= 0.65 ? 'warn' : 'bad'}" style="width:${Math.min(m.winRate / 0.75 * 100, 100)}%"></div></div>
              <div class="mt-target-val ${m.winRate >= 0.75 ? 'buy' : 'sell'}">${pct(m.winRate)} ${m.winRate >= 0.75 ? '✅' : '⚠️'}</div>
            </div>
            <div class="mt-target-item">
              <div class="mt-target-label">Today's Trades (limit: 10)</div>
              <div class="mt-target-bar"><div class="mt-target-fill ${todayCount <= 10 ? 'good' : 'bad'}" style="width:${Math.min(todayCount / 10 * 100, 100)}%"></div></div>
              <div class="mt-target-val">${todayCount} / 10</div>
            </div>
            <div class="mt-target-item">
              <div class="mt-target-label">Total P&L (All-Time)</div>
              <div class="mt-target-val ${totalPnl >= 0 ? 'buy' : 'sell'}" style="font-size:1.3rem">${fmt(totalPnl)}</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:20px">
          <div class="card-header"><span class="card-title">📝 Log Prediction</span></div>
          <form id="mt-log-form" class="rm-form">
            <div class="form-group"><label>Trading Pair</label><input type="text" id="mt-pair" placeholder="e.g. EUR/USD" required /></div>
            <div class="form-group"><label>Model Predicted</label><select id="mt-predicted"><option value="BUY">BUY ↑</option><option value="SELL">SELL ↓</option></select></div>
            <div class="form-group"><label>Actual Outcome</label><select id="mt-actual"><option value="BUY">BUY ↑</option><option value="SELL">SELL ↓</option></select></div>
            <div class="form-group"><label>P&L ($)</label><input type="number" id="mt-pnl" step="0.01" placeholder="e.g. 25.50 or -15.00" required /></div>
            <button type="submit" class="analyze-btn" ${todayCount >= 10 ? 'disabled title="Daily limit reached"' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>
              Log Prediction
            </button>
          </form>
        </div>
      </div>

      <!-- Right: Equity Curve + Confusion Matrix -->
      <div class="mt-right-col">
        <div class="card">
          <div class="card-header"><span class="card-title">📈 Equity Curve</span><span class="card-badge ${totalPnl >= 0 ? 'badge-success' : 'badge-danger'}">${fmt(totalPnl)}</span></div>
          <canvas id="mt-equity-canvas"></canvas>
        </div>

        <div class="card" style="margin-top:20px">
          <div class="card-header"><span class="card-title">🧮 Confusion Matrix</span><span class="card-badge badge-purple">${total} total</span></div>
          <div class="mt-cm-grid">
            <div class="mt-cm-corner"></div>
            <div class="mt-cm-head">Actual BUY</div>
            <div class="mt-cm-head">Actual SELL</div>
            <div class="mt-cm-head mt-cm-row-label">Pred BUY</div>
            <div class="mt-cm-cell mt-cm-tp"><div class="mt-cm-num">${cm.tp}</div><div class="mt-cm-tag">TP</div></div>
            <div class="mt-cm-cell mt-cm-fp"><div class="mt-cm-num">${cm.fp}</div><div class="mt-cm-tag">FP</div></div>
            <div class="mt-cm-head mt-cm-row-label">Pred SELL</div>
            <div class="mt-cm-cell mt-cm-fn"><div class="mt-cm-num">${cm.fn}</div><div class="mt-cm-tag">FN</div></div>
            <div class="mt-cm-cell mt-cm-tn"><div class="mt-cm-num">${cm.tn}</div><div class="mt-cm-tag">TN</div></div>
          </div>
          <div class="mt-cm-legend">
            <span>🟢 TP = Correct BUY</span><span>🔴 FP = False BUY</span>
            <span>🟠 FN = Missed BUY</span><span>🔵 TN = Correct SELL</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rolling Last-10 -->
    <div class="card">
      <div class="card-header"><span class="card-title">📊 Rolling Last-10 Metrics</span><span class="card-badge badge-info">Recent Performance</span></div>
      ${last10.length === 0 ? '<div class="empty-state"><p>No predictions yet. Log your first prediction above.</p></div>' : `
      <div class="mt-rolling-visual">
        <div class="mt-rolling-blocks">${last10.map((p, i) => `<div class="mt-block ${p.predicted === p.actual ? 'hit' : 'miss'}" title="Trade ${total - last10.length + i + 1}: ${p.pair} ${p.predicted === p.actual ? 'HIT' : 'MISS'} ${fmt(p.pnl)}">${p.predicted === p.actual ? '✓' : '✗'}</div>`).join('')}</div>
      </div>
      <div class="mt-rolling-compare">
        ${[['Accuracy', m.accuracy, l10m.accuracy], ['Win Rate', m.winRate, l10m.winRate], ['Precision', m.precision, l10m.precision], ['F1-Score', m.f1, l10m.f1]].map(([label, overall, recent]) => `
        <div class="mt-compare-row">
          <span class="mt-compare-label">${label}</span>
          <div class="mt-compare-bars">
            <div class="mt-bar-group"><span class="mt-bar-tag">Overall</span><div class="mt-bar-track"><div class="mt-bar-fill overall" style="width:${overall * 100}%"></div></div><span class="mt-bar-val">${pct(overall)}</span></div>
            <div class="mt-bar-group"><span class="mt-bar-tag">Last 10</span><div class="mt-bar-track"><div class="mt-bar-fill recent ${recent < overall - 0.1 ? 'declining' : ''}" style="width:${recent * 100}%"></div></div><span class="mt-bar-val">${pct(recent)}</span></div>
          </div>
        </div>`).join('')}
      </div>`}
    </div>

    <!-- Prediction Log Feed -->
    <div class="card">
      <div class="card-header"><span class="card-title">📋 Prediction Log</span><span class="card-badge badge-purple">${total} entries</span>
        ${total > 0 ? '<button class="btn btn-outline mt-clear-btn" id="mt-clear-all" style="margin-left:auto;padding:6px 14px;font-size:0.78rem">Clear All</button>' : ''}
      </div>
      ${total === 0 ? '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><h3>No Predictions Logged</h3><p>Start logging your model\'s predictions to track performance metrics in real time.</p></div>' : `
      <div class="mt-log-list" style="max-height:320px;overflow-y:auto">
        ${[...predictions].reverse().map((p, i) => {
          const hit = p.predicted === p.actual;
          return `<div class="tj-row ${hit ? 'win' : 'loss'}">
            <div class="tj-row-main">
              <div class="tj-row-pair">
                <span class="tj-dir-badge ${p.predicted === 'BUY' ? 'long' : 'short'}">${p.predicted === 'BUY' ? 'B' : 'S'}</span>
                <span class="tj-pair-name">${p.pair}</span>
              </div>
              <span class="signal-type ${hit ? 'buy' : 'sell'}" style="font-size:0.72rem">${hit ? '✅ HIT' : '❌ MISS'}</span>
              <span class="tj-row-prices">Pred: ${p.predicted} → Actual: ${p.actual}</span>
              <span class="tj-row-pnl ${p.pnl >= 0 ? 'buy' : 'sell'}">${fmt(p.pnl)}</span>
              <span class="tj-row-date">${new Date(p.timestamp).toLocaleString()}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`}
    </div>

    <!-- Formula Verification Table -->
    <div class="card">
      <div class="card-header"><span class="card-title">🔬 Formula Verification</span><span class="card-badge badge-info">Transparent Calculations</span></div>
      ${total === 0 ? '<p style="color:var(--gray-400);font-size:0.88rem">Log predictions to see formula breakdowns.</p>' : `
      <div style="overflow-x:auto">
        <table class="market-table" style="min-width:700px">
          <thead><tr><th>Metric</th><th>Formula</th><th>Your Values</th><th>Result</th><th>Status</th></tr></thead>
          <tbody>
            ${formulaRow('Accuracy', '(TP+TN) / Total', `(${cm.tp}+${cm.tn}) / ${total}`, m.accuracy, 'accuracy')}
            ${formulaRow('Win Rate', 'Profitable / Total', `${predictions.filter(p=>p.pnl>0).length} / ${total}`, m.winRate, 'winRate')}
            ${formulaRow('Precision', 'TP / (TP+FP)', `${cm.tp} / (${cm.tp}+${cm.fp})`, m.precision, 'precision')}
            ${formulaRow('Recall', 'TP / (TP+FN)', `${cm.tp} / (${cm.tp}+${cm.fn})`, m.recall || 0, 'accuracy')}
            ${formulaRow('F1-Score', '2·P·R / (P+R)', `2·${m.precision.toFixed(2)}·${(m.recall||0).toFixed(2)} / (${m.precision.toFixed(2)}+${(m.recall||0).toFixed(2)})`, m.f1, 'f1')}
            ${formulaRow('Specificity', 'TN / (TN+FP)', `${cm.tn} / (${cm.tn}+${cm.fp})`, m.specificity, 'specificity')}
            ${formulaRow('MCC', '(TP·TN-FP·FN) / √(…)', `(${cm.tp}·${cm.tn}-${cm.fp}·${cm.fn}) / √(…)`, m.mcc, 'mcc')}
          </tbody>
        </table>
      </div>`}
    </div>
  </div>`;

  // Event listeners
  const form = document.getElementById('mt-log-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const pair = document.getElementById('mt-pair').value.trim().toUpperCase();
      const predicted = document.getElementById('mt-predicted').value;
      const actual = document.getElementById('mt-actual').value;
      const pnl = parseFloat(document.getElementById('mt-pnl').value);
      if (!pair || isNaN(pnl)) return;
      const preds = getPredictions();
      preds.push({ pair, predicted, actual, pnl, timestamp: Date.now() });
      savePredictions(preds);
      renderModelTracker(container);
    });
  }

  const clearBtn = document.getElementById('mt-clear-all');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all prediction data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        renderModelTracker(container);
      }
    });
  }

  // Draw equity curve
  setTimeout(() => drawEquityCurve(predictions), 50);
  window.addEventListener('resize', () => drawEquityCurve(predictions), { once: true });
}

function formulaRow(name, formula, values, result, key) {
  const s = getStatus(key, result);
  const display = key === 'mcc' ? result.toFixed(3) : pct(result);
  return `<tr>
    <td style="font-weight:700">${name}</td>
    <td><code style="font-size:0.8rem;background:var(--purple-50);padding:2px 8px;border-radius:4px">${formula}</code></td>
    <td style="font-family:var(--font-mono);font-size:0.82rem">${values}</td>
    <td style="font-weight:700">${display}</td>
    <td><span class="signal-type ${s === 'good' ? 'buy' : 'sell'}" style="font-size:0.72rem">${s === 'good' ? '✅ PASS' : s === 'warn' ? '⚠️ BORDER' : '❌ FAIL'}</span></td>
  </tr>`;
}
