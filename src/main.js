// ============================================
// TradeVision AI — Main Application
// ============================================

// Pages are now lazily loaded using dynamic imports in navigateTo()
import { showToast, initToasts } from './utils/toast.js';
import { checkHealth } from './utils/api.js';
import { STORAGE_KEYS } from './utils/storage.js';

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

async function navigateTo(page) {
  window.navigateTo = navigateTo; // Expose globally for login page
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
    'ai-insights': ['AI Insights', 'Smart Market Intelligence'],
    'history': ['Database Backups', 'Your Saved Chart Analyses'],
    'risk-manager': ['Risk Manager', 'Position Sizing & Risk Control'],
    'trade-journal': ['Trade Journal', 'Log, Track & Analyze Your Trades'],
    'model-tracker': ['Model Tracker', 'Monitor Signal Models & Backtest Accuracy'],

    'secret': ['Secret Admin', 'Hidden Admin Area']
  };

  const [title, subtitle] = titles[page] || ['Dashboard', ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;

  // Render page
  const container = document.getElementById('page-container');
  container.style.animation = 'none';
  container.offsetHeight; // force reflow
  container.style.animation = 'fadeIn 0.4s ease';



  // Show skeleton loader
  container.innerHTML = `
    <div class="skeleton-loader" style="width: 100%; height: 60vh; border-radius: var(--radius-lg); background: var(--surface-light); animation: pulse 1.5s infinite; display: flex; align-items: center; justify-content: center; color: var(--gray-500);">
      Loading...
    </div>
  `;

  // Helper to load CSS dynamically
  const loadPageCSS = (pageName) => {
    const cssId = `css-${pageName}`;
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = `/src/styles/pages/${pageName}.css`;
      document.head.appendChild(link);
    }
  };

  try {
    switch (page) {
      case 'dashboard': {
        const { renderDashboard } = await import('./pages/dashboard.js');
        renderDashboard(container); 
        break;
      }
      case 'chart-analysis': {
        loadPageCSS('chart');
        const { renderChartAnalysis } = await import('./pages/chartAnalysis.js');
        renderChartAnalysis(container); 
        break;
      }
      case 'markets': {
        loadPageCSS('markets');
        const { renderMarkets } = await import('./pages/markets.js');
        renderMarkets(container); 
        break;
      }
      case 'signals': {
        loadPageCSS('signals');
        const { renderSignals } = await import('./pages/signals.js');
        renderSignals(container); 
        break;
      }
      case 'ai-insights': {
        loadPageCSS('aiInsights');
        const { renderAIInsights } = await import('./pages/aiInsights.js');
        renderAIInsights(container); 
        break;
      }
      case 'history': {
        loadPageCSS('history');
        const { renderHistory } = await import('./pages/history.js');
        renderHistory(container); 
        break;
      }
      case 'risk-manager': {
        loadPageCSS('riskManager');
        const { renderRiskManager } = await import('./pages/riskManager.js');
        renderRiskManager(container); 
        break;
      }
      case 'trade-journal': {
        loadPageCSS('journal');
        const { renderTradeJournal } = await import('./pages/tradeJournal.js');
        renderTradeJournal(container); 
        break;
      }
      case 'model-tracker': {
        loadPageCSS('modelTracker');
        const { renderModelTracker } = await import('./pages/modelTracker.js');
        renderModelTracker(container);
        break;
      }


    }
  } catch (error) {
    container.innerHTML = `<div style="padding: 2rem; color: #ef4444;">Failed to load page: ${error.message}</div>`;
    console.error(error);
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

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}

async function updateApiStatus() {
  const status = document.getElementById('api-status');
  if (!status) return;
  const dot = status.querySelector('.api-dot');
  const text = status.querySelector('span');
  
  try {
    const isHealthy = await checkHealth();
    if (isHealthy) {
      dot.classList.add('connected');
      text.textContent = 'Twelve Data API';
    } else {
      dot.classList.remove('connected');
      text.textContent = 'Backend Offline';
    }
  } catch {
    dot.classList.remove('connected');
    text.textContent = 'Backend Offline';
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
// Trade Journal Key Migration (tv_trades -> tradevision_trade_journal)
// ============================================
function migrateTradeJournalData() {
  try {
    const oldKey = 'tv_trades';
    const newKey = STORAGE_KEYS.TRADE_JOURNAL;
    const oldData = localStorage.getItem(oldKey);
    const newData = localStorage.getItem(newKey);
    if (oldData && !newData) {
      localStorage.setItem(newKey, oldData);
      console.log('Migrated trade journal data from tv_trades to', newKey);
    }
  } catch (err) {
    console.warn('Trade journal migration error:', err);
  }
}

// ============================================
// Init
// ============================================
function init() {
  migrateTradeJournalData();
  initToasts();
  initNavigation();
  initSettings();
  initMobileMenu();
  updateApiStatus();
  setInterval(updateApiStatus, 30000);

  navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', init);

// ============================================
// EFFECT 5 — 3D tilt on signal cards
// ============================================
function initTiltEffect() {
  const cards = document.querySelectorAll(
    '.signal-card, .trade-card, [class*="result-card"], [class*="analysis-card"]'
  );
  cards.forEach(card => {
    card.style.transition = 'transform 0.15s ease';
    card.style.willChange = 'transform';
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -6;
      const rotateY = ((x - cx) / cx) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initTiltEffect, 500);
  document.addEventListener('pageChanged', initTiltEffect);
});

// ============================================
// EFFECT 9 — Scroll reveal for cards and sections
// ============================================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const elements = document.querySelectorAll(
    '[class*="card"], [class*="panel"], [class*="section"], [class*="result"]'
  );

  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initScrollReveal, 300);
  document.addEventListener('pageChanged', () => {
    setTimeout(initScrollReveal, 300);
  });
});

// ============================================
// EFFECT 10 — Typewriter effect for AI analysis summary text
// ============================================
function typewriterEffect(element, text, speed = 18) {
  if (!element || !text) return;
  element.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
    }
  }, speed);
}

window.typewriterEffect = typewriterEffect;

// ============================================
// EFFECT 11 — Copy to clipboard micro-interaction
// ============================================
function initCopyButtons() {
  document.querySelectorAll('[data-copy], [class*="copy-btn"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy || btn.previousElementSibling?.textContent;
      if (!text) return;
      navigator.clipboard.writeText(text.trim()).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.color = '#00B300';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.color = '';
        }, 1800);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initCopyButtons, 500);
  document.addEventListener('pageChanged', initCopyButtons);
});
