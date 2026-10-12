import React, { useState } from 'react';
import { login } from '../api';

export function demoCredentials(env) {
  if (env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'true' || !env.VITE_DEMO_TENANT || !env.VITE_DEMO_EMAIL || !env.VITE_DEMO_PASSWORD) return null;
  return { tenant: env.VITE_DEMO_TENANT, email: env.VITE_DEMO_EMAIL, password: env.VITE_DEMO_PASSWORD };
}

export function fillDemoCredentials(setForm, setError, credentials) {
  if (!credentials) return;
  setError('');
  setForm(credentials);
}

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ tenant: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const demo = demoCredentials(import.meta.env);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await login(form);
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="brand-mark" aria-hidden="true">D</div>
        <p className="eyebrow">Governed sales core</p>
        <h1 id="login-heading">Sign in to your tenant</h1>
        <p className="muted">Credentials are provisioned by your tenant administrator.</p>
        <form onSubmit={submit} className="stack">
          <label>Tenant slug<input required autoComplete="organization" value={form.tenant} onChange={(event) => setForm({ ...form, tenant: event.target.value })} /></label>
          <label>Email<input required type="email" autoComplete="username" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input required type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          {error && <div className="error-banner" role="alert">{error}</div>}
          <button
            type="button"
            onClick={() => fillDemoCredentials(setForm, setError, demo)}
            disabled={busy || !demo}
            aria-label="Fill demo credentials"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            Fill demo credentials
          </button>
          {!demo && <p className="muted">Demo credentials are not configured for this local session.</p>}
          <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </section>
    </main>
  );
}
