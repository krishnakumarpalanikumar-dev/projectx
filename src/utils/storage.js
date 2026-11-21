// Local Storage Utilities

export const STORAGE_KEYS = {
  HISTORY: 'tradevision_analysis_history',
  RISK_SETTINGS: 'tradevision_risk_settings',
  TRADE_LOG: 'tradevision_trade_log',
  TRADE_JOURNAL: 'tradevision_trade_journal',
  PREDICTIONS: 'tv_model_predictions'
};

export const storage = {
  get(key) {
    const data = localStorage.getItem(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return data;
    }
  },
  
  set(key, value) {
    const val = typeof value === 'object' ? JSON.stringify(value) : value;
    localStorage.setItem(key, val);
  },
  
  push(key, value, maxItems = null) {
    let arr = this.get(key);
    if (!Array.isArray(arr)) arr = [];
    arr.unshift(value); // add to beginning
    if (maxItems && arr.length > maxItems) {
      arr = arr.slice(0, maxItems);
    }
    this.set(key, arr);
  },
  
  remove(key) {
    localStorage.removeItem(key);
  },
  
  clear() {
    localStorage.clear();
  }
};

export function saveAnalysisToHistory(imageData, mimeType, pair, timeframe, analysisResult) {
  const newEntry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    image: `data:${mimeType};base64,${imageData}`,
    pair,
    timeframe,
    result: analysisResult
  };
  storage.push(STORAGE_KEYS.HISTORY, newEntry, 15);
}

export function getAnalysisHistory() {
  return storage.get(STORAGE_KEYS.HISTORY) || [];
}

export function deleteAnalysisFromHistory(id) {
  const history = getAnalysisHistory();
  const updated = history.filter(item => item.id !== id);
  storage.set(STORAGE_KEYS.HISTORY, updated);
}
