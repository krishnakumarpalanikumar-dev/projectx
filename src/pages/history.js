import { getAnalysisHistory, deleteAnalysisFromHistory } from '../utils/storage.js';
import { showToast } from '../utils/toast.js';

export function renderHistory(container) {
  container.innerHTML = `
    <div class="history-layout" style="animation: fadeIn 0.4s ease;">
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header">
          <span class="card-title">💾 Local Database (History)</span>
          <div style="display:flex;gap:8px;align-items:center;">
            <button id="download-all-btn" class="btn btn-outline" style="padding:5px 12px;font-size:0.78rem;color:var(--purple-600);border-color:var(--purple-300);display:flex;align-items:center;gap:5px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download All
            </button>
            <span class="card-badge badge-purple">Backup</span>
          </div>
        </div>
        <div id="history-container" style="display:flex; flex-direction:column; gap:20px; padding-top:10px;">
          <!-- history items go here -->
        </div>
      </div>
    </div>
  `;
  
  loadHistoryUI();
}

function loadHistoryUI() {
  const container = document.getElementById('history-container');
  const history = getAnalysisHistory();
  
  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px; text-align: center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;display:inline-block;">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3 style="margin-bottom:10px; color:var(--gray-800);">No backups yet</h3>
        <p style="color:var(--gray-500);">Your analyzed charts will automatically be saved here locally.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = history.map(item => {
    const d = new Date(item.timestamp);
    const dateStr = d.toLocaleString();
    const result = item.result;
    
    const isBuy = result.signals?.recommendation === 'BUY';
    const isSell = result.signals?.recommendation === 'SELL';
    const signalLabel = result.signals?.recommendation || 'HOLD';
    const signalColor = isBuy ? 'var(--success)' : isSell ? 'var(--danger)' : 'var(--warning)';

    const trendColor = result.trend?.direction === 'bullish' ? 'var(--success)' : 
                     result.trend?.direction === 'bearish' ? 'var(--danger)' : 'var(--purple-600)';

    return `
      <div class="history-item" style="border:1px solid var(--gray-200);border-radius:var(--radius-md);overflow:hidden;display:flex;background:var(--white);box-shadow:0 2px 8px rgba(0,0,0,0.05);position:relative;">
        <div style="flex-shrink:0; width:300px; height:100%; border-right:1px solid var(--gray-200); background:#000;">
          <img src="${item.image}" style="width:100%;height:100%;min-height:220px;object-fit:cover;"/>
        </div>
        <div style="flex:1;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
            <div>
              <h3 style="margin:0 0 4px 0;font-size:1.2rem;color:var(--gray-900);">
                ${item.pair} <span style="font-size:0.85rem;color:var(--gray-500);font-weight:500;">(${item.timeframe})</span>
              </h3>
              <span style="font-size:0.8rem;color:var(--gray-500);font-family:var(--font-mono);">${dateStr}</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-outline download-history-btn" data-id="${item.id}" style="padding:6px 10px;font-size:0.75rem;color:var(--purple-600);border-color:var(--purple-300);display:flex;align-items:center;gap:4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
              <button class="btn btn-outline delete-history-btn" data-id="${item.id}" style="padding:6px 10px;font-size:0.75rem;color:var(--danger);border-color:var(--danger-light);">Delete</button>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;margin-bottom:16px;">
            <div style="background:var(--gray-50);padding:12px;border-radius:6px;border:1px solid var(--gray-100);">
              <div style="font-size:0.7rem;color:var(--gray-500);text-transform:uppercase;font-weight:700;margin-bottom:4px;">Signal Recommendation</div>
              <div style="font-weight:700;font-size:1.1rem;color:${signalColor};">${signalLabel} <span style="font-weight:500;font-size:0.8rem;color:var(--gray-600);">(Conf: ${result.signals?.confidence})</span></div>
            </div>
            <div style="background:var(--gray-50);padding:12px;border-radius:6px;border:1px solid var(--gray-100);">
              <div style="font-size:0.7rem;color:var(--gray-500);text-transform:uppercase;font-weight:700;margin-bottom:4px;">Trend Detected</div>
              <div style="font-weight:700;font-size:1.1rem;color:${trendColor};text-transform:capitalize;">${result.trend?.direction} <span style="font-weight:500;font-size:0.8rem;color:var(--gray-600);">(${result.trend?.strength})</span></div>
            </div>
          </div>
          
          <div style="font-size:0.9rem;color:var(--gray-800);background:var(--gray-50);padding:12px;border-radius:6px;font-family:var(--font-mono);">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span><strong>Entry:</strong> ${result.signals?.entry_price || 'N/A'}</span>
              <span><strong>Stop Loss:</strong> <span style="color:var(--danger);">${result.signals?.stop_loss || 'N/A'}</span></span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span><strong>TP1:</strong> <span style="color:var(--success);">${result.signals?.take_profit_1 || 'N/A'}</span></span>
              <span><strong>R:R:</strong> ${result.signals?.risk_reward_ratio || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Attach delete events
  document.querySelectorAll('.delete-history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      deleteAnalysisFromHistory(id);
      loadHistoryUI();
      showToast('Backup deleted', 'success');
    });
  });

  // Attach per-item download events
  document.querySelectorAll('.download-history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const item = history.find(h => h.id === id);
      if (!item) return;
      downloadAsReport([item], `${item.pair}_${item.timeframe}_${item.id}`);
      showToast('Download started', 'success');
    });
  });

  // Download All button
  document.getElementById('download-all-btn')?.addEventListener('click', () => {
    if (!history || history.length === 0) {
      showToast('No backups to download', 'error');
      return;
    }
    downloadAsReport(history, `tradevision_all_backups_${Date.now()}`);
    showToast(`Downloaded ${history.length} backup(s)`, 'success');
  });
}

function renderItemHTML(item) {
  const d = new Date(item.timestamp);
  const r = item.result;
  const sig = r.signals || {};
  const trend = r.trend || {};
  const signalColor = sig.recommendation === 'BUY' ? '#16a34a' : sig.recommendation === 'SELL' ? '#dc2626' : '#d97706';
  const trendColor = trend.direction === 'bullish' ? '#16a34a' : trend.direction === 'bearish' ? '#dc2626' : '#7c3aed';
  const imgTag = item.image ? `<img src="${item.image}" style="width:100%;max-height:300px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0;background:#000;"/>` : '';

  return `
  <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:32px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
      <div>
        <h2 style="margin:0 0 4px 0;font-size:1.4rem;color:#1e293b;">${item.pair} <span style="font-size:1rem;color:#64748b;font-weight:500;">(${item.timeframe})</span></h2>
        <div style="font-size:0.82rem;color:#94a3b8;font-family:monospace;">📅 ${d.toLocaleString()} &nbsp;|&nbsp; ID: ${item.id}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.6rem;font-weight:800;color:${signalColor};">${sig.recommendation || 'HOLD'}</div>
        <div style="font-size:0.78rem;color:#64748b;">Confidence: ${sig.confidence || 'N/A'}</div>
      </div>
    </div>
    ${imgTag}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px;">
      <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Trend</div>
        <div style="font-weight:700;font-size:1rem;color:${trendColor};text-transform:capitalize;">${trend.direction || 'N/A'} <span style="font-weight:400;font-size:0.82rem;color:#64748b;">(${trend.strength || 'N/A'})</span></div>
      </div>
      <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Entry Price</div>
        <div style="font-weight:700;font-size:1rem;color:#1e293b;">${sig.entry_price || 'N/A'}</div>
      </div>
      <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Risk:Reward</div>
        <div style="font-weight:700;font-size:1rem;color:#7c3aed;">${sig.risk_reward_ratio || 'N/A'}</div>
      </div>
      <div style="background:#fef2f2;padding:14px;border-radius:8px;border:1px solid #fecaca;">
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Stop Loss</div>
        <div style="font-weight:700;font-size:1rem;color:#dc2626;">${sig.stop_loss || 'N/A'}</div>
      </div>
      <div style="background:#f0fdf4;padding:14px;border-radius:8px;border:1px solid #bbf7d0;">
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Take Profit 1</div>
        <div style="font-weight:700;font-size:1rem;color:#16a34a;">${sig.take_profit_1 || 'N/A'}</div>
      </div>
      <div style="background:#f0fdf4;padding:14px;border-radius:8px;border:1px solid #bbf7d0;">
        <div style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Take Profit 2</div>
        <div style="font-weight:700;font-size:1rem;color:#16a34a;">${sig.take_profit_2 || 'N/A'}</div>
      </div>
    </div>
    ${r.summary ? `<div style="margin-top:16px;padding:14px;background:#f8fafc;border-radius:8px;border-left:4px solid #7c3aed;font-size:0.88rem;color:#334155;line-height:1.6;"><strong>📝 Summary:</strong><br/>${r.summary}</div>` : ''}
  </div>`;
}

function downloadAsReport(items, filename) {
  const arr = Array.isArray(items) ? items : [items];
  const body = arr.map(renderItemHTML).join('');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>TradeVision AI — Backup Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;padding:32px;}
    h1{font-size:1.6rem;margin-bottom:8px;color:#7c3aed;}
    .subtitle{font-size:0.85rem;color:#94a3b8;margin-bottom:32px;}
  </style>
</head>
<body>
  <h1>🤖 TradeVision AI — Analysis Report</h1>
  <div class="subtitle">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; ${arr.length} record(s)</div>
  ${body}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
