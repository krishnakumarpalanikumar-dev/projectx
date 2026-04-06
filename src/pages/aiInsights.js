// AI Insights Page

import { getMarketInsights } from '../utils/gemini.js';
import { showToast } from '../utils/toast.js';

export function renderAIInsights(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h3 style="font-size:1rem;font-weight:700;color:var(--gray-800);">AI Market Intelligence</h3>
        <p style="font-size:0.82rem;color:var(--gray-500);">Powered by TradeVision Built-in AI Engine</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-outline insight-topic-btn" data-topic="forex market analysis today">💱 Forex</button>
        <button class="btn btn-outline insight-topic-btn" data-topic="cryptocurrency market analysis and bitcoin outlook">🪙 Crypto</button>
        <button class="btn btn-outline insight-topic-btn" data-topic="US stock market analysis and major tech stocks">📈 Stocks</button>
        <button class="btn btn-primary insight-topic-btn" data-topic="complete financial market overview including forex crypto and stocks">🌍 Full Overview</button>
      </div>
    </div>

    <div id="insights-container">
      <div class="card">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <h3>Select a Market Category</h3>
          <p>Choose a topic above to generate AI-powered market insights and analysis.</p>
        </div>
      </div>
    </div>
  `;

  // Insight generation
  document.querySelectorAll('.insight-topic-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const topic = btn.dataset.topic;
      const insightsContainer = document.getElementById('insights-container');

      // Disable all buttons
      document.querySelectorAll('.insight-topic-btn').forEach(b => b.disabled = true);

      insightsContainer.innerHTML = `
        <div style="text-align:center;padding:48px;">
          <div class="spinner" style="width:36px;height:36px;border:3px solid var(--purple-100);border-top-color:var(--purple-600);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
          <p style="color:var(--gray-500);font-size:0.9rem;font-weight:500;">AI is analyzing markets...</p>
          <p style="color:var(--gray-400);font-size:0.8rem;margin-top:4px;">This may take a few seconds</p>
        </div>
      `;

      try {
        const result = await getMarketInsights(topic);
        displayInsights(result, insightsContainer);
      } catch (error) {
        showToast(`Failed: ${error.message}`, 'error');
        insightsContainer.innerHTML = `
          <div class="card">
            <div class="empty-state">
              <h3>Analysis Failed</h3>
              <p>${error.message}</p>
            </div>
          </div>
        `;
      } finally {
        document.querySelectorAll('.insight-topic-btn').forEach(b => b.disabled = false);
      }
    });
  });
}

function displayInsights(result, container) {
  const insights = result.insights || [];
  const sentiment = result.market_sentiment || '';
  const events = result.key_events || [];

  container.innerHTML = `
    <!-- Sentiment Card -->
    <div class="card" style="margin-bottom:20px;background:var(--gradient-subtle);">
      <div class="card-header">
        <span class="card-title">🧠 Market Sentiment</span>
        <span class="card-badge badge-purple">AI Generated</span>
      </div>
      <p style="font-size:0.92rem;color:var(--gray-700);line-height:1.7;">${sentiment}</p>
    </div>

    <!-- Key Events -->
    ${events.length > 0 ? `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header">
          <span class="card-title">📅 Key Events to Watch</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${events.map(e => `
            <span class="signal-tag neutral" style="font-size:0.82rem;padding:8px 16px;">📌 ${e}</span>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Insights -->
    ${insights.map((insight, i) => {
      const impactClass = insight.impact === 'bullish' ? 'bullish' : 
                         insight.impact === 'bearish' ? 'bearish' : 'neutral';
      return `
        <div class="insight-card" style="animation:slideUp 0.3s ease ${i * 0.08}s both;">
          <div class="insight-meta">
            <span class="insight-category">${insight.category}</span>
            <span class="signal-tag ${impactClass}" style="font-size:0.72rem;padding:3px 10px;">
              ${insight.impact === 'bullish' ? '🟢 Bullish' : insight.impact === 'bearish' ? '🔴 Bearish' : '🟡 Neutral'}
            </span>
            ${insight.confidence ? `<span class="card-badge badge-purple">${insight.confidence} confidence</span>` : ''}
          </div>
          <h4 class="insight-title">${insight.title}</h4>
          <p class="insight-text">${insight.summary}</p>
        </div>
      `;
    }).join('')}
  `;
}
