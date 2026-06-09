// Local Storage Utilities

const STORAGE_KEYS = {
  API_KEY: 'tradevision_gemini_key',
  HISTORY: 'tradevision_analysis_history'
};
export function getApiKey() {
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

export function setApiKey(key) {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
}

export function hasApiKey() {
  const key = getApiKey();
  return key && key.length > 10;
}

export function removeApiKey() {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
}

export function saveAnalysisToHistory(imageData, mimeType, pair, timeframe, analysisResult) {
  try {
    const history = getAnalysisHistory();
    const newEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      image: `data:${mimeType};base64,${imageData}`,
      pair,
      pair,
      timeframe,
      result: analysisResult
    };
    history.unshift(newEntry);

    // Keep only last 15 to avoid localStorage size issues (~5MB limit)
    if (history.length > 15) {
      history.pop();
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch(e) {
    console.error("Storage limit reached or failed saving", e);
  }
}

export function getAnalysisHistory() {
  const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
}

export function deleteAnalysisFromHistory(id) {
  const history = getAnalysisHistory();
  const updated = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
}
