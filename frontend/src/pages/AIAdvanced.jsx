import React, { useState } from 'react';
import { callAI } from '../api';
import { FiFileText, FiUserX, FiZap, FiLoader, FiTrendingUp, FiGitBranch } from 'react-icons/fi';

const features = [
  {
    key: 'quote-generate',
    name: 'Quote Generator',
    icon: FiFileText,
    color: '#0078D4',
    desc: 'Generate a professional sales quote document',
    fields: [
      { name: 'customer', label: 'Customer / Account', placeholder: 'e.g., Contoso Ltd.' },
      { name: 'products', label: 'Products / Services', placeholder: 'e.g., 50 x Dynamics 365 Sales user licenses' },
      { name: 'amount', label: 'Total Amount', placeholder: 'e.g., $48,500' },
      { name: 'terms', label: 'Terms / Notes', placeholder: 'e.g., Net 30, valid 30 days' },
    ],
  },
  {
    key: 'churn-prediction',
    name: 'Churn Prediction',
    icon: FiUserX,
    color: '#A4262C',
    desc: 'Identify accounts at risk of churn with reasons',
    fields: [
      { name: 'segment', label: 'Customer Segment', placeholder: 'e.g., Enterprise SaaS, > 12 months tenure' },
      { name: 'window', label: 'Lookback Window', placeholder: 'e.g., last 90 days' },
      { name: 'signals', label: 'Known Signals', placeholder: 'e.g., declining usage, support ticket spikes' },
    ],
  },
  {
    key: 'workflow-recommend',
    name: 'Workflow Recommendations',
    icon: FiZap,
    color: '#107C10',
    desc: 'Recommend automation workflows for your business',
    fields: [
      { name: 'goal', label: 'Process Goal', placeholder: 'e.g., reduce lead response time' },
      { name: 'currentProcess', label: 'Current Process', placeholder: 'Briefly describe how it works today' },
      { name: 'painPoints', label: 'Pain Points', placeholder: 'What is broken or slow today?' },
    ],
  },
  {
    key: 'lead-conversion-advisor',
    name: 'Lead Conversion Advisor',
    icon: FiTrendingUp,
    color: '#5C2D91',
    desc: 'Decide if a lead is ready to convert and draft the opportunity',
    fields: [
      { name: 'lead', label: 'Lead Details (text or JSON)', placeholder: 'name, company, source, status, rating, est_value...' },
      { name: 'criteria', label: 'Conversion Criteria (optional)', placeholder: 'e.g., BANT: budget>$50k, authority=director, need=urgent, timeline=Q1' },
    ],
  },
  {
    key: 'workflow-state-machine',
    name: 'Workflow State-Machine Designer',
    icon: FiGitBranch,
    color: '#0078D4',
    desc: 'Design a full state machine with approvals and SLAs',
    fields: [
      { name: 'processName', label: 'Process Name', placeholder: 'e.g., Purchase Requisition Approval' },
      { name: 'description', label: 'Description', placeholder: 'What the process does and who is involved' },
      { name: 'actors', label: 'Actors / Roles', placeholder: 'e.g., requester, manager, finance, vendor' },
      { name: 'approvalLevels', label: 'Approval Levels', placeholder: 'e.g., 2-tier (manager + finance over $10k)' },
    ],
  },
];

function Output({ content }) {
  if (!content) return null;
  return (
    <div className="ai-output">
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{content}</pre>
    </div>
  );
}

export default function AIAdvanced() {
  const [activeKey, setActiveKey] = useState(features[0].key);
  const [forms, setForms] = useState(() =>
    features.reduce((acc, f) => {
      acc[f.key] = f.fields.reduce((m, fld) => ({ ...m, [fld.name]: '' }), {});
      return acc;
    }, {})
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const active = features.find((f) => f.key === activeKey);

  const updateField = (key, name, value) => {
    setForms((prev) => ({ ...prev, [key]: { ...prev[key], [name]: value } }));
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await callAI(activeKey, forms[activeKey]);
      if (data?.error) {
        const msg = typeof data.error === 'string' ? data.error : (data.error.message || 'AI request failed');
        setError(msg);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const aiContent = result?.choices?.[0]?.message?.content;

  return (
    <div className="ai-insights-page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="ai-header-icon">
            <FiZap size={28} color="#0078D4" />
          </div>
          <div>
            <h1>AI Advanced</h1>
            <p className="page-subtitle">Quote generation, churn prediction, and workflow recommendations</p>
          </div>
        </div>
      </div>

      <div className="ai-grid">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.key}
              className={`ai-feature-card ${activeKey === f.key ? 'active' : ''}`}
              onClick={() => { setActiveKey(f.key); setResult(null); setError(null); }}
              style={{ '--ai-color': f.color }}
            >
              <div className="ai-feature-icon" style={{ backgroundColor: f.color + '15', color: f.color }}>
                <Icon size={24} />
              </div>
              <h3>{f.name}</h3>
              <p>{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="ai-input-section">
        <h3>{active.name}</h3>
        <div className="content-form">
          {active.fields.map((fld) => (
            <div className="form-group" key={fld.name}>
              <label>{fld.label}</label>
              {fld.name === 'currentProcess' || fld.name === 'painPoints' || fld.name === 'signals' || fld.name === 'terms' || fld.name === 'products' || fld.name === 'lead' || fld.name === 'criteria' || fld.name === 'description' || fld.name === 'actors' ? (
                <textarea
                  rows={3}
                  placeholder={fld.placeholder}
                  value={forms[active.key][fld.name]}
                  onChange={(e) => updateField(active.key, fld.name, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  placeholder={fld.placeholder}
                  value={forms[active.key][fld.name]}
                  onChange={(e) => updateField(active.key, fld.name, e.target.value)}
                />
              )}
            </div>
          ))}
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? (<><FiLoader className="spin" size={16} /> Generating...</>) : 'Run AI'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="ai-loading-section">
          <div className="ai-loading-animation">
            <div className="ai-dot"></div><div className="ai-dot"></div><div className="ai-dot"></div>
          </div>
          <p>AI is working...</p>
        </div>
      )}

      {error && (
        <div className="ai-error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {aiContent && (
        <div className="ai-result-section">
          <div className="ai-result-header">
            <h3>{active.name} Result</h3>
            <div className="ai-result-meta">
              <span>Model: {result?.model || 'claude-haiku'}</span>
              <span>Tokens: {result?.usage?.total_tokens || '—'}</span>
            </div>
          </div>
          <Output content={aiContent} />
          <div className="ai-result-footer">
            <button className="btn btn-outline" onClick={submit}>
              <FiLoader size={14} /> Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
