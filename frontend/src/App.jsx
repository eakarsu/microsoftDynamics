import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { modules, sidebarGroups } from './modules';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
import DetailPage from './pages/DetailPage';
import AIInsights from './pages/AIInsights';
import AIAdvanced from './pages/AIAdvanced';
import CustomViewsPage from './pages/CustomViewsPage';
import { FiGrid, FiCpu, FiLogOut, FiMenu, FiX, FiChevronDown, FiChevronRight, FiUser, FiZap, FiLayers } from 'react-icons/fi';

function Layout({ user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({ Sales: true, Service: true, Marketing: true, Finance: true, Operations: true, HR: true, System: true });
  const location = useLocation();
  const navigate = useNavigate();

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isActive = (path) => location.pathname === path || location.pathname === `/${path}` || location.pathname.startsWith(`/${path}/`);

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="top-bar-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          <div className="brand" onClick={() => navigate('/dashboard')}>
            <svg width="28" height="28" viewBox="0 0 40 40">
              <rect width="18" height="18" x="1" y="1" fill="#F25022" rx="2"/>
              <rect width="18" height="18" x="21" y="1" fill="#7FBA00" rx="2"/>
              <rect width="18" height="18" x="1" y="21" fill="#00A4EF" rx="2"/>
              <rect width="18" height="18" x="21" y="21" fill="#FFB900" rx="2"/>
            </svg>
            <span className="brand-text">Dynamics 365</span>
          </div>
        </div>
        <div className="top-bar-right">
          <div className="user-menu">
            <div className="user-avatar"><FiUser size={16} /></div>
            <span className="user-name">{user?.full_name}</span>
            <button className="btn-logout" onClick={onLogout} title="Sign Out">
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <Link to="/dashboard" className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}>
              <FiGrid size={18} />
              <span>Dashboard</span>
            </Link>

            {sidebarGroups.map(group => (
              <div key={group.label} className="sidebar-group">
                <button className="sidebar-group-header" onClick={() => toggleGroup(group.label)}>
                  {expandedGroups[group.label] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  <span>{group.label}</span>
                </button>
                {expandedGroups[group.label] && (
                  <div className="sidebar-group-items">
                    {group.items.map(key => {
                      const mod = modules[key];
                      if (!mod) return null;
                      const Icon = mod.icon;
                      return (
                        <Link
                          key={key}
                          to={`/${key}`}
                          className={`sidebar-item ${isActive(key) ? 'active' : ''}`}
                        >
                          <Icon size={16} />
                          <span>{mod.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="sidebar-divider"></div>
            <Link to="/ai-insights" className={`sidebar-item ai-sidebar-item ${isActive('/ai-insights') ? 'active' : ''}`}>
              <FiCpu size={18} />
              <span>AI Copilot</span>
            </Link>
            <Link to="/ai-advanced" className={`sidebar-item ai-sidebar-item ${isActive('/ai-advanced') ? 'active' : ''}`}>
              <FiZap size={18} />
              <span>AI Advanced</span>
            </Link>
            <Link to="/custom-views" className={`sidebar-item ${isActive('/custom-views') ? 'active' : ''}`}>
              <FiLayers size={18} />
              <span>Dynamics Views</span>
            </Link>
          </nav>
        </aside>

        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/ai-advanced" element={<AIAdvanced />} />
        <Route path="/custom-views" element={<CustomViewsPage />} />
        <Route path="/:moduleKey" element={<ModulePage />} />
        <Route path="/:moduleKey/:id" element={<DetailPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
