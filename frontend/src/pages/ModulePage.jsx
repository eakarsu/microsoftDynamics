import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { modules } from '../modules';
import { fetchAll, createItem } from '../api';
import { FiPlus, FiSearch, FiX, FiRefreshCw } from 'react-icons/fi';

function formatValue(value, format) {
  if (value == null || value === '') return '—';
  if (format === 'currency') return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (format === 'percent') return `${value}%`;
  if (format === 'date') return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  if (format === 'datetime') return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (format === 'number') return parseFloat(value).toLocaleString();
  return String(value);
}

function getBadgeClass(value) {
  if (!value) return '';
  const v = value.toString().toLowerCase();
  if (['active', 'paid', 'won', 'completed', 'delivered', 'published', 'achieved', 'hot'].includes(v)) return 'badge-success';
  if (['in progress', 'processing', 'contacted', 'warm', 'pending', 'confirmed', 'open', 'planning'].includes(v)) return 'badge-info';
  if (['new', 'draft', 'not started', 'planned', 'medium'].includes(v)) return 'badge-default';
  if (['high', 'overdue', 'critical', 'at risk', 'shipped'].includes(v)) return 'badge-warning';
  if (['inactive', 'lost', 'cancelled', 'closed', 'cold', 'disqualified', 'terminated', 'low'].includes(v)) return 'badge-danger';
  return 'badge-default';
}

export default function ModulePage() {
  const { moduleKey } = useParams();
  const navigate = useNavigate();
  const config = modules[moduleKey];
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAll(moduleKey, search);
      if (result) {
        setData(result.data || []);
        setTotal(result.total || 0);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [moduleKey, search]);

  useEffect(() => {
    setShowForm(false);
    setSearch('');
    loadData();
  }, [moduleKey]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [search, loadData]);

  if (!config) return <div className="error-container">Module not found: {moduleKey}</div>;

  const handleRowClick = (item) => {
    navigate(`/${moduleKey}/${item.id}`);
  };

  const handleNew = () => {
    const initial = {};
    config.fields.forEach(f => { initial[f.key] = ''; });
    setFormData(initial);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanData = {};
    config.fields.forEach(f => {
      if (formData[f.key] !== undefined && formData[f.key] !== '') {
        cleanData[f.key] = formData[f.key];
      }
    });
    const created = await createItem(moduleKey, cleanData);
    setShowForm(false);
    if (created?.id) {
      navigate(`/${moduleKey}/${created.id}`);
    } else {
      loadData();
    }
  };

  const Icon = config.icon;

  return (
    <div className="module-page">
      <div className="page-header">
        <div className="page-header-left">
          <Icon size={28} style={{ color: config.color }} />
          <div>
            <h1>{config.name}</h1>
            <p className="page-subtitle">{total} records · {config.description}</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-icon" onClick={loadData} title="Refresh">
            <FiRefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={handleNew}>
            <FiPlus size={16} /> New {config.name.replace(/s$/, '').replace(/_/g, ' ')}
          </button>
        </div>
      </div>

      {/* New Item Form Overlay */}
      {showForm && (
        <div className="new-form-overlay">
          <div className="new-form-card">
            <div className="new-form-header">
              <h2>New {config.name.replace(/s$/, '').replace(/_/g, ' ')}</h2>
              <button className="btn btn-icon" onClick={() => setShowForm(false)}><FiX size={18} /></button>
            </div>
            <form className="new-form-body" onSubmit={handleSave}>
              <div className="new-form-grid">
                {config.fields.map(field => (
                  <div key={field.key} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
                    <label>{field.label} {field.required && <span className="required">*</span>}</label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        rows={3}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        required={field.required}
                        step={field.type === 'number' ? 'any' : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="new-form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiPlus size={14} /> Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="data-panel">
        <div className="search-bar">
          <FiSearch size={16} />
          <input
            type="text"
            placeholder={`Search ${config.name.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}><FiX size={14} /></button>}
        </div>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner"></div></div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {config.columns.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={config.columns.length} className="empty-state">No records found</td></tr>
                ) : (
                  data.map(item => (
                    <tr
                      key={item.id}
                      className="data-row"
                      onClick={() => handleRowClick(item)}
                    >
                      {config.columns.map(col => (
                        <td key={col.key}>
                          {col.badge ? (
                            <span className={`badge ${getBadgeClass(item[col.key])}`}>{item[col.key] || '—'}</span>
                          ) : (
                            formatValue(item[col.key], col.format)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
