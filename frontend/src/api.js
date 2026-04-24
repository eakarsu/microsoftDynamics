const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function fetchAll(module, search = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('order', 'desc');
  const res = await fetch(`${API_BASE}/${module}?${params}`, { headers: getHeaders() });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
  return res.json();
}

export async function fetchOne(module, id) {
  const res = await fetch(`${API_BASE}/${module}/${id}`, { headers: getHeaders() });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
  return res.json();
}

export async function createItem(module, data) {
  const res = await fetch(`${API_BASE}/${module}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
  return res.json();
}

export async function updateItem(module, id, data) {
  const res = await fetch(`${API_BASE}/${module}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
  return res.json();
}

export async function deleteItem(module, id) {
  const res = await fetch(`${API_BASE}/${module}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
  return res.json();
}

export async function callAI(endpoint, body = {}) {
  const res = await fetch(`${API_BASE}/ai/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
  return res.json();
}
