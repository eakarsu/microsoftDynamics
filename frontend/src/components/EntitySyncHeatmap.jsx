import React, { useEffect, useState } from 'react';
import { FiGrid, FiRefreshCw } from 'react-icons/fi';

export default function EntitySyncHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [hovered, setHovered] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/entity-heatmap', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setData(j);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={cardStyle}>Loading heatmap…</div>;
  if (err) return <div style={{ ...cardStyle, color: '#A4262C' }}>Error: {err}</div>;

  const matrix = data?.matrix || [];
  const hours = data?.hours || [];
  const max = data?.max || 1;
  const cellSize = 22;

  const colorFor = (v) => {
    if (!v) return '#f3f2f1';
    const t = v / max;
    const r = Math.round(0 + (16 - 0) * (1 - t));
    const g = Math.round(120 + (60 - 120) * t);
    const b = Math.round(212 + (16 - 212) * t);
    return `rgb(${Math.max(0, r)}, ${Math.max(0, g)}, ${Math.max(0, b)})`;
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiGrid color="#107C10" size={20} />
          <h3 style={{ margin: 0, fontSize: 16 }}>Entity Sync Heatmap (Entity × Hour of Day)</h3>
        </div>
        <button onClick={load} style={btn}><FiRefreshCw size={14} /> Refresh</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: '2px 6px', textAlign: 'right', color: '#666' }}>Entity \ Hour</th>
              {hours.map(h => (
                <th key={h} style={{ width: cellSize, color: '#888', fontWeight: 400 }}>
                  {h % 3 === 0 ? h : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(row => (
              <tr key={row.entity}>
                <td style={{ padding: '2px 6px', textAlign: 'right', color: '#333', fontWeight: 500 }}>{row.entity}</td>
                {row.cells.map(c => (
                  <td key={c.hour}
                      onMouseEnter={() => setHovered({ entity: row.entity, hour: c.hour, volume: c.volume })}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        width: cellSize, height: cellSize,
                        background: colorFor(c.volume),
                        borderRadius: 3, cursor: 'pointer',
                        textAlign: 'center', color: c.volume > max * 0.5 ? '#fff' : '#333',
                        fontSize: 9,
                      }}
                      title={`${row.entity} @ ${c.hour}:00 — ${c.volume} records`}
                  >
                    {c.volume > max * 0.6 ? c.volume : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 11, color: '#666' }}>
        <span>Low</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i) => (
          <div key={i} style={{ width: 26, height: 14, background: colorFor(t * max), borderRadius: 2 }} />
        ))}
        <span>High ({max})</span>
        {hovered && (
          <span style={{ marginLeft: 18, color: '#0078D4' }}>
            {hovered.entity} @ {hovered.hour}:00 → {hovered.volume} records
          </span>
        )}
      </div>
    </div>
  );
}

const cardStyle = { background: '#fff', border: '1px solid #e1e1e1', borderRadius: 8, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 };
const btn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f2f1', border: '1px solid #ddd', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 12 };
