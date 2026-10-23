import React, { useCallback, useEffect, useState } from 'react';
import { getToken } from '../api';
import NativeAIReport from './NativeAIReport';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function call(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message || `Request failed (${res.status})`);
  return body;
}

// Wave 15B UI: follow-up tasks, lead export, and lead AI over own leads.
export default function FeaturePackPanel({ leads = [], selectedId = null }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    try { const data = await call('/api/tasks'); setTasks(data.data || []); } catch (_) { /* best-effort */ }
  }, []);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function addTask(event) {
    event.preventDefault();
    try { await call('/api/tasks', { method: 'POST', body: JSON.stringify({ title }) }); setTitle(''); loadTasks(); }
    catch (e) { setError(e.message); }
  }
  async function toggleTask(task) {
    try { await call(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'done' ? 'open' : 'done' }) }); loadTasks(); }
    catch (e) { setError(e.message); }
  }
  async function runAi(feature) {
    setError('');
    try {
      const path = feature === 'pipeline-health' ? '/api/runtime-ai/pipeline-health' : `/api/runtime-ai/${feature}`;
      const body = feature === 'pipeline-health' ? {} : { leadId: selectedId };
      setReport(await call(path, { method: 'POST', body: JSON.stringify(body) }));
    } catch (e) { setError(e.message); }
  }
  async function downloadExport(format) {
    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/api/leads/export?format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `leads.${format}`; link.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  }

  return (
    <section className="panel" aria-label="Tasks, export and lead AI">
      <h2>Follow-up tasks, export &amp; lead AI</h2>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={addTask}>
        <label>New task <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} /></label>
        <button type="submit">Add task</button>
      </form>
      <ul>{tasks.map((t) => <li key={t.id}><span>{t.title} — {t.status}</span> <button type="button" onClick={() => toggleTask(t)}>{t.status === 'done' ? 'Reopen' : 'Mark done'}</button></li>)}</ul>
      <div>
        <button type="button" onClick={() => downloadExport('csv')}>Export leads (CSV)</button>
        <button type="button" onClick={() => downloadExport('json')}>Export leads (JSON)</button>
      </div>
      <div>
        <button type="button" disabled={!selectedId} onClick={() => runAi('lead-summary')}>Summarize selected lead</button>
        <button type="button" disabled={!selectedId} onClick={() => runAi('next-action')}>Next action</button>
        <button type="button" onClick={() => runAi('pipeline-health')}>Pipeline health ({leads.length} leads)</button>
      </div>
      {report && <NativeAIReport response={report} title={report.feature || 'Lead AI'} />}
    </section>
  );
}
