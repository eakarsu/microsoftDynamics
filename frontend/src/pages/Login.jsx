import React, { useState } from 'react';
import { login } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAutoFill = () => {
    setEmail('admin@dynamics365.com');
    setPassword('password123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-shape shape1"></div>
        <div className="login-bg-shape shape2"></div>
        <div className="login-bg-shape shape3"></div>
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <rect width="18" height="18" x="1" y="1" fill="#F25022" rx="2"/>
                <rect width="18" height="18" x="21" y="1" fill="#7FBA00" rx="2"/>
                <rect width="18" height="18" x="1" y="21" fill="#00A4EF" rx="2"/>
                <rect width="18" height="18" x="21" y="21" fill="#FFB900" rx="2"/>
              </svg>
              <div>
                <h1>Microsoft</h1>
                <span>Dynamics 365</span>
              </div>
            </div>
            <p className="login-subtitle">Enterprise Business Applications</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button type="button" className="login-autofill" onClick={handleAutoFill}>
              Quick Demo Login
            </button>
          </form>

          <div className="login-footer">
            <p>Demo Credentials: admin@dynamics365.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
