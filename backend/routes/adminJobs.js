import { Router } from 'express';
import { checkPassword } from '../utils/auth.js';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { sanitizeJob, publishErrors, serialize } from '../utils/job.js';
import { parseJobText } from '../services/gemini.js';

const r = Router();
export const COLS = ['title','company','category','location','work_mode','employment_type','experience','salary','salary_min','salary_max','openings','education','description','responsibilities','requirements','eligibility','benefits','skills','application_url','application_email','application_instructions','expires_at'];
const JSONCOLS = new Set(['responsibilities', 'requirements', 'benefits', 'skills']);
export const dbVal = (c, v) => (JSONCOLS.has(c) ? JSON.stringify(v ?? []) : v ?? null);
const EXPIRED = "(status='published' AND expires_at IS NOT NULL AND expires_at <= UTC_TIMESTAMP())";

r.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false }), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const [[admin]] = await pool.query('SELECT id,email,password_hash FROM admin_users WHERE email=?', [email]);
  const ok = await checkPassword(password, admin?.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ sub: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h', algorithm: 'HS256' });
  res.json({ token, email: admin.email });
});

r.use(requireAdmin);

r.get('/me', (req, res) => res.json({ ok: true }));

r.get('/stats', async (req, res) => {
  const [[s]] = await pool.query(`SELECT COUNT(*) total,
    COALESCE(SUM(status='published' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())),0) published,
    COALESCE(SUM(status='draft'),0) draft, COALESCE(SUM(status='closed'),0) closed,
    COALESCE(SUM(${EXPIRED}),0) expired FROM jobs`);
  const [ev] = await pool.query('SELECT event_type, COUNT(*) c FROM job_events GROUP BY event_type');
  const e = Object.fromEntries(ev.map((x) => [x.event_type, Number(x.c)]));
  const [[cc]] = await pool.query('SELECT COUNT(*) n FROM candidates');
  const [[ta]] = await pool.query('SELECT COUNT(*) n FROM job_applications');
  const [[pr]] = await pool.query("SELECT COUNT(*) n FROM recruiters WHERE status='pending'");
  const [[oa]] = await pool.query("SELECT COUNT(*) n FROM assistance_requests WHERE status='submitted'");
  const [latest] = await pool.query("SELECT id,title,company,published_at FROM jobs WHERE status='published' ORDER BY published_at DESC LIMIT 5");
  res.json({
    total: Number(s.total), published: Number(s.published), draft: Number(s.draft), closed: Number(s.closed), expired: Number(s.expired),
    candidates: Number(cc.n), pending_recruiters: Number(pr.n), new_assistance_requests: Number(oa.n), tracked_applications: Number(ta.n), views: e.view || 0, apply_clicks: e.apply_click || 0, shares: e.share || 0, latest,
  });
});

r.get('/jobs', async (req, res) => {
  const where = []; const p = [];
  const { status, q } = req.query;
  if (status === 'expired') where.push(EXPIRED);
  else if (['draft', 'published', 'closed'].includes(status)) { where.push('status=?'); p.push(status); }
  if (q) { const l = `%${String(q).slice(0, 100).replace(/[%_\\]/g, '\\$&')}%`; where.push('(title LIKE ? OR company LIKE ?)'); p.push(l, l); }
  const [rows] = await pool.query(`SELECT * FROM jobs ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC LIMIT 200`, p);
  res.json({ jobs: rows.map(serialize) });
});

r.post('/jobs/parse', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (text.length < 30) return res.status(400).json({ error: 'Paste the full job description (at least 30 characters).' });
  if (text.length > 30000) return res.status(400).json({ error: 'Text too long (max 30,000 characters).' });
  try { res.json(await parseJobText(text)); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

r.get('/jobs/:id', async (req, res) => {
  const [[row]] = await pool.query('SELECT * FROM jobs WHERE id=?', [parseInt(req.params.id, 10) || 0]);
  if (!row) return res.status(404).json({ error: 'Job not found' });
  res.json({ job: serialize(row) });
});

// Always creates a DRAFT. Publishing is a separate, explicit action.
r.post('/jobs', async (req, res) => {
  const { value, errors } = sanitizeJob(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  const [out] = await pool.query(`INSERT INTO jobs (${COLS.join(',')},status) VALUES (${COLS.map(() => '?').join(',')},'draft')`, COLS.map((c) => dbVal(c, value[c])));
  const [[row]] = await pool.query('SELECT * FROM jobs WHERE id=?', [out.insertId]);
  res.status(201).json({ job: serialize(row) });
});

r.put('/jobs/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const { value, errors } = sanitizeJob(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  const [[cur]] = await pool.query('SELECT status, recruiter_id FROM jobs WHERE id=?', [id]);
  if (!cur) return res.status(404).json({ error: 'Job not found' });
  if (cur.status === 'published') {
    const pe = publishErrors(value, { internal: !!cur.recruiter_id });
    if (pe.length) return res.status(400).json({ error: 'A published job must stay complete', details: pe });
  }
  await pool.query(`UPDATE jobs SET ${COLS.map((c) => c + '=?').join(',')} WHERE id=?`, [...COLS.map((c) => dbVal(c, value[c])), id]);
  const [[row]] = await pool.query('SELECT * FROM jobs WHERE id=?', [id]);
  res.json({ job: serialize(row) });
});

r.post('/jobs/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const status = req.body?.status;
  if (!['draft', 'published', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const [[row]] = await pool.query('SELECT * FROM jobs WHERE id=?', [id]);
  if (!row) return res.status(404).json({ error: 'Job not found' });
  const job = serialize(row);
  if (status === 'published') {
    const pe = publishErrors(job, { internal: !!job.recruiter_id });
    if (pe.length) return res.status(400).json({ error: 'Cannot publish yet', details: pe });
    if (job.expires_at && new Date(job.expires_at) <= new Date()) return res.status(400).json({ error: 'Expiry date has passed. Edit or clear it before publishing/reopening.' });
  }
  await pool.query("UPDATE jobs SET status=?, published_at = CASE WHEN ?='published' AND published_at IS NULL THEN UTC_TIMESTAMP() ELSE published_at END WHERE id=?", [status, status, id]);
  const [[out]] = await pool.query('SELECT * FROM jobs WHERE id=?', [id]);
  res.json({ job: serialize(out) });
});

r.delete('/jobs/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const [[row]] = await pool.query('SELECT status FROM jobs WHERE id=?', [id]);
  if (!row) return res.status(404).json({ error: 'Job not found' });
  if (row.status === 'published') return res.status(409).json({ error: 'Unpublish or close the job before deleting it.' });
  try { await pool.query('DELETE FROM jobs WHERE id=?', [id]); }
  catch (e) { if (e.errno === 1451) return res.status(409).json({ error: 'This job has candidate applications. Close it instead of deleting.' }); throw e; }
  res.json({ ok: true });
});

export default r;
