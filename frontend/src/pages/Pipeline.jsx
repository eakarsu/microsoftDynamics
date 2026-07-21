import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const blankLead = { firstName: '', lastName: '', email: '', company: '', estimatedValue: '', notes: '' };
const blankAssessment = { budgetConfirmed: false, authorityIdentified: false, needDefined: false, timelineDays: '90', notes: '' };

function money(value) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value));
}

export default function Pipeline({ identity, onSignOut }) {
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [leadForm, setLeadForm] = useState(blankLead);
  const [assessment, setAssessment] = useState(blankAssessment);
  const [auditValid, setAuditValid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selected = useMemo(() => leads.find((lead) => lead.id === selectedId) || null, [leads, selectedId]);
  const canVerifyAudit = identity.role === 'manager' || identity.role === 'admin';

  const refresh = useCallback(async () => {
    const [leadResult, opportunityResult] = await Promise.all([api.leads(), api.opportunities()]);
    setLeads(leadResult.data);
    setOpportunities(opportunityResult.data);
    setSelectedId((current) => leadResult.data.some((lead) => lead.id === current) ? current : leadResult.data[0]?.id || null);
  }, []);

  useEffect(() => {
    refresh().catch((requestError) => setError(requestError.message));
  }, [refresh]);

  async function run(action, success) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await refresh();
      setNotice(success);
    } catch (requestError) {
      const suffix = requestError.details?.currentVersion ? ` Current version: ${requestError.details.currentVersion}.` : '';
      setError(`${requestError.message}${suffix}`);
    } finally {
      setBusy(false);
    }
  }

  function createLead(event) {
    event.preventDefault();
    run(async () => {
      const result = await api.createLead({ ...leadForm, estimatedValue: Number(leadForm.estimatedValue) });
      setLeadForm(blankLead);
      setSelectedId(result.lead.id);
    }, 'Lead created with an audit event.');
  }

  function qualify(event) {
    event.preventDefault();
    if (!selected) return;
    run(async () => {
      await api.qualifyLead(selected.id, { ...assessment, timelineDays: Number(assessment.timelineDays), expectedVersion: selected.version });
      setAssessment(blankAssessment);
    }, 'Deterministic qualification recorded.');
  }

  function convert() {
    if (!selected) return;
    run(() => api.convertLead(selected.id, selected.version), 'Lead converted transactionally; retrying the same request is safe.');
  }

  async function verifyAudit() {
    setBusy(true);
    setError('');
    try {
      const result = await api.verifyAudit();
      setAuditValid(result.valid);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div><p className="eyebrow">Supported workflow</p><h1>Lead qualification & conversion</h1></div>
        <div className="identity"><span>{identity.name}</span><small>{identity.role.replace('_', ' ')}</small><button className="secondary" onClick={onSignOut}>Sign out</button></div>
      </header>

      <main className="workspace">
        {(error || notice) && <div className={error ? 'error-banner' : 'success-banner'} role="status">{error || notice}</div>}
        <section className="metrics" aria-label="Pipeline summary">
          <div><strong>{leads.length}</strong><span>Visible leads</span></div>
          <div><strong>{leads.filter((lead) => lead.status === 'qualified').length}</strong><span>Qualified</span></div>
          <div><strong>{opportunities.length}</strong><span>Opportunities</span></div>
          <div><strong>{money(opportunities.reduce((sum, item) => sum + item.amount, 0))}</strong><span>Pipeline value</span></div>
        </section>

        <div className="columns">
          <section className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Tenant scoped</p><h2>Leads</h2></div><span>{leads.length}</span></div>
            <div className="lead-list">
              {leads.map((lead) => (
                <button key={lead.id} className={`lead-row ${selectedId === lead.id ? 'selected' : ''}`} onClick={() => setSelectedId(lead.id)}>
                  <span><strong>{lead.firstName} {lead.lastName}</strong><small>{lead.company}</small></span>
                  <span><em className={`status ${lead.status}`}>{lead.status}</em><small>Score {lead.score}</small></span>
                </button>
              ))}
              {!leads.length && <p className="empty">Create the tenant’s first lead.</p>}
            </div>
          </section>

          <section className="panel detail-panel">
            <div className="panel-heading"><div><p className="eyebrow">Optimistic versioning</p><h2>{selected ? `${selected.firstName} ${selected.lastName}` : 'Select a lead'}</h2></div>{selected && <span>v{selected.version}</span>}</div>
            {selected ? (
              <>
                <dl className="details"><div><dt>Company</dt><dd>{selected.company}</dd></div><div><dt>Value</dt><dd>{money(selected.estimatedValue)}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Owner</dt><dd>User {selected.ownerUserId}</dd></div></dl>
                {selected.status !== 'converted' && (
                  <form onSubmit={qualify} className="qualification">
                    <h3>Qualification rubric</h3>
                    {[
                      ['budgetConfirmed', 'Budget confirmed'],
                      ['authorityIdentified', 'Authority identified'],
                      ['needDefined', 'Need defined'],
                    ].map(([name, label]) => <label className="check" key={name}><input type="checkbox" checked={assessment[name]} onChange={(event) => setAssessment({ ...assessment, [name]: event.target.checked })} />{label}<b>25</b></label>)}
                    <label>Decision timeline (days)<input type="number" min="1" max="3650" required value={assessment.timelineDays} onChange={(event) => setAssessment({ ...assessment, timelineDays: event.target.value })} /></label>
                    <label>Assessment note<textarea maxLength="2000" value={assessment.notes} onChange={(event) => setAssessment({ ...assessment, notes: event.target.value })} /></label>
                    <button className="primary" disabled={busy}>Record qualification</button>
                  </form>
                )}
                {selected.status === 'qualified' && <button className="convert" disabled={busy} onClick={convert}>Convert to opportunity</button>}
                {selected.status === 'converted' && <p className="success-banner">Conversion complete. The lead is immutable in this workflow.</p>}
              </>
            ) : <p className="empty">Select or create a lead to begin.</p>}
          </section>
        </div>

        <div className="columns lower">
          <section className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Idempotent transaction</p><h2>Opportunities</h2></div></div>
            <div className="table-wrap"><table><thead><tr><th>Name</th><th>Stage</th><th>Probability</th><th>Amount</th></tr></thead><tbody>{opportunities.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.stage}</td><td>{item.probability}%</td><td>{money(item.amount)}</td></tr>)}</tbody></table>{!opportunities.length && <p className="empty">Qualified conversions appear here.</p>}</div>
          </section>

          <section className="panel audit-card">
            <p className="eyebrow">Append-only evidence</p><h2>Audit chain</h2>
            {canVerifyAudit ? <><p>Verify every tenant event from its genesis hash through the latest mutation.</p><button className="secondary" disabled={busy} onClick={verifyAudit}>Verify chain</button>{auditValid !== null && <strong className={auditValid ? 'valid' : 'invalid'}>{auditValid ? 'Chain valid' : 'Chain invalid'}</strong>}</> : <p>Managers and administrators can verify the tenant audit chain.</p>}
          </section>
        </div>

        <section className="panel create-panel">
          <div><p className="eyebrow">Required idempotency</p><h2>Create lead</h2><p>Each submission carries a unique request key and is owned by the signed-in user.</p></div>
          <form onSubmit={createLead} className="lead-form">
            <label>First name<input required maxLength="100" value={leadForm.firstName} onChange={(event) => setLeadForm({ ...leadForm, firstName: event.target.value })} /></label>
            <label>Last name<input required maxLength="100" value={leadForm.lastName} onChange={(event) => setLeadForm({ ...leadForm, lastName: event.target.value })} /></label>
            <label>Email<input required type="email" maxLength="254" value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} /></label>
            <label>Company<input required maxLength="200" value={leadForm.company} onChange={(event) => setLeadForm({ ...leadForm, company: event.target.value })} /></label>
            <label>Estimated value<input required type="number" min="0" step="0.01" value={leadForm.estimatedValue} onChange={(event) => setLeadForm({ ...leadForm, estimatedValue: event.target.value })} /></label>
            <label className="wide">Notes<textarea maxLength="2000" value={leadForm.notes} onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })} /></label>
            <button className="primary" disabled={busy}>Create lead</button>
          </form>
        </section>
      </main>
    </div>
  );
}
