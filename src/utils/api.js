// TradeVision AI — API Client
// Connects to FastAPI backend at http://localhost:8000

export const API_URL = 'http://localhost:8000';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

export const api = {
  post: async (endpoint, body) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'API request failed');
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Backend server offline:', error);
        throw new Error('Backend server offline');
      }
      console.error('API POST error:', error);
      throw error;
    }
  },

  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'API request failed');
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Backend server offline:', error);
        throw new Error('Backend server offline');
      }
      console.error('API GET error:', error);
      throw error;
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'API request failed');
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Backend server offline:', error);
        throw new Error('Backend server offline');
      }
      console.error('API DELETE error:', error);
      throw error;
    }
  }
};

/**
 * Check if the FastAPI backend is healthy.
 * @returns {Promise<boolean>} true if healthy, false on any error.
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}
