import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { modules } from '../modules';
import { fetchOne, updateItem, deleteItem } from '../api';
import { FiArrowLeft, FiEdit2, FiTrash2, FiSave, FiX, FiClock, FiCalendar } from 'react-icons/fi';

function formatValue(value, format) {
  if (value == null || value === '') return '—';
  if (format === 'currency') return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (format === 'percent') return `${value}%`;
  if (format === 'date') return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  if (format === 'datetime') return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

function getFieldFormat(key) {
  if (['amount', 'annual_revenue', 'salary', 'price', 'cost', 'budget', 'actual_cost', 'total', 'tax', 'estimated_value', 'expected_revenue', 'actual_revenue', 'target_revenue', 'target_value', 'actual_value'].includes(key)) return 'currency';
  if (['progress', 'probability', 'market_share'].includes(key)) return 'percent';
  return null;
}

export default function DetailPage() {
  const { moduleKey, id } = useParams();
  const navigate = useNavigate();
  const config = modules[moduleKey];
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadRecord();
  }, [moduleKey, id]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const data = await fetchOne(moduleKey, id);
      setRecord(data);
      setFormData({ ...data });
    } catch (err) {
      console.error('Failed to load record:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!config) return <div className="error-container">Module not found</div>;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    await deleteItem(moduleKey, id);
    navigate(`/${moduleKey}`);
  };

  const handleSave = async () => {
    const cleanData = {};
    config.fields.forEach(f => {
      if (formData[f.key] !== undefined && formData[f.key] !== '') {
        cleanData[f.key] = formData[f.key];
      }
    });
    const updated = await updateItem(moduleKey, id, cleanData);
    if (updated) {
      setRecord(updated);
      setFormData({ ...updated });
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...record });
    setEditing(false);
  };

  const Icon = config.icon;

  // Get display name for the record
  const getRecordTitle = () => {
    if (!record) return '';
    if (record.name) return record.name;
    if (record.title) return record.title;
    if (record.subject) return record.subject;
    if (record.first_name) return `${record.first_name} ${record.last_name || ''}`;
    if (record.invoice_number) return record.invoice_number;
    if (record.quote_number) return record.quote_number;
    if (record.order_number) return record.order_number;
    return `Record #${record.id}`;
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-container"><div className="loading-spinner"></div><p>Loading record...</p></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="detail-page">
        <div className="error-container">Record not found</div>
      </div>
    );
  }

  // Find a status field for the header badge
  const statusValue = record.status || record.stage || record.priority;

  return (
    <div className="detail-page">
      {/* Top Navigation */}
      <div className="detail-page-topbar">
        <button className="btn btn-back" onClick={() => navigate(`/${moduleKey}`)}>
          <FiArrowLeft size={16} />
          <span>Back to {config.name}</span>
        </button>
        <div className="detail-page-actions">
          {editing ? (
            <>
              <button className="btn btn-outline" onClick={handleCancel}><FiX size={14} /> Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}><FiSave size={14} /> Save Changes</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setEditing(true)}><FiEdit2 size={14} /> Edit</button>
              <button className="btn btn-danger-outline" onClick={handleDelete}><FiTrash2 size={14} /> Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Record Header */}
      <div className="detail-page-header" style={{ borderLeftColor: config.color }}>
        <div className="detail-page-header-icon" style={{ backgroundColor: config.color + '15', color: config.color }}>
          <Icon size={32} />
        </div>
        <div className="detail-page-header-info">
          <h1>{getRecordTitle()}</h1>
          <div className="detail-page-header-meta">
            <span className="detail-page-module-name">{config.name.replace(/s$/, '').replace(/_/g, ' ')}</span>
            {statusValue && <span className={`badge badge-lg ${getBadgeClass(statusValue)}`}>{statusValue}</span>}
            <span className="detail-page-id">ID: {record.id}</span>
          </div>
        </div>
      </div>

      {/* Record Body */}
      <div className="detail-page-body">
        {/* Main Fields Card */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h2>Details</h2>
          </div>
          <div className="detail-card-grid">
            {config.fields.map(field => {
              const fmt = getFieldFormat(field.key);
              if (editing) {
                return (
                  <div key={field.key} className={`detail-card-field ${field.type === 'textarea' ? 'full-width' : ''}`}>
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
                );
              }

              const raw = record[field.key];
              let display;
              if (fmt) {
                display = formatValue(raw, fmt);
              } else if (field.key.includes('date') && raw) {
                display = formatValue(raw, field.type === 'datetime-local' ? 'datetime' : 'date');
              } else {
                display = raw ?? '—';
              }

              const isBadge = ['status', 'priority', 'stage', 'rating', 'threat_level', 'type'].includes(field.key);

              return (
                <div key={field.key} className={`detail-card-field ${field.type === 'textarea' ? 'full-width' : ''}`}>
                  <label>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <div className="detail-field-textarea">{display}</div>
                  ) : isBadge && raw ? (
                    <span className={`badge ${getBadgeClass(raw)}`}>{raw}</span>
                  ) : fmt === 'currency' ? (
                    <span className="detail-field-currency">{display}</span>
                  ) : (
                    <span className="detail-field-value">{display}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timestamps Card */}
        <div className="detail-card detail-card-timestamps">
          <div className="detail-card-header">
            <h2>Record Information</h2>
          </div>
          <div className="detail-timestamps-grid">
            <div className="detail-timestamp">
              <FiCalendar size={16} />
              <div>
                <label>Created</label>
                <span>{formatValue(record.created_at, 'datetime')}</span>
              </div>
            </div>
            {record.updated_at && (
              <div className="detail-timestamp">
                <FiClock size={16} />
                <div>
                  <label>Last Modified</label>
                  <span>{formatValue(record.updated_at, 'datetime')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
