import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiRefreshCw, FiLink2 } from 'react-icons/fi';

const TRANSFORMS = ['copy', 'lowercase', 'uppercase', 'trim', 'to_number', 'to_date'];

function blankRule() {
  return {
    source_entity: '',
    target_entity: '',
    source_field: '',
    target_field: '',
    transform: 'copy',
    is_active: true,
    notes: '',
  };
}

async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/custom-views/mapping-rules${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { error: text }; }
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

export default function MappingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState(blankRule());
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const j = await api('');
      setRules(j.rules || []);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  function flash(kind, text) {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function create() {
    try {
      await api('', { method: 'POST', body: JSON.stringify(draft) });
      setDraft(blankRule());
      flash('ok', 'Rule created');
      load();
    } catch (e) { flash('err', e.message); }
  }

  async function save(id) {
    try {
      await api(`/${id}`, { method: 'PUT', body: JSON.stringify(editDraft) });
      setEditingId(null);
      setEditDraft(null);
      flash('ok', 'Rule updated');
      load();
    } catch (e) { flash('err', e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this mapping rule?')) return;
    try {
      await api(`/${id}`, { method: 'DELETE' });
      flash('ok', 'Rule deleted');
      load();
    } catch (e) { flash('err', e.message); }
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiLink2 color="#8764B8" size={20} />
          <h3 style={{ margin: 0, fontSize: 16 }}>Mapping Rules Editor</h3>
        </div>
        <button onClick={load} style={btn}><FiRefreshCw size={14} /> Reload</button>
      </div>

      {msg && (
        <div style={{ marginBottom: 10, padding: '6px 10px', borderRadius: 4, fontSize: 12,
                      background: msg.kind === 'ok' ? '#dff6dd' : '#fde7e9',
                      color: msg.kind === 'ok' ? '#107C10' : '#A4262C' }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: '#faf9f8', border: '1px solid #ececec', borderRadius: 6, padding: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: '#333' }}>
          <FiPlus size={12} /> Create new mapping rule
        </div>
        <div style={gridStyle}>
          <input style={input} placeholder="Source entity (e.g. contacts)" value={draft.source_entity}
                 onChange={e => setDraft({ ...draft, source_entity: e.target.value })} />
          <input style={input} placeholder="Target entity (e.g. salesforce_contact)" value={draft.target_entity}
                 onChange={e => setDraft({ ...draft, target_entity: e.target.value })} />
          <input style={input} placeholder="Source field" value={draft.source_field}
                 onChange={e => setDraft({ ...draft, source_field: e.target.value })} />
          <input style={input} placeholder="Target field" value={draft.target_field}
                 onChange={e => setDraft({ ...draft, target_field: e.target.value })} />
          <select style={input} value={draft.transform}
                  onChange={e => setDraft({ ...draft, transform: e.target.value })}>
            {TRANSFORMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input style={input} placeholder="Notes" value={draft.notes}
                 onChange={e => setDraft({ ...draft, notes: e.target.value })} />
        </div>
        <button onClick={create} style={{ ...primaryBtn, marginTop: 10 }}>
          <FiPlus size={14} /> Create rule
        </button>
      </div>

      {loading ? <div>Loading…</div> : err ? <div style={{ color: '#A4262C' }}>Error: {err}</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f3f2f1' }}>
                <th style={th}>ID</th>
                <th style={th}>Source</th>
                <th style={th}>Target</th>
                <th style={th}>Source field</th>
                <th style={th}>Target field</th>
                <th style={th}>Transform</th>
                <th style={th}>Active</th>
                <th style={th}>Notes</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 16, textAlign: 'center', color: '#888' }}>No mapping rules yet.</td></tr>
              )}
              {rules.map(r => {
                const isEditing = editingId === r.id;
                const v = isEditing ? editDraft : r;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>{r.id}</td>
                    <td style={td}>{isEditing
                      ? <input style={inputSmall} value={v.source_entity || ''} onChange={e => setEditDraft({ ...editDraft, source_entity: e.target.value })} />
                      : r.source_entity}</td>
                    <td style={td}>{isEditing
                      ? <input style={inputSmall} value={v.target_entity || ''} onChange={e => setEditDraft({ ...editDraft, target_entity: e.target.value })} />
                      : r.target_entity}</td>
                    <td style={td}>{isEditing
                      ? <input style={inputSmall} value={v.source_field || ''} onChange={e => setEditDraft({ ...editDraft, source_field: e.target.value })} />
                      : r.source_field}</td>
                    <td style={td}>{isEditing
                      ? <input style={inputSmall} value={v.target_field || ''} onChange={e => setEditDraft({ ...editDraft, target_field: e.target.value })} />
                      : r.target_field}</td>
                    <td style={td}>{isEditing
                      ? <select style={inputSmall} value={v.transform || 'copy'} onChange={e => setEditDraft({ ...editDraft, transform: e.target.value })}>
                          {TRANSFORMS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      : <span style={badge}>{r.transform}</span>}</td>
                    <td style={td}>{isEditing
                      ? <input type="checkbox" checked={!!v.is_active} onChange={e => setEditDraft({ ...editDraft, is_active: e.target.checked })} />
                      : (r.is_active ? <span style={{ color: '#107C10' }}>Yes</span> : <span style={{ color: '#A4262C' }}>No</span>)}</td>
                    <td style={td}>{isEditing
                      ? <input style={inputSmall} value={v.notes || ''} onChange={e => setEditDraft({ ...editDraft, notes: e.target.value })} />
                      : <span style={{ color: '#666' }}>{r.notes}</span>}</td>
                    <td style={td}>
                      {isEditing ? (
                        <>
                          <button onClick={() => save(r.id)} style={iconBtnPrimary} title="Save"><FiSave size={14} /></button>
                          <button onClick={() => { setEditingId(null); setEditDraft(null); }} style={iconBtn} title="Cancel"><FiX size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(r.id); setEditDraft({ ...r }); }} style={iconBtn} title="Edit"><FiEdit2 size={14} /></button>
                          <button onClick={() => remove(r.id)} style={iconBtnDanger} title="Delete"><FiTrash2 size={14} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cardStyle = { background: '#fff', border: '1px solid #e1e1e1', borderRadius: 8, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 };
const btn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f2f1', border: '1px solid #ddd', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 12 };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0078D4', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 };
const input = { padding: '7px 9px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, width: '100%', boxSizing: 'border-box' };
const inputSmall = { padding: '4px 6px', border: '1px solid #ccc', borderRadius: 3, fontSize: 11, width: '100%', boxSizing: 'border-box' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #ddd', fontWeight: 600, color: '#444' };
const td = { padding: '7px 10px', verticalAlign: 'middle' };
const badge = { background: '#eff6fc', color: '#0078D4', padding: '2px 6px', borderRadius: 3, fontSize: 11 };
const iconBtn = { background: 'transparent', border: '1px solid #ddd', borderRadius: 3, padding: 5, marginRight: 4, cursor: 'pointer', color: '#555' };
const iconBtnPrimary = { ...iconBtn, background: '#0078D4', color: '#fff', borderColor: '#0078D4' };
const iconBtnDanger = { ...iconBtn, color: '#A4262C', borderColor: '#f3c0c4' };
