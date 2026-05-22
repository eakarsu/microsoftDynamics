import React, { useEffect, useState } from 'react';
import { FiActivity, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function SyncActivityChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/sync-activity', {
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

  if (loading) return <div style={cardStyle}>Loading sync activity…</div>;
  if (err) return <div style={{ ...cardStyle, color: '#A4262C' }}>Error: {err}</div>;

  const series = data?.series || [];
  const maxRec = Math.max(1, ...series.map(s => s.records || 0));
  const W = 640, H = 220, P = 36;
  const innerW = W - P * 2, innerH = H - P * 2;
  const step = series.length > 1 ? innerW / (series.length - 1) : innerW;

  const path = series.map((s, i) => {
    const x = P + i * step;
    const y = P + innerH - (s.records / maxRec) * innerH;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiActivity color="#0078D4" size={20} />
          <h3 style={{ margin: 0, fontSize: 16 }}>Sync Activity (Last 14 days)</h3>
        </div>
        <button onClick={load} style={btn}><FiRefreshCw size={14} /> Refresh</button>
      </div>
      <div style={{ display: 'flex', gap: 18, marginBottom: 12, flexWrap: 'wrap' }}>
        <Stat label="Records synced" value={data?.totals?.records?.toLocaleString() || 0} color="#0078D4" />
        <Stat label="Conflicts" value={data?.totals?.conflicts || 0} color="#FF8C00" icon={FiAlertTriangle} />
        <Stat label="Days reported" value={data?.totals?.days || 0} color="#107C10" />
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: '#fafbfc', borderRadius: 6 }}>
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={P} x2={W - P} y1={P + innerH * (1 - t)} y2={P + innerH * (1 - t)}
                stroke="#e8e8e8" strokeDasharray="3 3" />
        ))}
        <path d={path} fill="none" stroke="#0078D4" strokeWidth="2.5" />
        {series.map((s, i) => {
          const x = P + i * step;
          const y = P + innerH - (s.records / maxRec) * innerH;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#0078D4" />
              {s.failures > 0 && <circle cx={x} cy={P + innerH + 12} r="3" fill="#A4262C" />}
            </g>
          );
        })}
        {series.map((s, i) => {
          if (series.length > 8 && i % 2 !== 0) return null;
          const x = P + i * step;
          return (
            <text key={`l-${i}`} x={x} y={H - 10} fontSize="9" fill="#666" textAnchor="middle">
              {s.day.slice(5)}
            </text>
          );
        })}
        <text x={8} y={P + 4} fontSize="10" fill="#666">{maxRec}</text>
        <text x={8} y={P + innerH} fontSize="10" fill="#666">0</text>
      </svg>
      <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
        Blue line = records synced per day · Red dots = days with failed runs
      </div>
    </div>
  );
}

const cardStyle = { background: '#fff', border: '1px solid #e1e1e1', borderRadius: 8, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 };
const btn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f2f1', border: '1px solid #ddd', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 12 };

function Stat({ label, value, color, icon: Icon }) {
  return (
    <div style={{ background: color + '10', borderLeft: `3px solid ${color}`, padding: '8px 12px', borderRadius: 4, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
        {Icon && <Icon size={12} />} {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
