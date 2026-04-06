// Local Storage Utilities

const STORAGE_KEYS = {
  API_KEY: 'tradevision_gemini_key'
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
