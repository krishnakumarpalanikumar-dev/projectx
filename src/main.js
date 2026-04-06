// ============================================
// TradeVision AI — Main Application
// ============================================

import { renderDashboard } from './pages/dashboard.js';
import { renderChartAnalysis } from './pages/chartAnalysis.js';
import { renderMarkets } from './pages/markets.js';
import { renderSignals } from './pages/signals.js';
import { renderAIInsights } from './pages/aiInsights.js';
import { showToast, initToasts } from './utils/toast.js';
import { getApiKey, setApiKey, hasApiKey } from './utils/storage.js';
import { setUseBuiltIn, getUseBuiltIn } from './utils/gemini.js';

// ============================================
// State
// ============================================
let currentPage = 'dashboard';

// ============================================
// Navigation
// ============================================
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  
  // Update active nav
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Update topbar
  const titles = {
    'dashboard': ['Dashboard', 'AI-Powered Market Overview'],
    'chart-analysis': ['Chart Analysis', 'Upload & Analyze Chart Patterns'],
    'markets': ['Live Markets', 'Real-Time Market Data'],
    'signals': ['Trade Signals', 'AI-Generated Trading Signals'],
    'ai-insights': ['AI Insights', 'Smart Market Intelligence']
  };

  const [title, subtitle] = titles[page] || ['Dashboard', ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;

  // Render page
  const container = document.getElementById('page-container');
  container.style.animation = 'none';
  container.offsetHeight; // force reflow
  container.style.animation = 'fadeIn 0.4s ease';

  switch (page) {
    case 'dashboard': renderDashboard(container); break;
    case 'chart-analysis': renderChartAnalysis(container); break;
    case 'markets': renderMarkets(container); break;
    case 'signals': renderSignals(container); break;
    case 'ai-insights': renderAIInsights(container); break;
  }

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

// ============================================
// Settings Modal
// ============================================
function initSettings() {
  const modal = document.getElementById('settings-modal');
  const openBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('settings-close');
  const saveBtn = document.getElementById('save-api-key');
  const input = document.getElementById('gemini-api-key');
  const builtinBtn = document.getElementById('engine-builtin');
  const geminiBtn = document.getElementById('engine-gemini');
  const geminiKeySection = document.getElementById('gemini-key-section');

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    input.value = getApiKey() || '';
    updateEngineToggleUI();
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Engine toggle buttons
  builtinBtn.addEventListener('click', () => {
    setUseBuiltIn(true);
    updateEngineToggleUI();
    updateApiStatus();
    showToast('Switched to Built-in AI Engine — no API key needed!', 'success');
  });

  geminiBtn.addEventListener('click', () => {
    setUseBuiltIn(false);
    updateEngineToggleUI();
    updateApiStatus();
    showToast('Switched to Gemini API — enter your API key below', 'info');
  });

  saveBtn.addEventListener('click', () => {
    const key = input.value.trim();
    if (key) {
      setApiKey(key);
      updateApiStatus();
      showToast('API key saved successfully!', 'success');
    } else {
      showToast('Please enter a valid API key', 'error');
    }
  });
}

function updateEngineToggleUI() {
  const isBuiltIn = getUseBuiltIn();
  const builtinBtn = document.getElementById('engine-builtin');
  const geminiBtn = document.getElementById('engine-gemini');
  const geminiKeySection = document.getElementById('gemini-key-section');

  if (isBuiltIn) {
    builtinBtn.classList.add('active');
    builtinBtn.classList.remove('btn-outline');
    builtinBtn.classList.add('btn-primary');
    geminiBtn.classList.remove('active');
    geminiBtn.classList.remove('btn-primary');
    geminiBtn.classList.add('btn-outline');
    geminiKeySection.style.display = 'none';
  } else {
    geminiBtn.classList.add('active');
    geminiBtn.classList.remove('btn-outline');
    geminiBtn.classList.add('btn-primary');
    builtinBtn.classList.remove('active');
    builtinBtn.classList.remove('btn-primary');
    builtinBtn.classList.add('btn-outline');
    geminiKeySection.style.display = 'block';
  }
}

function updateApiStatus() {
  const status = document.getElementById('api-status');
  const dot = status.querySelector('.api-dot');
  const text = status.querySelector('span');
  const isBuiltIn = getUseBuiltIn();
  
  if (isBuiltIn) {
    dot.classList.add('connected');
    text.textContent = '🧠 AI Engine Ready';
  } else if (hasApiKey()) {
    dot.classList.add('connected');
    text.textContent = '🌐 Gemini Connected';
  } else {
    dot.classList.remove('connected');
    text.textContent = '🌐 API Key Required';
  }
}

// ============================================
// Mobile Menu
// ============================================
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ============================================
// Init
// ============================================
function init() {
  initToasts();
  initNavigation();
  initSettings();
  initMobileMenu();
  updateApiStatus();
  navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
