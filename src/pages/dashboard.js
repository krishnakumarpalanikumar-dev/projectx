// Dashboard Page

export function renderDashboard(container) {
  container.innerHTML = `
    <!-- Hero Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>
        </div>
        <div class="stat-info">
          <h3>Charts Analyzed</h3>
          <div class="stat-value" id="stat-charts">0</div>
          <span class="stat-change up">↑ AI Powered</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div class="stat-info">
          <h3>Market Coverage</h3>
          <div class="stat-value">3</div>
          <span class="stat-change up">Forex · Crypto · Stocks</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </div>
        <div class="stat-info">
          <h3>AI Engine</h3>
          <div class="stat-value">Built-in</div>
          <span class="stat-change up">↑ No API Key Needed</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
        </div>
        <div class="stat-info">
          <h3>Analysis Types</h3>
          <div class="stat-value">6+</div>
          <span class="stat-change up">↑ Comprehensive</span>
        </div>
      </div>
    </div>

    <!-- Welcome Card -->
    <div class="content-grid" style="margin-bottom: 28px;">
      <div class="card" style="grid-column: 1 / -1;">
        <div style="display: flex; align-items: center; gap: 32px; padding: 16px;">
          <div style="flex: 1;">
            <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--gray-900); margin-bottom: 8px; letter-spacing: -0.03em;">
              Welcome to <span style="background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">TradeVision AI</span>
            </h2>
            <p style="font-size: 0.95rem; color: var(--gray-500); line-height: 1.7; margin-bottom: 20px;">
              Your AI-powered trading companion. Upload chart screenshots for instant technical analysis, 
              get real-time market data, and receive intelligent trading signals — powered by our built-in AI engine. No API key required.
            </p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-primary" id="dash-start-analysis">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/></svg>
                Start Chart Analysis
              </button>
              <button class="btn btn-outline" id="dash-view-markets">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/></svg>
                View Markets
              </button>
            </div>
          </div>
          <div style="flex-shrink:0; width: 200px; height: 200px; background: var(--gradient-primary); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-glow);">
            <svg viewBox="0 0 80 80" fill="none" style="width: 100px; height: 100px;">
              <path d="M10 60L25 35L40 45L55 20L70 30" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
              <path d="M10 60L25 35L40 45L55 20L70 30L70 60Z" fill="white" opacity="0.15"/>
              <circle cx="25" cy="35" r="4" fill="white" opacity="0.8"/>
              <circle cx="40" cy="45" r="4" fill="white" opacity="0.8"/>
              <circle cx="55" cy="20" r="4" fill="white" opacity="0.8"/>
              <circle cx="70" cy="30" r="4" fill="white" opacity="0.8"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--gray-800); margin-bottom: 16px;">Platform Features</h3>
    <div class="content-grid three-col" style="margin-bottom: 28px;">
      <div class="card feature-card">
        <div style="width:44px;height:44px;background:var(--purple-100);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple-600)" stroke-width="2" style="width:22px;height:22px;"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 10l3 3 7-7"/></svg>
        </div>
        <h4 style="font-size:0.95rem;font-weight:700;color:var(--gray-800);margin-bottom:8px;">Chart Pattern Recognition</h4>
        <p style="font-size:0.84rem;color:var(--gray-500);line-height:1.6;">Upload screenshots of any chart. AI detects patterns like head & shoulders, double tops, triangles, and more.</p>
      </div>
      <div class="card feature-card">
        <div style="width:44px;height:44px;background:var(--success-light);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="width:22px;height:22px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <h4 style="font-size:0.95rem;font-weight:700;color:var(--gray-800);margin-bottom:8px;">Smart Trade Signals</h4>
        <p style="font-size:0.84rem;color:var(--gray-500);line-height:1.6;">Get precise entry, stop loss, and take profit levels with risk-reward ratios for every analysis.</p>
      </div>
      <div class="card feature-card">
        <div style="width:44px;height:44px;background:var(--info-light);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" style="width:22px;height:22px;"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
        </div>
        <h4 style="font-size:0.95rem;font-weight:700;color:var(--gray-800);margin-bottom:8px;">Multi-Market Coverage</h4>
        <p style="font-size:0.84rem;color:var(--gray-500);line-height:1.6;">Analyze Forex pairs, cryptocurrencies, and stocks — all from a single powerful platform.</p>
      </div>
    </div>

    <!-- How It Works -->
    <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--gray-800); margin-bottom: 16px;">How It Works</h3>
    <div class="card" style="margin-bottom: 28px;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;padding:8px;">
        <div style="text-align:center;">
          <div style="width:56px;height:56px;background:var(--gradient-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.3rem;font-weight:800;color:white;box-shadow:0 4px 15px rgba(124,58,237,0.3);">1</div>
          <h5 style="font-size:0.88rem;font-weight:700;color:var(--gray-800);margin-bottom:4px;">Upload Chart</h5>
          <p style="font-size:0.78rem;color:var(--gray-500);">Screenshot any chart from your trading platform</p>
        </div>
        <div style="text-align:center;">
          <div style="width:56px;height:56px;background:var(--gradient-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.3rem;font-weight:800;color:white;box-shadow:0 4px 15px rgba(124,58,237,0.3);">2</div>
          <h5 style="font-size:0.88rem;font-weight:700;color:var(--gray-800);margin-bottom:4px;">Set Parameters</h5>
          <p style="font-size:0.78rem;color:var(--gray-500);">Select your trading pair and timeframe</p>
        </div>
        <div style="text-align:center;">
          <div style="width:56px;height:56px;background:var(--gradient-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.3rem;font-weight:800;color:white;box-shadow:0 4px 15px rgba(124,58,237,0.3);">3</div>
          <h5 style="font-size:0.88rem;font-weight:700;color:var(--gray-800);margin-bottom:4px;">AI Analyzes</h5>
          <p style="font-size:0.78rem;color:var(--gray-500);">Built-in AI performs comprehensive technical analysis</p>
        </div>
        <div style="text-align:center;">
          <div style="width:56px;height:56px;background:var(--gradient-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.3rem;font-weight:800;color:white;box-shadow:0 4px 15px rgba(124,58,237,0.3);">4</div>
          <h5 style="font-size:0.88rem;font-weight:700;color:var(--gray-800);margin-bottom:4px;">Get Signals</h5>
          <p style="font-size:0.78rem;color:var(--gray-500);">Receive entry, SL, TP and complete analysis</p>
        </div>
      </div>
    </div>
  `;

  // Quick action buttons
  document.getElementById('dash-start-analysis')?.addEventListener('click', () => {
    document.querySelector('[data-page="chart-analysis"]')?.click();
  });
  document.getElementById('dash-view-markets')?.addEventListener('click', () => {
    document.querySelector('[data-page="markets"]')?.click();
  });
}
