// Trade Signals Page

import { generateSignals } from '../utils/gemini.js';
import { showToast } from '../utils/toast.js';

export function renderSignals(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div class="market-tabs">
        <button class="market-tab active" data-signal-tab="forex" id="signal-tab-forex">💱 Forex</button>
        <button class="market-tab" data-signal-tab="crypto" id="signal-tab-crypto">🪙 Crypto</button>
        <button class="market-tab" data-signal-tab="stocks" id="signal-tab-stocks">📈 Stocks</button>
      </div>
      <button class="btn btn-primary" id="generate-signals-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        Generate AI Signals
      </button>
    </div>

    <div id="signals-container">
      <div class="card">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>
          </svg>
          <h3>No Signals Generated</h3>
          <p>Click "Generate AI Signals" to get AI-powered trading signals for your selected market.</p>
        </div>
      </div>
    </div>
  `;

  let currentTab = 'forex';

  const showStocksNotice = () => {
    const signalsContainer = document.getElementById('signals-container');
    signalsContainer.innerHTML = `
      <div class="card" style="border:1.5px solid var(--warning, #f59e0b);background:#fffbeb;padding:40px 24px;text-align:center;">
        <div style="font-size:2.8rem;margin-bottom:12px;">📈</div>
        <h3 style="color:var(--gray-800);margin-bottom:8px;font-size:1.2rem;">Stocks Live Data</h3>
        <p style="color:var(--gray-600);font-size:0.95rem;max-width:480px;margin:0 auto 16px;">
          Coming soon — not yet connected to live data.
        </p>
        <span style="font-size:0.82rem;color:var(--gray-500);background:#fef3c7;padding:4px 12px;border-radius:20px;">
          Currently supported: EUR/USD, XAU/USD, GBP/USD, USD/JPY, AUD/USD, BTC/USDT
        </span>
      </div>
    `;
  };

  // Tab switching
  document.querySelectorAll('[data-signal-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-signal-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.signalTab;

      if (currentTab === 'stocks') {
        showStocksNotice();
      }
    });
  });

  // Generate signals
  document.getElementById('generate-signals-btn').addEventListener('click', async () => {
    const btn = document.getElementById('generate-signals-btn');
    const signalsContainer = document.getElementById('signals-container');

    if (currentTab === 'stocks') {
      showStocksNotice();
      showToast('Stocks live data coming soon — please select Forex or Crypto.', 'info');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Generating...';

    signalsContainer.innerHTML = `
      <div style="text-align:center;padding:40px;">
        <div class="spinner" style="width:32px;height:32px;border:3px solid var(--purple-100);border-top-color:var(--purple-600);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
        <p style="color:var(--gray-500);font-size:0.88rem;">AI is generating ${currentTab} signals...</p>
      </div>
    `;

    try {
      const result = await generateSignals(currentTab);
      displaySignals(result.signals || [], signalsContainer);
      showToast(`${result.signals?.length || 0} signals generated!`, 'success');
    } catch (error) {
      showToast(`Failed: ${error.message}`, 'error');
      signalsContainer.innerHTML = `
        <div class="card" style="border:1.5px solid var(--danger);background:#fef2f2;">
          <div class="empty-state">
            <div style="font-size:2.2rem;margin-bottom:8px;">⚠️</div>
            <h3 style="color:var(--danger);margin-bottom:8px;">Market Data Unavailable</h3>
            <p style="color:var(--gray-700);">Unable to retrieve analysis from Twelve Data: ${error.message}</p>
          </div>
        </div>
      `;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        Generate AI Signals
      `;
    }
  });
}

function displaySignals(signals, container) {
  if (!signals.length) {
    container.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <h3>No Signals</h3>
          <p>No trading signals were generated. Try again.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = signals.map((signal, i) => {
    const isBuy = (signal.type || '').includes('BUY');
    const isSell = (signal.type || '').includes('SELL');
    const cardClass = isBuy ? 'buy-signal' : isSell ? 'sell-signal' : 'hold-signal';
    const typeClass = isBuy ? 'buy' : isSell ? 'sell' : 'neutral';
    const typeIcon = isBuy ? '🟢' : isSell ? '🔴' : '🟡';

    return `
    <div class="card signal-card ${cardClass}" style="margin-bottom:16px;animation:slideUp 0.3s ease ${i * 0.1}s both;">
      <div class="signal-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="signal-pair">${signal.pair}</span>
          <span class="card-badge badge-purple">${signal.timeframe || 'N/A'}</span>
        </div>
        <span class="signal-type ${typeClass}">${typeIcon} ${signal.type}</span>
      </div>
      <div class="signal-details">
        <div class="signal-detail">
          <div class="signal-detail-label">Entry</div>
          <div class="signal-detail-value">${signal.entry}</div>
        </div>
        <div class="signal-detail">
          <div class="signal-detail-label">Stop Loss</div>
          <div class="signal-detail-value" style="color:var(--danger);">${signal.stop_loss}</div>
        </div>
        <div class="signal-detail">
          <div class="signal-detail-label">Take Profit</div>
          <div class="signal-detail-value" style="color:var(--success);">${signal.take_profit}</div>
        </div>
        <div class="signal-detail">
          <div class="signal-detail-label">Confidence</div>
          <div class="signal-detail-value" style="text-transform:capitalize;">${signal.confidence || 'N/A'}${signal.confidence_pct ? ` (${signal.confidence_pct}%)` : ''}</div>
        </div>
      </div>
      ${signal.reason ? `<p style="margin-top:14px;font-size:0.84rem;color:var(--gray-500);line-height:1.6;">💡 <strong>Reason:</strong> ${signal.reason}</p>` : ''}
    </div>
  `;
  }).join('');
}
