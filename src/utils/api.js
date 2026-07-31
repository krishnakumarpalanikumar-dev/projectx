export const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

export const api = {
  post: (endpoint, body) => fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'API request failed');
    return data;
  }),
  
  get: (endpoint) => fetch(`${API_URL}${endpoint}`, {
    headers: getHeaders()
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'API request failed');
    return data;
  }),
  
  delete: (endpoint) => fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders()
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'API request failed');
    return data;
  })
};
