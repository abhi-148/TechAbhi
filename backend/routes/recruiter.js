import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { checkPassword } from '../utils/auth.js';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { requireRecruiter, requireApproved } from '../middleware/auth.js';
import { sanitizeJob, publishErrors, serialize, safeUrl, J } from '../utils/job.js';
import { parseJobText } from '../services/gemini.js';
import { COLS, dbVal } from './adminJobs.js';

const r = Router();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads/resumes');
const APP_STATUSES = ['new', 'in_review', 'shortlisted', 'interview', 'rejected', 'hired'];
const txt = (v, m) => { if (v === null || v === undefined) return null; const s = String(v).trim(); return s ? s.slice(0, m) : null; };
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const sign = (id) => jwt.sign({ sub: id, role: 'recruiter' }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
const parseObj = (v) => { if (v && typeof v === 'object') return v; try { return JSON.parse(v) || {}; } catch { return {}; } };

// ---------- public: register / login ----------
r.post('/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), async (req, res) => {
  const b = req.body || {};
  const email = String(b.email || '').trim().toLowerCase(); const name = txt(b.full_name, 150); const company = txt(b.company_name, 255); const pw = String(b.password || '');
  if (!emailOk(email) || email.length > 255) return res.status(400).json({ error: 'Enter a valid work email.' });
  if (!name) return res.status(400).json({ error: 'Enter your full name.' });
  if (!company) return res.status(400).json({ error: 'Enter your company name.' });
  if (pw.length < 8 || pw.length > 72) return res.status(400).json({ error: 'Password must be 8 to 72 characters.' });
  const site = safeUrl(b.company_website);
  if (site === undefined) return res.status(400).json({ error: 'Company website must be a valid http(s) URL.' });
  const [[ex]] = await pool.query('SELECT id FROM recruiters WHERE email=?', [email]);
  if (ex) return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
  const [out] = await pool.query('INSERT INTO recruiters (email,password_hash,full_name,phone,company_name,company_website,company_description) VALUES (?,?,?,?,?,?,?)',
    [email, await bcrypt.hash(pw, 12), name, txt(b.phone, 30), company, site, txt(b.company_description, 3000)]);
  res.status(201).json({ token: sign(out.insertId), status: 'pending' });
});
r.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false }), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const [[x]] = await pool.query('SELECT id,password_hash,status FROM recruiters WHERE email=?', [email]);
  if (!(await checkPassword(req.body?.password, x?.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(x.id), status: x.status });
});

r.use(requireRecruiter);

// any status (so pending / rejected recruiters can see why they are blocked)
r.get('/me', (req, res) => res.json({ recruiter: req.recruiter }));
r.put('/profile', async (req, res) => {          // company NAME and email are admin-controlled; they change only via support
  const site = safeUrl(req.body?.company_website);
  if (site === undefined) return res.status(400).json({ error: 'Company website must be a valid http(s) URL.' });
  await pool.query('UPDATE recruiters SET phone=?, company_website=?, company_description=?, full_name=COALESCE(?,full_name) WHERE id=?', [txt(req.body?.phone, 30), site, txt(req.body?.company_description, 3000), txt(req.body?.full_name, 150), req.recruiter.id]);
  res.json({ ok: true });
});

// ---------- everything below needs an APPROVED recruiter, and is scoped to THEIR OWN jobs ----------
r.use(requireApproved);
const own = async (jobId, recId) => { const [[row]] = await pool.query('SELECT * FROM jobs WHERE id=? AND recruiter_id=?', [parseInt(jobId, 10) || 0, recId]); return row ? serialize(row) : null; };  // other people's jobs look like 404

r.get('/jobs', async (req, res) => {
  const [rows] = await pool.query("SELECT j.*, (SELECT COUNT(*) FROM job_submissions s WHERE s.job_id=j.id AND s.status<>'withdrawn') app_count FROM jobs j WHERE j.recruiter_id=? ORDER BY j.updated_at DESC LIMIT 200", [req.recruiter.id]);
  res.json({ jobs: rows.map(serialize) });
});
r.post('/jobs/parse', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (text.length < 30) return res.status(400).json({ error: 'Paste the full job description (at least 30 characters).' });
  if (text.length > 30000) return res.status(400).json({ error: 'Text too long (max 30,000 characters).' });
  try { res.json(await parseJobText(text)); } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
r.get('/jobs/:id', async (req, res) => { const j = await own(req.params.id, req.recruiter.id); if (!j) return res.status(404).json({ error: 'Job not found' }); res.json({ job: j }); });
r.post('/jobs', async (req, res) => {
  const { value, errors } = sanitizeJob(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  value.company = req.recruiter.company_name;      // a recruiter cannot post under another company's name
  const [out] = await pool.query(`INSERT INTO jobs (${COLS.join(',')},status,recruiter_id) VALUES (${COLS.map(() => '?').join(',')},'draft',?)`, [...COLS.map((c) => dbVal(c, value[c])), req.recruiter.id]);
  res.status(201).json({ job: await own(out.insertId, req.recruiter.id) });
});
r.put('/jobs/:id', async (req, res) => {
  const cur = await own(req.params.id, req.recruiter.id);
  if (!cur) return res.status(404).json({ error: 'Job not found' });
  const { value, errors } = sanitizeJob(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  value.company = req.recruiter.company_name;
  if (cur.status === 'published') { const pe = publishErrors(value, { internal: true }); if (pe.length) return res.status(400).json({ error: 'A published job must stay complete', details: pe }); }
  await pool.query(`UPDATE jobs SET ${COLS.map((c) => c + '=?').join(',')} WHERE id=? AND recruiter_id=?`, [...COLS.map((c) => dbVal(c, value[c])), cur.id, req.recruiter.id]);
  res.json({ job: await own(cur.id, req.recruiter.id) });
});
r.post('/jobs/:id/status', async (req, res) => {
  const job = await own(req.params.id, req.recruiter.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const status = req.body?.status;
  if (!['draft', 'published', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (status === 'published') {
    const pe = publishErrors(job, { internal: true });
    if (pe.length) return res.status(400).json({ error: 'Cannot publish yet', details: pe });
    if (job.expires_at && new Date(job.expires_at) <= new Date()) return res.status(400).json({ error: 'Expiry date has passed. Edit or clear it before publishing/reopening.' });
  }
  await pool.query("UPDATE jobs SET status=?, published_at = CASE WHEN ?='published' AND published_at IS NULL THEN UTC_TIMESTAMP() ELSE published_at END WHERE id=? AND recruiter_id=?", [status, status, job.id, req.recruiter.id]);
  res.json({ job: await own(job.id, req.recruiter.id) });
});
r.delete('/jobs/:id', async (req, res) => {
  const job = await own(req.params.id, req.recruiter.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status === 'published') return res.status(409).json({ error: 'Unpublish or close the job before deleting it.' });
  const [[n]] = await pool.query('SELECT COUNT(*) n FROM job_submissions WHERE job_id=?', [job.id]);
  if (n.n > 0) return res.status(409).json({ error: 'This job has applications. Close it instead of deleting.' });
  await pool.query('DELETE FROM jobs WHERE id=? AND recruiter_id=?', [job.id, req.recruiter.id]);
  res.json({ ok: true });
});

// ---------- applications (only ones candidates deliberately submitted to THIS recruiter's jobs) ----------
r.get('/applications', async (req, res) => {
  const where = ['j.recruiter_id=?']; const p = [req.recruiter.id];
  if (req.query.job_id) { where.push('s.job_id=?'); p.push(parseInt(req.query.job_id, 10) || 0); }
  if ([...APP_STATUSES, 'withdrawn'].includes(req.query.status)) { where.push('s.status=?'); p.push(req.query.status); }
  const [rows] = await pool.query(`SELECT s.id,s.job_id,j.title job_title,s.candidate_name,s.status,s.submitted_at,s.viewed_at,(s.resume_text IS NOT NULL) has_resume FROM job_submissions s JOIN jobs j ON j.id=s.job_id WHERE ${where.join(' AND ')} ORDER BY s.submitted_at DESC LIMIT 200`, p);
  res.json({ applications: rows.map((x) => ({ ...x, has_resume: !!x.has_resume })) });
});
async function ownSub(id, recId) {
  const [[s]] = await pool.query('SELECT s.*, j.title job_title FROM job_submissions s JOIN jobs j ON j.id=s.job_id WHERE s.id=? AND j.recruiter_id=?', [parseInt(id, 10) || 0, recId]);
  return s || null;
}
r.get('/applications/:id', async (req, res) => {
  const s = await ownSub(req.params.id, req.recruiter.id);
  if (!s) return res.status(404).json({ error: 'Application not found' });
  if (s.status !== 'withdrawn' && !s.viewed_at) { await pool.query('UPDATE job_submissions SET viewed_at=UTC_TIMESTAMP() WHERE id=?', [s.id]); s.viewed_at = new Date(); }
  const p = parseObj(s.profile_json);
  res.json({ application: { id: s.id, job_id: s.job_id, job_title: s.job_title, status: s.status, submitted_at: s.submitted_at, viewed_at: s.viewed_at, candidate_name: s.candidate_name,
    candidate_email: s.candidate_email || null, cover_note: s.cover_note, recruiter_note: s.recruiter_note, resume_text: s.resume_text, has_resume_file: !!s.resume_file,
    profile: s.status === 'withdrawn' ? null : { ...p, skills: J(p.skills), education: J(p.education), experience: J(p.experience), projects: J(p.projects) } } });
});
r.put('/applications/:id', async (req, res) => {
  const s = await ownSub(req.params.id, req.recruiter.id);
  if (!s) return res.status(404).json({ error: 'Application not found' });
  if (s.status === 'withdrawn') return res.status(409).json({ error: 'The candidate withdrew this application.' });
  const status = req.body?.status ?? s.status;
  if (!APP_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const note = req.body?.recruiter_note !== undefined ? txt(req.body.recruiter_note, 2000) : s.recruiter_note;
  await pool.query('UPDATE job_submissions SET status=?, recruiter_note=? WHERE id=?', [status, note, s.id]);
  res.json({ ok: true });
});
r.get('/applications/:id/resume', async (req, res) => {
  const s = await ownSub(req.params.id, req.recruiter.id);
  if (!s || !s.resume_file || !/^[a-f0-9]{32}\.pdf$/.test(s.resume_file)) return res.status(404).json({ error: 'No resume file shared' });
  res.download(path.join(UPLOAD_DIR, s.resume_file), s.resume_file_name || 'resume.pdf');
});

// ---------- dashboard (real counts only) ----------
r.get('/dashboard', async (req, res) => {
  const id = req.recruiter.id; const count = (rows, k) => Object.fromEntries(rows.map((x) => [x[k], Number(x.n)]));
  const [jobs] = await pool.query('SELECT status, COUNT(*) n FROM jobs WHERE recruiter_id=? GROUP BY status', [id]);
  const [apps] = await pool.query('SELECT s.status, COUNT(*) n FROM job_submissions s JOIN jobs j ON j.id=s.job_id WHERE j.recruiter_id=? GROUP BY s.status', [id]);
  const [ev] = await pool.query('SELECT e.event_type, COUNT(*) n FROM job_events e JOIN jobs j ON j.id=e.job_id WHERE j.recruiter_id=? GROUP BY e.event_type', [id]);
  const [recent] = await pool.query("SELECT s.id,s.candidate_name,s.status,s.submitted_at,j.title job_title FROM job_submissions s JOIN jobs j ON j.id=s.job_id WHERE j.recruiter_id=? AND s.status<>'withdrawn' ORDER BY s.submitted_at DESC LIMIT 5", [id]);
  res.json({ jobs: count(jobs, 'status'), applications: count(apps, 'status'), events: count(ev, 'event_type'), recent });
});

export default r;
