import React, { useState } from 'react';
import { FiFileText, FiDownload, FiEye } from 'react-icons/fi';

export default function SyncReportPDF() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  async function fetchPDF() {
    setBusy(true);
    setStatus(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/sync-report.pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setStatus({ kind: 'ok', msg: `PDF generated (${Math.round(blob.size / 1024)} KB)` });
    } catch (e) {
      setStatus({ kind: 'err', msg: e.message });
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'dynamics-sync-report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiFileText color="#A4262C" size={20} />
          <h3 style={{ margin: 0, fontSize: 16 }}>Sync Report (PDF)</h3>
        </div>
      </div>
      <p style={{ color: '#555', fontSize: 13, marginTop: 0 }}>
        Generates a printable PDF summarizing sync runs over the last 14 days: totals,
        per-entity breakdown, and the most recent 18 sync runs. Server returns a real
        <code style={{ background: '#f3f2f1', padding: '1px 4px', margin: '0 4px', borderRadius: 3 }}>application/pdf</code>
        document — no extra libraries.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={fetchPDF} disabled={busy} style={primaryBtn}>
          <FiEye size={14} /> {busy ? 'Generating…' : 'Generate / Preview'}
        </button>
        <button onClick={download} disabled={!pdfUrl} style={secondaryBtn}>
          <FiDownload size={14} /> Download
        </button>
        {status && (
          <span style={{ color: status.kind === 'ok' ? '#107C10' : '#A4262C', fontSize: 12, alignSelf: 'center' }}>
            {status.msg}
          </span>
        )}
      </div>
      {pdfUrl && (
        <div style={{ marginTop: 14 }}>
          <iframe src={pdfUrl} title="Sync report" style={{ width: '100%', height: 480, border: '1px solid #ddd', borderRadius: 6, background: '#fff' }} />
        </div>
      )}
    </div>
  );
}

const cardStyle = { background: '#fff', border: '1px solid #e1e1e1', borderRadius: 8, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0078D4', border: 'none', color: '#fff', borderRadius: 4, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
const secondaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f2f1', border: '1px solid #ddd', borderRadius: 4, padding: '8px 14px', cursor: 'pointer', fontSize: 13 };
