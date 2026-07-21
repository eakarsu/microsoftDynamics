const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function getToken() {
  return sessionStorage.getItem('sales_core_token');
}

export function clearSession() {
  sessionStorage.removeItem('sales_core_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== '/api/auth/login') {
    clearSession();
    window.dispatchEvent(new Event('sales-core-auth-expired'));
  }
  if (!response.ok) {
    const error = new Error(body.error?.message || `Request failed (${response.status})`);
    error.code = body.error?.code;
    error.details = body.error?.details;
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function login(credentials) {
  const body = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  sessionStorage.setItem('sales_core_token', body.token);
  return body;
}

export const api = {
  me: () => request('/api/auth/me'),
  leads: () => request('/api/leads'),
  opportunities: () => request('/api/opportunities'),
  createLead: (lead) => request('/api/leads', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(lead),
  }),
  qualifyLead: (leadId, assessment) => request(`/api/leads/${leadId}/qualify`, {
    method: 'POST',
    body: JSON.stringify(assessment),
  }),
  convertLead: (leadId, expectedVersion, key = crypto.randomUUID()) => request(`/api/leads/${leadId}/convert`, {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: JSON.stringify({ expectedVersion }),
  }),
  verifyAudit: () => request('/api/audit-events/verify'),
};
