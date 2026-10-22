import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { serialize } from '../utils/job.js';

const r = Router();
export const LIVE = "status='published' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())";
const COLS = 'id,title,company,category,location,work_mode,employment_type,experience,salary,salary_min,salary_max,openings,skills,published_at,expires_at';
const esc = (s) => String(s).slice(0, 100).replace(/[%_\\]/g, '\\$&');

r.get('/meta', async (req, res) => {
  const [cats] = await pool.query(`SELECT category name, COUNT(*) n FROM jobs WHERE ${LIVE} AND category IS NOT NULL GROUP BY category ORDER BY n DESC LIMIT 12`);
  const [locs] = await pool.query(`SELECT location name, COUNT(*) n FROM jobs WHERE ${LIVE} AND location IS NOT NULL GROUP BY location ORDER BY n DESC LIMIT 12`);
  res.json({ categories: cats, locations: locs });
});

r.get('/', async (req, res) => {
  const { q, location, employment_type, work_mode, category, experience, fresher, min_salary, sort } = req.query;
  const where = [LIVE]; const p = [];
  if (q) { const l = `%${esc(q)}%`; where.push('(title LIKE ? OR company LIKE ? OR CAST(skills AS CHAR) LIKE ?)'); p.push(l, l, l); }
  if (location) { where.push('location LIKE ?'); p.push(`%${esc(location)}%`); }
  if (employment_type) { where.push('employment_type=?'); p.push(String(employment_type)); }
  if (work_mode) { where.push('work_mode=?'); p.push(String(work_mode)); }
  if (category) { where.push('category=?'); p.push(String(category)); }
  if (experience) { where.push('experience LIKE ?'); p.push(`%${esc(experience)}%`); }
  if (fresher === '1') where.push("(experience IS NULL OR experience LIKE '%fresher%' OR experience LIKE '%0-1%' OR experience LIKE '%0 year%' OR experience LIKE '%no experience%')");
  if (parseInt(min_salary, 10) > 0) { where.push('salary_max >= ?'); p.push(parseInt(min_salary, 10)); }
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const order = sort === 'salary' ? 'salary_max IS NULL, salary_max DESC, published_at DESC' : 'published_at DESC, id DESC';
  const w = where.join(' AND ');
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM jobs WHERE ${w}`, p);
  const [rows] = await pool.query(`SELECT ${COLS} FROM jobs WHERE ${w} ORDER BY ${order} LIMIT ? OFFSET ?`, [...p, limit, (page - 1) * limit]);
  res.json({ jobs: rows.map(serialize), total: Number(total), page, pages: Math.max(Math.ceil(total / limit), 1) });
});

export async function getPublicJob(id) {
  const [[row]] = await pool.query('SELECT * FROM jobs WHERE id=?', [id]);
  if (!row || row.status === 'draft') return { state: 'missing' };            // drafts are never revealed
  const expired = row.expires_at && new Date(row.expires_at) <= new Date();
  if (row.status === 'closed' || expired) return { state: 'closed' };
  return { state: 'ok', job: serialize(row) };
}

r.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(404).json({ error: 'Job not found' });
  const { state, job } = await getPublicJob(id);
  if (state === 'missing') return res.status(404).json({ error: 'Job not found' });
  if (state === 'closed') return res.status(410).json({ error: 'This job is no longer accepting applications.' });
  job.accepts_applications = job.recruiter_id != null;   // never expose the recruiter's id
  delete job.recruiter_id;
  const [related] = await pool.query(`SELECT ${COLS} FROM jobs WHERE ${LIVE} AND id<>? AND (category <=> ? OR employment_type <=> ?) ORDER BY published_at DESC LIMIT 4`, [id, job.category, job.employment_type]);
  res.json({ job, related: related.map(serialize) });
});

r.post('/:id/event', rateLimit({ windowMs: 60 * 1000, max: 60 }), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const type = req.body?.type;
  if (!['view', 'apply_click', 'share'].includes(type)) return res.status(400).json({ error: 'Invalid event' });
  const { state } = await getPublicJob(id);
  if (state === 'ok') await pool.query('INSERT INTO job_events (job_id,event_type) VALUES (?,?)', [id, type]);
  res.json({ ok: true });
});

export default r;
