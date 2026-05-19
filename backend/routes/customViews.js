// customViews.js — Dynamics 365 sync activity, entity sync heatmap,
// sync report PDF, and mapping rules CRUD.
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

async function ensure() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS dyn_sync_activity (
      id SERIAL PRIMARY KEY,
      entity TEXT NOT NULL,
      direction TEXT DEFAULT 'inbound',
      records_synced INTEGER DEFAULT 0,
      conflicts INTEGER DEFAULT 0,
      status TEXT DEFAULT 'success',
      duration_ms INTEGER DEFAULT 0,
      synced_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS dyn_mapping_rules (
      id SERIAL PRIMARY KEY,
      source_entity TEXT NOT NULL,
      target_entity TEXT NOT NULL,
      source_field TEXT NOT NULL,
      target_field TEXT NOT NULL,
      transform TEXT DEFAULT 'copy',
      is_active BOOLEAN DEFAULT true,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    const cnt = await pool.query('SELECT COUNT(*)::int AS c FROM dyn_sync_activity');
    if (cnt.rows[0].c === 0) {
      const entities = ['contacts', 'accounts', 'leads', 'opportunities', 'cases', 'invoices', 'products'];
      const dirs = ['inbound', 'outbound'];
      const statuses = ['success', 'success', 'success', 'partial', 'failed'];
      const rows = [];
      const now = Date.now();
      for (let d = 0; d < 14; d++) {
        for (let h = 0; h < 24; h += 3) {
          const e = entities[(d + h) % entities.length];
          const dir = dirs[(d + h) % 2];
          const st = statuses[(d * 3 + h) % statuses.length];
          const ts = new Date(now - d * 86400000 + h * 3600000).toISOString();
          rows.push({ e, dir, recs: 5 + ((d * h) % 50), conf: (d + h) % 4, st, dur: 200 + ((d * h * 17) % 1800), ts });
        }
      }
      for (const r of rows) {
        await pool.query(
          `INSERT INTO dyn_sync_activity (entity, direction, records_synced, conflicts, status, duration_ms, synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [r.e, r.dir, r.recs, r.conf, r.st, r.dur, r.ts]
        );
      }
    }

    const mcnt = await pool.query('SELECT COUNT(*)::int AS c FROM dyn_mapping_rules');
    if (mcnt.rows[0].c === 0) {
      const seeds = [
        ['contacts', 'salesforce_contact', 'email', 'Email', 'lowercase', 'Sync email lowercased'],
        ['accounts', 'salesforce_account', 'name', 'Name', 'copy', 'Account name passthrough'],
        ['leads', 'hubspot_lead', 'company', 'company_name', 'copy', 'Map lead company'],
        ['opportunities', 'salesforce_opp', 'amount', 'Amount', 'to_number', 'Cast to numeric'],
        ['cases', 'zendesk_ticket', 'title', 'subject', 'copy', 'Case title to ticket subject'],
        ['invoices', 'quickbooks_invoice', 'total', 'TotalAmt', 'copy', 'Invoice total passthrough'],
      ];
      for (const s of seeds) {
        await pool.query(
          `INSERT INTO dyn_mapping_rules (source_entity, target_entity, source_field, target_field, transform, notes)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          s
        );
      }
    }
  } catch (e) {
    console.warn('[customViews] ensure:', e.message);
  }
}
ensure();

// VIZ 1: GET /sync-activity — time-series of synced records (last 14 days, daily buckets)
router.get('/sync-activity', auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        TO_CHAR(date_trunc('day', synced_at), 'YYYY-MM-DD') AS day,
        SUM(records_synced)::int AS records,
        SUM(conflicts)::int AS conflicts,
        COUNT(*)::int AS runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::int AS failures
      FROM dyn_sync_activity
      WHERE synced_at >= NOW() - INTERVAL '14 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `);
    const totalRecords = r.rows.reduce((a, x) => a + (x.records || 0), 0);
    const totalConflicts = r.rows.reduce((a, x) => a + (x.conflicts || 0), 0);
    res.json({ series: r.rows, totals: { records: totalRecords, conflicts: totalConflicts, days: r.rows.length } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// VIZ 2: GET /entity-heatmap — entity x hour-of-day heatmap of sync volume
router.get('/entity-heatmap', auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        entity,
        EXTRACT(HOUR FROM synced_at)::int AS hour,
        SUM(records_synced)::int AS volume
      FROM dyn_sync_activity
      WHERE synced_at >= NOW() - INTERVAL '14 days'
      GROUP BY entity, hour
      ORDER BY entity ASC, hour ASC
    `);
    const entities = [...new Set(r.rows.map(x => x.entity))].sort();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const matrix = entities.map(e => ({
      entity: e,
      cells: hours.map(h => {
        const row = r.rows.find(x => x.entity === e && x.hour === h);
        return { hour: h, volume: row ? row.volume : 0 };
      }),
    }));
    const max = Math.max(1, ...r.rows.map(x => x.volume || 0));
    res.json({ entities, hours, matrix, max });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// NON-VIZ 1: GET /sync-report.pdf — produce a printable PDF-style sync report
router.get('/sync-report.pdf', auth, async (req, res) => {
  try {
    const summary = await pool.query(`
      SELECT
        COUNT(*)::int AS total_runs,
        SUM(records_synced)::int AS total_records,
        SUM(conflicts)::int AS total_conflicts,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::int AS failures,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END)::int AS partials,
        AVG(duration_ms)::int AS avg_duration_ms
      FROM dyn_sync_activity
      WHERE synced_at >= NOW() - INTERVAL '14 days'
    `);
    const perEntity = await pool.query(`
      SELECT entity,
             COUNT(*)::int AS runs,
             SUM(records_synced)::int AS records,
             SUM(conflicts)::int AS conflicts,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::int AS failures
      FROM dyn_sync_activity
      WHERE synced_at >= NOW() - INTERVAL '14 days'
      GROUP BY entity
      ORDER BY records DESC NULLS LAST
    `);
    const recent = await pool.query(`
      SELECT id, entity, direction, records_synced, conflicts, status, duration_ms, synced_at
      FROM dyn_sync_activity
      ORDER BY synced_at DESC
      LIMIT 25
    `);

    const s = summary.rows[0] || {};
    const generatedAt = new Date().toISOString();

    // Minimal valid PDF (single page, Helvetica text). Content streams are
    // hand-built so we keep zero extra dependencies.
    const esc = (str) => String(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const lines = [];
    lines.push('Microsoft Dynamics 365 — Sync Activity Report');
    lines.push(`Generated: ${generatedAt}`);
    lines.push('');
    lines.push('Summary (last 14 days):');
    lines.push(`  Total runs:        ${s.total_runs || 0}`);
    lines.push(`  Records synced:    ${s.total_records || 0}`);
    lines.push(`  Conflicts:         ${s.total_conflicts || 0}`);
    lines.push(`  Failed runs:       ${s.failures || 0}`);
    lines.push(`  Partial runs:      ${s.partials || 0}`);
    lines.push(`  Avg duration (ms): ${s.avg_duration_ms || 0}`);
    lines.push('');
    lines.push('Per-entity breakdown:');
    for (const r of perEntity.rows) {
      lines.push(`  ${r.entity.padEnd(18)} runs=${String(r.runs).padStart(3)}  recs=${String(r.records).padStart(5)}  conf=${String(r.conflicts).padStart(3)}  fail=${String(r.failures).padStart(2)}`);
    }
    lines.push('');
    lines.push('Most recent sync runs:');
    for (const r of recent.rows.slice(0, 18)) {
      const ts = new Date(r.synced_at).toISOString().replace('T', ' ').slice(0, 19);
      lines.push(`  ${ts}  ${r.entity.padEnd(14)} ${r.direction.padEnd(8)} ${String(r.records_synced).padStart(4)} recs  ${r.status}`);
    }

    let y = 760;
    let stream = 'BT\n/F1 14 Tf\n';
    stream += `1 0 0 1 50 ${y} Tm\n(${esc(lines[0])}) Tj\n`;
    stream += '/F1 10 Tf\n';
    for (let i = 1; i < lines.length; i++) {
      y -= 14;
      if (y < 50) break;
      stream += `1 0 0 1 50 ${y} Tm\n(${esc(lines[i])}) Tj\n`;
    }
    stream += 'ET\n';

    const objs = [];
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
    objs.push(`<< /Length ${Buffer.byteLength(stream, 'binary')} >>\nstream\n${stream}\nendstream`);
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    for (let i = 0; i < objs.length; i++) {
      offsets.push(Buffer.byteLength(pdf, 'binary'));
      pdf += `${i + 1} 0 obj\n${objs[i]}\nendobj\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="dynamics-sync-report.pdf"');
    res.send(Buffer.from(pdf, 'binary'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// NON-VIZ 2: mapping rules CRUD
router.get('/mapping-rules', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM dyn_mapping_rules ORDER BY id DESC');
    res.json({ rules: r.rows, total: r.rows.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/mapping-rules', auth, async (req, res) => {
  try {
    const { source_entity, target_entity, source_field, target_field, transform, is_active, notes } = req.body || {};
    if (!source_entity || !target_entity || !source_field || !target_field) {
      return res.status(400).json({ error: 'source_entity, target_entity, source_field, target_field are required' });
    }
    const r = await pool.query(
      `INSERT INTO dyn_mapping_rules (source_entity, target_entity, source_field, target_field, transform, is_active, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [source_entity, target_entity, source_field, target_field, transform || 'copy', is_active !== false, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/mapping-rules/:id', auth, async (req, res) => {
  try {
    const { source_entity, target_entity, source_field, target_field, transform, is_active, notes } = req.body || {};
    const r = await pool.query(
      `UPDATE dyn_mapping_rules SET
         source_entity = COALESCE($1, source_entity),
         target_entity = COALESCE($2, target_entity),
         source_field  = COALESCE($3, source_field),
         target_field  = COALESCE($4, target_field),
         transform     = COALESCE($5, transform),
         is_active     = COALESCE($6, is_active),
         notes         = COALESCE($7, notes),
         updated_at    = NOW()
       WHERE id = $8 RETURNING *`,
      [source_entity || null, target_entity || null, source_field || null, target_field || null,
       transform || null, typeof is_active === 'boolean' ? is_active : null, notes || null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/mapping-rules/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM dyn_mapping_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true, id: r.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
