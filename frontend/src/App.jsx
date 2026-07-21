import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api, clearSession, getToken } from './api';
import Login from './pages/Login';
import Pipeline from './pages/Pipeline';
import './App.css';

function AppRoutes() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api.me()
      .then(({ user }) => setIdentity(user))
      .catch(() => clearSession())
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const expire = () => {
      setIdentity(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('sales-core-auth-expired', expire);
    return () => window.removeEventListener('sales-core-auth-expired', expire);
  }, [navigate]);

  const signedIn = Boolean(identity && getToken());
  if (checking) return <main className="center-card"><p>Verifying session…</p></main>;

  function signOut() {
    clearSession();
    setIdentity(null);
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route path="/login" element={signedIn ? <Navigate to="/pipeline" replace /> : <Login onLogin={setIdentity} />} />
      <Route path="/pipeline" element={signedIn ? <Pipeline identity={identity} onSignOut={signOut} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={signedIn ? '/pipeline' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
