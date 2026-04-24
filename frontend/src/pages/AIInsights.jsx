import React, { useState } from 'react';
import { callAI } from '../api';
import { FiTrendingUp, FiTarget, FiSmile, FiEdit3, FiBarChart2, FiMessageSquare, FiActivity, FiShield, FiLoader } from 'react-icons/fi';

const aiFeatures = [
  { key: 'sales-forecast', name: 'Sales Forecast', icon: FiTrendingUp, color: '#0078D4', desc: 'AI-powered revenue forecasting and pipeline analysis' },
  { key: 'lead-scoring', name: 'Lead Scoring', icon: FiTarget, color: '#FF8C00', desc: 'Intelligent lead scoring and prioritization' },
  { key: 'sentiment', name: 'Sentiment Analysis', icon: FiSmile, color: '#107C10', desc: 'Customer sentiment from support cases' },
  { key: 'content-generate', name: 'Content Generator', icon: FiEdit3, color: '#8764B8', desc: 'AI-generated marketing and sales content' },
  { key: 'insights', name: 'Business Insights', icon: FiBarChart2, color: '#E74856', desc: 'Comprehensive business intelligence analysis' },
  { key: 'performance', name: 'Performance Analysis', icon: FiActivity, color: '#00B7C3', desc: 'Goals and project performance analytics' },
  { key: 'competitor-analysis', name: 'Competitor Analysis', icon: FiShield, color: '#A4262C', desc: 'Competitive intelligence and battle cards' },
  { key: 'copilot', name: 'Copilot Chat', icon: FiMessageSquare, color: '#0078D4', desc: 'Ask anything about your business data' },
];

function AIOutputDisplay({ content }) {
  if (!content) return null;

  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let inList = false;
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(<ul key={`list-${elements.length}`} className="ai-list">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(<h4 key={i} className="ai-h4">{trimmed.replace('### ', '')}</h4>);
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(<h3 key={i} className="ai-h3">{trimmed.replace('## ', '')}</h3>);
        return;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(<h2 key={i} className="ai-h2">{trimmed.replace('# ', '')}</h2>);
        return;
      }

      // Bold headers (like **Header**)
      if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes('**', 2, trimmed.length - 2)) {
        flushList();
        elements.push(<h4 key={i} className="ai-h4">{trimmed.replace(/\*\*/g, '')}</h4>);
        return;
      }

      // List items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
        inList = true;
        const content = trimmed.replace(/^[-*]\s|^\d+\.\s/, '');
        listItems.push(
          <li key={i} dangerouslySetInnerHTML={{
            __html: content
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/`(.+?)`/g, '<code>$1</code>')
          }} />
        );
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={i} className="ai-paragraph" dangerouslySetInnerHTML={{
          __html: trimmed
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
        }} />
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="ai-output">
      {renderMarkdown(content)}
    </div>
  );
}

export default function AIInsights() {
  const [activeFeature, setActiveFeature] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copilotMessage, setCopilotMessage] = useState('');
  const [contentForm, setContentForm] = useState({
    contentType: 'Marketing Email',
    topic: '',
    audience: 'Enterprise IT decision makers',
    tone: 'Professional and engaging',
  });

  const handleRunAI = async (feature) => {
    setActiveFeature(feature);
    setResult(null);
    setLoading(true);
    try {
      let body = {};
      if (feature === 'copilot') {
        body = { message: copilotMessage || 'Give me a summary of the current business performance and key recommendations.' };
      } else if (feature === 'content-generate') {
        body = contentForm;
      }
      const data = await callAI(feature, body);
      setResult(data);
    } catch (err) {
      setResult({ error: { message: err.message } });
    } finally {
      setLoading(false);
    }
  };

  const aiContent = result?.choices?.[0]?.message?.content;
  const aiError = result?.error;

  return (
    <div className="ai-insights-page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="ai-header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0078D4" strokeWidth="2">
              <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
              <path d="M16 14a4 4 0 0 1 4 4v2H4v-2a4 4 0 0 1 4-4"/>
            </svg>
          </div>
          <div>
            <h1>AI Copilot</h1>
            <p className="page-subtitle">Powered by OpenRouter · AI-powered business intelligence</p>
          </div>
        </div>
      </div>

      <div className="ai-grid">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.key}
              className={`ai-feature-card ${activeFeature === feature.key ? 'active' : ''}`}
              onClick={() => {
                if (feature.key === 'copilot' || feature.key === 'content-generate') {
                  setActiveFeature(feature.key);
                  setResult(null);
                } else {
                  handleRunAI(feature.key);
                }
              }}
              style={{ '--ai-color': feature.color }}
            >
              <div className="ai-feature-icon" style={{ backgroundColor: feature.color + '15', color: feature.color }}>
                <Icon size={24} />
              </div>
              <h3>{feature.name}</h3>
              <p>{feature.desc}</p>
              {loading && activeFeature === feature.key && (
                <div className="ai-loading-badge">
                  <FiLoader className="spin" size={14} /> Analyzing...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeFeature === 'copilot' && !result && (
        <div className="ai-input-section">
          <h3>Ask Copilot</h3>
          <div className="ai-chat-input">
            <input
              type="text"
              placeholder="Ask anything about your business data..."
              value={copilotMessage}
              onChange={(e) => setCopilotMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunAI('copilot')}
            />
            <button className="btn btn-primary" onClick={() => handleRunAI('copilot')} disabled={loading}>
              {loading ? <FiLoader className="spin" size={16} /> : 'Send'}
            </button>
          </div>
          <div className="ai-suggestions">
            {['What are our top performing accounts?', 'Summarize the current sales pipeline', 'Which leads should I prioritize this week?', 'Give me a customer service health report'].map((q, i) => (
              <button key={i} className="ai-suggestion" onClick={() => { setCopilotMessage(q); handleRunAI('copilot'); }}>{q}</button>
            ))}
          </div>
        </div>
      )}

      {activeFeature === 'content-generate' && !result && (
        <div className="ai-input-section">
          <h3>Content Generator</h3>
          <div className="content-form">
            <div className="form-group">
              <label>Content Type</label>
              <select value={contentForm.contentType} onChange={(e) => setContentForm({...contentForm, contentType: e.target.value})}>
                <option>Marketing Email</option>
                <option>Blog Post</option>
                <option>Social Media Post</option>
                <option>Sales Pitch</option>
                <option>Product Description</option>
                <option>Newsletter</option>
              </select>
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input type="text" placeholder="e.g., New AI features launch" value={contentForm.topic} onChange={(e) => setContentForm({...contentForm, topic: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Target Audience</label>
              <input type="text" value={contentForm.audience} onChange={(e) => setContentForm({...contentForm, audience: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tone</label>
              <select value={contentForm.tone} onChange={(e) => setContentForm({...contentForm, tone: e.target.value})}>
                <option>Professional and engaging</option>
                <option>Casual and friendly</option>
                <option>Formal and authoritative</option>
                <option>Technical and detailed</option>
                <option>Persuasive and compelling</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => handleRunAI('content-generate')} disabled={loading}>
              {loading ? <><FiLoader className="spin" size={16} /> Generating...</> : 'Generate Content'}
            </button>
          </div>
        </div>
      )}

      {(loading && activeFeature) && (
        <div className="ai-loading-section">
          <div className="ai-loading-animation">
            <div className="ai-dot"></div>
            <div className="ai-dot"></div>
            <div className="ai-dot"></div>
          </div>
          <p>AI is analyzing your data...</p>
        </div>
      )}

      {aiError && (
        <div className="ai-error">
          <h3>Error</h3>
          <p>{aiError.message || 'Failed to get AI response. Please check your OpenRouter API key in the .env file.'}</p>
        </div>
      )}

      {aiContent && (
        <div className="ai-result-section">
          <div className="ai-result-header">
            <h3>{aiFeatures.find(f => f.key === activeFeature)?.name} Results</h3>
            <div className="ai-result-meta">
              <span>Model: {result?.model || 'claude-haiku-4.5'}</span>
              <span>Tokens: {result?.usage?.total_tokens || '—'}</span>
            </div>
          </div>
          <AIOutputDisplay content={aiContent} />
          <div className="ai-result-footer">
            <button className="btn btn-outline" onClick={() => handleRunAI(activeFeature)}>
              <FiLoader size={14} /> Regenerate
            </button>
            <button className="btn btn-outline" onClick={() => { setResult(null); setActiveFeature(null); }}>
              Back to Features
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
