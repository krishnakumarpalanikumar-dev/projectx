// Chart Analysis Page — Core Feature with AI Chatbot

import { analyzeChart } from '../utils/gemini.js';
import { showToast } from '../utils/toast.js';
import { processMessage, setChatAnalysis, clearChatHistory } from '../utils/chatbot.js';
import { saveAnalysisToHistory } from '../utils/storage.js';

let uploadedImage = null;
let uploadedMimeType = null;
let lastAnalysis = null;

// ─── Session State Persistence ──────────────────────────────────────────────
const SESSION_KEY = 'chartAnalysisState';

function saveSessionState() {
  try {
    const state = {
      uploadedImage,
      uploadedMimeType,
      lastAnalysis,
      config: {
        marketType: document.getElementById('market-type')?.value,
        pair: document.getElementById('pair-input')?.value,
        currentPrice: document.getElementById('current-price')?.value,
        timeframe: document.getElementById('timeframe-select')?.value,
        balance: document.getElementById('account-balance')?.value,
        risk: document.getElementById('risk-percent')?.value,
        depth: document.getElementById('analysis-depth')?.value,
      },
      chatHTML: document.getElementById('chatbot-messages')?.innerHTML,
      resultsHTML: document.getElementById('analysis-results-container')?.innerHTML,
      uploadZoneHTML: document.getElementById('upload-zone')?.innerHTML,
      uploadZoneHasImage: document.getElementById('upload-zone')?.classList.contains('has-image'),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage quota exceeded or serialisation error — silently ignore
    console.warn('Could not save chart analysis state:', e);
  }
}

function loadSessionState() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSessionState() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function renderChartAnalysis(container) {
  container.innerHTML = `
    <div class="chart-analysis-layout">
      <!-- Left Column: Upload + Config -->
      <div class="chart-left-col">
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <span class="card-title">📸 Upload Chart Screenshot</span>
            <span class="card-badge badge-purple">AI Vision</span>
          </div>
          
          <!-- Persistent file input — lives OUTSIDE zone so zone.innerHTML resets never destroy it -->
          <input type="file" id="chart-file-input" accept="image/*" style="display:none;" />

          <div class="upload-zone" id="upload-zone">
            <div class="upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3 class="upload-title">Drop your chart here</h3>
            <p class="upload-subtitle">Supports PNG, JPG, JPEG, WebP • Max 10MB</p>
            <button class="upload-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Browse Files
            </button>
          </div>
        </div>

        <!-- Config -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <span class="card-title">⚙️ Analysis Configuration</span>
          </div>
          <div class="analysis-config">
            <div class="form-group">
              <label for="market-type">Market Type</label>
              <select id="market-type">
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
              </select>
            </div>
            <div class="form-group">
              <label for="pair-input">Trading Pair</label>
              <input type="text" id="pair-input" placeholder="e.g., EUR/USD, BTC/USDT, AAPL" />
            </div>
            <div class="form-group">
              <label for="current-price" style="display:flex;align-items:center;gap:6px;">
                Current Market Price
                <span style="font-size:0.72rem;font-weight:500;background:var(--purple-100);color:var(--purple-600);padding:2px 7px;border-radius:20px;">Live</span>
              </label>
              <input type="number" id="current-price" placeholder="e.g., 4614.399" step="any" min="0"
                style="border:1.5px solid var(--purple-200);" />
              <span style="font-size:0.74rem;color:var(--gray-400);margin-top:4px;display:block;">Enter the exact price shown on your chart for accurate signals</span>
            </div>
            <div class="form-group">
              <label for="timeframe-select">Timeframe</label>
              <select id="timeframe-select">
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h" selected>1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
                <option value="1w">1 Week</option>
                <option value="1M">1 Month</option>
              </select>
            </div>
            <div class="form-group">
              <label for="account-balance">Account Balance ($)</label>
              <input type="number" id="account-balance" placeholder="e.g., 10000" value="10000" min="100" />
            </div>
            <div class="form-group">
              <label for="risk-percent">Risk Per Trade (%)</label>
              <select id="risk-percent">
                <option value="0.5">0.5% (Conservative)</option>
                <option value="1" selected>1% (Recommended)</option>
                <option value="1.5">1.5%</option>
                <option value="2">2% (Aggressive)</option>
                <option value="3">3% (High Risk)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="analysis-depth">Analysis Depth</label>
              <select id="analysis-depth">
                <option value="standard">Standard</option>
                <option value="detailed" selected>Detailed</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
            <button class="analyze-btn" id="analyze-btn" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              Analyze with AI
            </button>
          </div>
        </div>

        <!-- AI Chatbot has been moved to right column -->
      </div>

      <!-- Right Column: Results & Chatbot -->
      <div class="chart-right-col">
        <!-- Results Container -->
        <div id="analysis-results-container">
          <div class="card">
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 12V7H5a2 2 0 010-4h14v4"/>
                <path d="M3 5v14a2 2 0 002 2h16v-5"/>
                <path d="M18 12a2 2 0 000 4h4v-4h-4z"/>
              </svg>
              <h3>No Analysis Yet</h3>
              <p>Upload a chart screenshot, configure your parameters, and click "Analyze with AI" to get started.</p>
            </div>
          </div>
        </div>
        
        <!-- AI Chatbot -->
        <div class="card chatbot-card" style="margin-top:20px; display:flex; flex-direction:column; max-height: 500px;">
          <div class="card-header">
            <span class="card-title">🤖 AI Trading Assistant</span>
            <button class="btn btn-outline" id="clear-chat-btn" style="padding:4px 12px;font-size:0.72rem;">Clear</button>
          </div>
          <div class="chatbot-messages" id="chatbot-messages" style="flex:1; overflow-y:auto; padding:16px;">
            <div class="chat-msg assistant">
              <div class="chat-avatar">🤖</div>
              <div class="chat-bubble">
                <p>Hello! I'm your AI trading assistant. I can help you with:</p>
                <p>• <strong>Chart analysis</strong> questions<br>• <strong>Entry, SL, TP</strong> advice<br>• <strong>Risk management</strong><br>• <strong>Technical indicators</strong> (RSI, MACD, MAs)<br>• <strong>Chart patterns</strong><br>• <strong>Trading strategies</strong></p>
                <p>Upload a chart and analyze it, then ask me anything! 📊</p>
              </div>
            </div>
          </div>
          <div class="chatbot-input-area" style="border-top:1px solid var(--purple-100); padding:16px; display:flex; gap:10px;">
            <input type="text" id="chatbot-input" placeholder="Ask about the chart, indicators, risk management..." style="flex:1; padding:12px; border-radius:var(--radius-md); border:1px solid var(--gray-200); outline:none;"/>
            <button class="chatbot-send-btn" id="chatbot-send-btn" style="background:var(--purple-600); color:white; width:48px; height:48px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  initUpload();
  initAnalysis();
  initChatbot();
  restoreSessionState();
}

// ─── Restore persisted state after DOM is ready ──────────────────────────────
function restoreSessionState() {
  const state = loadSessionState();
  if (!state) return;

  // Restore in-memory variables
  uploadedImage = state.uploadedImage || null;
  uploadedMimeType = state.uploadedMimeType || null;
  lastAnalysis = state.lastAnalysis || null;

  // Restore analysis context in chatbot
  if (lastAnalysis) setChatAnalysis(lastAnalysis);

  // Restore config dropdowns / inputs
  if (state.config) {
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    set('market-type', state.config.marketType);
    set('pair-input', state.config.pair);
    set('current-price', state.config.currentPrice);
    set('timeframe-select', state.config.timeframe);
    set('account-balance', state.config.balance);
    set('risk-percent', state.config.risk);
    set('analysis-depth', state.config.depth);
  }

  // Restore upload zone
  if (state.uploadZoneHTML) {
    const zone = document.getElementById('upload-zone');
    if (zone) {
      zone.innerHTML = state.uploadZoneHTML;
      if (state.uploadZoneHasImage) zone.classList.add('has-image');
      // Re-wire the "click to change image" link
      zone.querySelector('#change-image')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        document.getElementById('chart-file-input').click();
      });
    }
  }

  // Re-enable analyse button if image is present
  if (uploadedImage) {
    const btn = document.getElementById('analyze-btn');
    if (btn) btn.disabled = false;
  }

  // Restore analysis results panel
  if (state.resultsHTML) {
    const rc = document.getElementById('analysis-results-container');
    if (rc) rc.innerHTML = state.resultsHTML;
  }

  // Restore chat messages
  if (state.chatHTML) {
    const cm = document.getElementById('chatbot-messages');
    if (cm) cm.innerHTML = state.chatHTML;
    requestAnimationFrame(() => {
      if (cm) cm.scrollTop = cm.scrollHeight;
    });
  }
}

function initUpload() {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('chart-file-input');

  // Click on empty zone → open file picker
  zone.addEventListener('click', (e) => {
    // If "Click to change image" span was clicked, open picker (stopPropagation keeps it clean)
    if (e.target.id === 'change-image') {
      fileInput.click();
      return;
    }
    // Open picker when zone has no image yet (blank state / browse-files button)
    if (!zone.classList.contains('has-image')) fileInput.click();
  });

  // Single persistent listener — input is never removed from the DOM
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
    // Reset value so the same file can be re-selected
    fileInput.value = '';
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('File too large. Max 10MB', 'error');
    return;
  }

  uploadedMimeType = file.type;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Full = e.target.result;
    uploadedImage = base64Full.split(',')[1];

    const zone = document.getElementById('upload-zone');
    zone.classList.add('has-image');
    // Note: file input lives OUTSIDE zone — safe to replace innerHTML freely
    zone.innerHTML = `
      <img src="${base64Full}" class="upload-preview" alt="Chart preview" />
      <p style="margin-top:12px;font-size:0.82rem;color:var(--gray-500);">
        <strong>${file.name}</strong> • ${(file.size / 1024).toFixed(1)} KB
        <br><span style="color:var(--purple-600);cursor:pointer;text-decoration:underline;" id="change-image">Click to change image</span>
      </p>
    `;
    // No need to re-attach listener — the zone click handler already handles #change-image

    document.getElementById('analyze-btn').disabled = false;
    showToast('Chart uploaded successfully!', 'success');
    saveSessionState();
  };
  reader.readAsDataURL(file);
}

function initAnalysis() {
  const analyzeBtn = document.getElementById('analyze-btn');
  
  analyzeBtn.addEventListener('click', async () => {
    if (!uploadedImage) {
      showToast('Please upload a chart first', 'error');
      return;
    }

    const pair = document.getElementById('pair-input').value.trim();
    const timeframe = document.getElementById('timeframe-select').value;
    const currentPriceRaw = document.getElementById('current-price').value.trim();
    const currentPrice = currentPriceRaw ? parseFloat(currentPriceRaw) : null;

    if (!pair) {
      showToast('Please enter the trading pair', 'error');
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<div class="spinner"></div> Analyzing...';

    try {
      const result = await analyzeChart(uploadedImage, uploadedMimeType, pair, timeframe, currentPrice);
      lastAnalysis = result;
      setChatAnalysis(result);
      displayResults(result, pair, timeframe);
      
      // Save backup locally to History database
      saveAnalysisToHistory(uploadedImage, uploadedMimeType, pair, timeframe, result);

      showToast('Analysis complete & saved!', 'success');

      // Notify chatbot
      addChatMessage('assistant', `✅ Analysis complete for **${pair}** (${timeframe})!\n\nI detected a **${result.trend?.direction}** trend with **${result.trend?.strength}** strength. Signal: **${result.signals?.recommendation}**.\n\nAsk me anything — "Should I trade this?", "Where's the stop loss?", "Explain the patterns", etc.`);

      // Persist state so navigating away and back restores everything
      saveSessionState();
    } catch (error) {
      showToast(`Analysis failed: ${error.message}`, 'error');
      console.error('Analysis error:', error);
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        Analyze with AI
      `;
    }
  });
}

function initChatbot() {
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const clearBtn = document.getElementById('clear-chat-btn');

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addChatMessage('user', text);
    input.value = '';

    // Small delay for natural feel
    setTimeout(() => {
      const response = processMessage(text);
      addChatMessage('assistant', response);
      saveSessionState(); // persist after every chat exchange
    }, 300 + Math.random() * 400);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  clearBtn.addEventListener('click', () => {
    clearChatHistory();
    uploadedImage = null;
    uploadedMimeType = null;
    lastAnalysis = null;
    clearSessionState();

    // Reset upload zone — file input is outside zone so no re-wiring needed
    const zone = document.getElementById('upload-zone');
    if (zone) {
      zone.classList.remove('has-image');
      zone.innerHTML = `
        <div class="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <h3 class="upload-title">Drop your chart here</h3>
        <p class="upload-subtitle">Supports PNG, JPG, JPEG, WebP • Max 10MB</p>
        <button class="upload-btn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Browse Files
        </button>
      `;
    }

    // Reset results
    const rc = document.getElementById('analysis-results-container');
    if (rc) rc.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4h-4z"/></svg>
          <h3>No Analysis Yet</h3>
          <p>Upload a chart screenshot, configure your parameters, and click "Analyze with AI" to get started.</p>
        </div>
      </div>
    `;

    // Disable analyse button
    const btn = document.getElementById('analyze-btn');
    if (btn) btn.disabled = true;

    // Reset chat UI
    const container = document.getElementById('chatbot-messages');
    if (container) container.innerHTML = `
      <div class="chat-msg assistant">
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble">
          <p>Everything cleared! Upload a new chart to start fresh. 📊</p>
        </div>
      </div>
    `;
  });
}

function addChatMessage(role, text) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role}`;

  // Convert markdown-like formatting to HTML
  const formatted = formatChatText(text);

  if (role === 'user') {
    msgDiv.innerHTML = `
      <div class="chat-bubble user-bubble">${formatted}</div>
      <div class="chat-avatar user-avatar">👤</div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-bubble">${formatted}</div>
    `;
  }

  container.appendChild(msgDiv);
  
  // Smooth scroll to bottom
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function formatChatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ')
    .replace(/\| /g, '│ ');
}

function displayResults(result, pair, timeframe) {
  const container = document.getElementById('analysis-results-container');
  const accountBalance = parseFloat(document.getElementById('account-balance')?.value || 10000);
  const riskPercent = parseFloat(document.getElementById('risk-percent')?.value || 1);
  
  const trendColor = result.trend?.direction === 'bullish' ? 'var(--success)' : 
                     result.trend?.direction === 'bearish' ? 'var(--danger)' : 'var(--purple-600)';

  // Calculate risk management values
  const entry = parseFloat(result.signals?.entry_price) || 0;
  const sl = parseFloat(result.signals?.stop_loss) || 0;
  const tp1 = parseFloat(result.signals?.take_profit_1) || 0;
  const slDistance = Math.abs(entry - sl);
  const tp1Distance = Math.abs(tp1 - entry);
  const riskAmount = accountBalance * (riskPercent / 100);
  const positionSize = slDistance > 0 ? (riskAmount / slDistance).toFixed(2) : 'N/A';
  const profitAtTP1 = slDistance > 0 ? (riskAmount * (tp1Distance / slDistance)).toFixed(2) : 'N/A';

  // Determine signal strength
  const signalStrength = getSignalStrength(result);

  container.innerHTML = `
    <div class="analysis-result" style="animation: slideUp 0.5s ease;">
      <!-- Header -->
      <div class="result-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <div>
          <h3>AI Analysis — ${pair} (${timeframe})</h3>
          <span style="font-size:0.78rem;opacity:0.85;">Built-in AI Engine • ${new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div class="result-body">
        <!-- Signal Strength Meter -->
        <div class="result-section">
          <div class="signal-strength-card ${result.signals?.recommendation === 'BUY' ? 'buy-bg' : result.signals?.recommendation === 'SELL' ? 'sell-bg' : 'hold-bg'}">
            <div class="signal-strength-header">
              <div class="signal-strength-icon">
                ${result.signals?.recommendation === 'BUY' ? '🟢' : result.signals?.recommendation === 'SELL' ? '🔴' : '🟡'}
              </div>
              <div>
                <div class="signal-strength-label">${result.signals?.recommendation || 'HOLD'} SIGNAL</div>
                <div class="signal-strength-conf">Confidence: ${result.signals?.confidence || 'N/A'}</div>
              </div>
              <div class="signal-meter">
                <div class="signal-meter-fill" style="width:${signalStrength}%;background:${result.signals?.recommendation === 'BUY' ? 'var(--success)' : result.signals?.recommendation === 'SELL' ? 'var(--danger)' : 'var(--warning)'}"></div>
              </div>
              <span class="signal-meter-value">${signalStrength}%</span>
            </div>
          </div>
        </div>

        <!-- Trade Setup Card (Visual) -->
        <div class="result-section">
          <div class="result-section-title">🎯 Trade Setup</div>
          <div class="trade-setup-visual">
            ${buildTradeSetupVisual(result)}
          </div>
        </div>

        <!-- Trend -->
        <div class="result-section">
          <div class="result-section-title">Trend Analysis</div>
          <div class="result-grid">
            <div class="result-item">
              <div class="result-item-label">Direction</div>
              <div class="result-item-value" style="color:${trendColor};text-transform:capitalize;">${result.trend?.direction || 'N/A'}</div>
            </div>
            <div class="result-item">
              <div class="result-item-label">Strength</div>
              <div class="result-item-value" style="text-transform:capitalize;">${result.trend?.strength || 'N/A'}</div>
            </div>
          </div>
          <p class="result-text" style="margin-top:12px;">${result.trend?.description || ''}</p>
        </div>

        <!-- Support & Resistance -->
        <div class="result-section">
          <div class="result-section-title">Support & Resistance</div>
          <div class="result-grid">
            <div class="result-item">
              <div class="result-item-label">Support Levels</div>
              <div class="result-item-value buy">${(result.support_resistance?.support_levels || []).join(' | ') || 'N/A'}</div>
            </div>
            <div class="result-item">
              <div class="result-item-label">Resistance Levels</div>
              <div class="result-item-value sell">${(result.support_resistance?.resistance_levels || []).join(' | ') || 'N/A'}</div>
            </div>
          </div>
          <p class="result-text" style="margin-top:12px;">${result.support_resistance?.key_level || ''}</p>
        </div>

        <!-- Patterns -->
        <div class="result-section">
          <div class="result-section-title">Chart Patterns</div>
          <div class="signal-tags">
            ${(result.patterns?.detected || []).map(p => `
              <span class="signal-tag neutral">${p}</span>
            `).join('')}
          </div>
          <p class="result-text" style="margin-top:12px;">${result.patterns?.description || 'No specific patterns detected.'}</p>
        </div>

        <!-- Trading Signals -->
        <div class="result-section">
          <div class="result-section-title">Trading Signals</div>
          <div class="result-grid" style="grid-template-columns:repeat(3,1fr);">
            <div class="result-item">
              <div class="result-item-label">Entry Price</div>
              <div class="result-item-value">${result.signals?.entry_price || 'N/A'}</div>
            </div>
            <div class="result-item" style="background:var(--danger-light);">
              <div class="result-item-label">Stop Loss</div>
              <div class="result-item-value sell">${result.signals?.stop_loss || 'N/A'}</div>
            </div>
            <div class="result-item">
              <div class="result-item-label">Risk/Reward</div>
              <div class="result-item-value">${result.signals?.risk_reward_ratio || 'N/A'}</div>
            </div>
            <div class="result-item" style="background:var(--success-light);">
              <div class="result-item-label">Take Profit 1</div>
              <div class="result-item-value buy">${result.signals?.take_profit_1 || 'N/A'}</div>
            </div>
            <div class="result-item" style="background:var(--success-light);">
              <div class="result-item-label">Take Profit 2</div>
              <div class="result-item-value buy">${result.signals?.take_profit_2 || 'N/A'}</div>
            </div>
            <div class="result-item" style="background:var(--success-light);">
              <div class="result-item-label">Take Profit 3</div>
              <div class="result-item-value buy">${result.signals?.take_profit_3 || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Risk Management Calculator -->
        <div class="result-section">
          <div class="result-section-title">🛡️ Risk Management</div>
          <div class="risk-calc-card">
            <div class="risk-calc-grid">
              <div class="risk-calc-item">
                <span class="risk-calc-label">Account Balance</span>
                <span class="risk-calc-value">$${accountBalance.toLocaleString()}</span>
              </div>
              <div class="risk-calc-item">
                <span class="risk-calc-label">Risk Per Trade</span>
                <span class="risk-calc-value">${riskPercent}% ($${riskAmount.toFixed(2)})</span>
              </div>
              <div class="risk-calc-item">
                <span class="risk-calc-label">SL Distance</span>
                <span class="risk-calc-value">${slDistance > 0 ? slDistance.toFixed(entry >= 100 ? 2 : 5) : 'N/A'}</span>
              </div>
              <div class="risk-calc-item highlight">
                <span class="risk-calc-label">Position Size</span>
                <span class="risk-calc-value">${positionSize} units</span>
              </div>
              <div class="risk-calc-item success">
                <span class="risk-calc-label">Profit at TP1</span>
                <span class="risk-calc-value">+$${profitAtTP1}</span>
              </div>
              <div class="risk-calc-item danger">
                <span class="risk-calc-label">Max Loss</span>
                <span class="risk-calc-value">-$${riskAmount.toFixed(2)}</span>
              </div>
            </div>
            <div class="risk-warnings">
              <p>⚠️ <strong>Never risk more than 2% per trade.</strong> This keeps you in the game even during losing streaks.</p>
              <p>📊 With ${result.signals?.risk_reward_ratio || '1:2'} R:R, you only need ~35% win rate to be profitable.</p>
            </div>
          </div>
        </div>

        <!-- Indicators -->
        <div class="result-section">
          <div class="result-section-title">Technical Indicators</div>
          <div class="result-grid" style="grid-template-columns:repeat(3,1fr);">
            <div class="result-item">
              <div class="result-item-label">RSI</div>
              <div class="result-item-value" style="font-size:0.85rem;">${result.indicators?.rsi_reading || 'N/A'}</div>
            </div>
            <div class="result-item">
              <div class="result-item-label">Moving Averages</div>
              <div class="result-item-value" style="font-size:0.85rem;">${result.indicators?.moving_averages || 'N/A'}</div>
            </div>
            <div class="result-item">
              <div class="result-item-label">Volume</div>
              <div class="result-item-value" style="font-size:0.85rem;">${result.indicators?.volume || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="result-section" style="background:var(--gradient-subtle);padding:20px;border-radius:var(--radius-md);">
          <div class="result-section-title">Executive Summary</div>
          <p class="result-text" style="font-size:0.95rem;font-weight:500;">${result.summary || 'No summary available.'}</p>
        </div>

        <!-- Disclaimer -->
        <div class="result-section" style="padding:16px;background:var(--warning-light);border-radius:var(--radius-md);border:1px solid rgba(245,158,11,0.2);">
          <p style="font-size:0.8rem;color:var(--gray-700);line-height:1.6;margin:0;">
            ⚠️ <strong>Disclaimer:</strong> This analysis is generated by an AI engine based on chart pattern recognition and technical indicators. No trading system can guarantee 100% accuracy. 
            Markets are inherently unpredictable. Always use proper risk management, never trade with money you can't afford to lose, and consider this analysis as one of many tools in your decision-making process.
          </p>
        </div>
      </div>
    </div>
  `;
}

function getSignalStrength(result) {
  let strength = 50; // Base

  // Trend contribution
  if (result.trend?.strength === 'strong') strength += 20;
  else if (result.trend?.strength === 'moderate') strength += 10;
  else strength -= 10;

  // Signal confidence
  if (result.signals?.confidence === 'high') strength += 15;
  else if (result.signals?.confidence === 'medium') strength += 5;
  else strength -= 10;

  // Pattern count
  const patternCount = result.patterns?.detected?.length || 0;
  strength += Math.min(patternCount * 5, 15);

  return Math.min(Math.max(strength, 10), 95);
}

function buildTradeSetupVisual(result) {
  const entry = result.signals?.entry_price || 'N/A';
  const sl = result.signals?.stop_loss || 'N/A';
  const tp1 = result.signals?.take_profit_1 || 'N/A';
  const tp2 = result.signals?.take_profit_2 || 'N/A';
  const tp3 = result.signals?.take_profit_3 || 'N/A';
  const isBuy = result.signals?.recommendation === 'BUY';
  const isSell = result.signals?.recommendation === 'SELL';

  return `
    <div class="trade-visual-container">
      ${isBuy || isSell ? `
        <!-- TP3 -->
        <div class="trade-level tp-level tp3">
          <div class="trade-level-line tp-line"></div>
          <div class="trade-level-info">
            <span class="trade-level-tag tp">TP3</span>
            <span class="trade-level-price">${tp3}</span>
          </div>
        </div>
        <!-- TP2 -->
        <div class="trade-level tp-level tp2">
          <div class="trade-level-line tp-line"></div>
          <div class="trade-level-info">
            <span class="trade-level-tag tp">TP2</span>
            <span class="trade-level-price">${tp2}</span>
          </div>
        </div>
        <!-- TP1 -->
        <div class="trade-level tp-level tp1">
          <div class="trade-level-line tp-line"></div>
          <div class="trade-level-info">
            <span class="trade-level-tag tp">TP1</span>
            <span class="trade-level-price">${tp1}</span>
          </div>
        </div>
        <!-- Entry -->
        <div class="trade-level entry-level">
          <div class="trade-level-line entry-line"></div>
          <div class="trade-level-info">
            <span class="trade-level-tag entry">▶ ENTRY</span>
            <span class="trade-level-price">${entry}</span>
          </div>
        </div>
        <!-- SL -->
        <div class="trade-level sl-level">
          <div class="trade-level-line sl-line"></div>
          <div class="trade-level-info">
            <span class="trade-level-tag sl">✕ STOP LOSS</span>
            <span class="trade-level-price">${sl}</span>
          </div>
        </div>
      ` : `
        <div style="text-align:center;padding:20px;color:var(--gray-500);">
          <p>🟡 HOLD — No clear trade setup detected</p>
          <p style="font-size:0.82rem;margin-top:8px;">Wait for a clearer signal before entering a trade.</p>
        </div>
      `}
    </div>
  `;
}
