import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../api';
import { modules } from '../modules';
import { FiTrendingUp, FiDollarSign, FiUsers, FiHome, FiAlertCircle, FiBriefcase, FiUserCheck } from 'react-icons/fi';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div><p>Loading dashboard...</p></div>;
  if (!stats) return <div className="error-container">Failed to load dashboard data</div>;

  const kpiCards = [
    { label: 'Pipeline Value', value: formatCurrency(stats.pipelineValue), icon: FiDollarSign, color: '#0078D4', sub: `${stats.openOpportunities} open deals` },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: FiTrendingUp, color: '#107C10', sub: 'Total collected' },
    { label: 'Active Leads', value: stats.activeLeads, icon: FiUsers, color: '#FF8C00', sub: 'In pipeline' },
    { label: 'Open Cases', value: stats.openCases, icon: FiAlertCircle, color: '#D83B01', sub: 'Need attention' },
    { label: 'Active Projects', value: stats.activeProjects, icon: FiBriefcase, color: '#8764B8', sub: 'In progress' },
    { label: 'Employees', value: stats.activeEmployees, icon: FiUserCheck, color: '#E3008C', sub: 'Active team' },
  ];

  const moduleCards = Object.values(modules);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome to Microsoft Dynamics 365</p>
      </div>

      <div className="kpi-grid">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ borderTopColor: kpi.color }}>
            <div className="kpi-icon" style={{ backgroundColor: kpi.color + '15', color: kpi.color }}>
              <kpi.icon size={24} />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{kpi.value}</span>
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-sub">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Pipeline by Stage</h2>
          <div className="pipeline-chart">
            {stats.pipelineStages?.map((stage, i) => {
              const maxTotal = Math.max(...stats.pipelineStages.map(s => parseFloat(s.total)));
              const width = maxTotal > 0 ? (parseFloat(stage.total) / maxTotal) * 100 : 0;
              return (
                <div key={i} className="pipeline-row">
                  <span className="pipeline-label">{stage.stage}</span>
                  <div className="pipeline-bar-container">
                    <div className="pipeline-bar" style={{ width: `${width}%`, backgroundColor: ['#0078D4', '#107C10', '#FF8C00', '#E74856', '#8764B8'][i % 5] }}>
                    </div>
                  </div>
                  <span className="pipeline-value">{formatCurrency(parseFloat(stage.total))}</span>
                  <span className="pipeline-count">{stage.count} deals</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Top Deals</h2>
          <div className="top-deals">
            {stats.topDeals?.map((deal, i) => (
              <div key={i} className="deal-row" onClick={() => navigate('/opportunities')}>
                <div className="deal-info">
                  <span className="deal-name">{deal.name}</span>
                  <span className="deal-account">{deal.account_name}</span>
                </div>
                <div className="deal-meta">
                  <span className="deal-amount">{formatCurrency(parseFloat(deal.amount))}</span>
                  <span className={`badge badge-${deal.stage?.toLowerCase()}`}>{deal.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Applications</h2>
        <div className="module-grid">
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.key}
                className="module-card"
                onClick={() => navigate(`/${mod.key}`)}
                style={{ '--module-color': mod.color }}
              >
                <div className="module-icon" style={{ backgroundColor: mod.color + '15', color: mod.color }}>
                  <Icon size={28} />
                </div>
                <div className="module-info">
                  <h3>{mod.name}</h3>
                  <p>{mod.description}</p>
                </div>
                <div className="module-arrow">›</div>
              </div>
            );
          })}
          <div
            className="module-card ai-card"
            onClick={() => navigate('/ai-insights')}
            style={{ '--module-color': '#0078D4' }}
          >
            <div className="module-icon ai-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
                <path d="M16 14a4 4 0 0 1 4 4v2H4v-2a4 4 0 0 1 4-4"/>
                <circle cx="12" cy="6" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div className="module-info">
              <h3>AI Copilot</h3>
              <p>AI-powered insights, forecasting, and analysis</p>
            </div>
            <div className="module-arrow">›</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Activities</h2>
        <div className="activity-list">
          {stats.recentActivities?.map((act, i) => (
            <div key={i} className="activity-row" onClick={() => navigate('/activities')}>
              <div className={`activity-type-icon type-${act.type?.toLowerCase()}`}>
                {act.type?.[0]}
              </div>
              <div className="activity-info">
                <span className="activity-subject">{act.subject}</span>
                <span className="activity-meta">{act.type} · {act.regarding} · {act.assigned_to}</span>
              </div>
              <span className={`badge badge-${act.status?.toLowerCase().replace(' ', '-')}`}>{act.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
