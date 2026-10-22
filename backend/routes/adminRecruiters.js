import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const r = Router();
r.use(requireAdmin);

r.get('/recruiters', async (req, res) => {
  const st = req.query.status;
  const where = ['pending', 'approved', 'rejected', 'suspended'].includes(st) ? 'WHERE r.status=?' : '';
  const [rows] = await pool.query(`SELECT r.id,r.email,r.full_name,r.phone,r.company_name,r.company_website,r.company_description,r.status,r.status_reason,r.created_at,
    (SELECT COUNT(*) FROM jobs j WHERE j.recruiter_id=r.id) job_count FROM recruiters r ${where} ORDER BY r.created_at DESC LIMIT 200`, where ? [st] : []);
  res.json({ recruiters: rows });
});

// Approve / reject / suspend. Rejecting or suspending also closes that recruiter's live jobs.
r.post('/recruiters/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0; const status = req.body?.status;
  const reason = String(req.body?.reason || '').trim().slice(0, 500) || null;
  if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if ((status === 'rejected' || status === 'suspended') && !reason) return res.status(400).json({ error: 'Give a short reason. The recruiter will see it.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[rec]] = await conn.query('SELECT id FROM recruiters WHERE id=? FOR UPDATE', [id]);
    if (!rec) { await conn.rollback(); return res.status(404).json({ error: 'Recruiter not found' }); }
    await conn.query('UPDATE recruiters SET status=?, status_reason=?, approved_at = CASE WHEN ?=\'approved\' THEN UTC_TIMESTAMP() ELSE approved_at END WHERE id=?', [status, status === 'approved' ? null : reason, status, id]);
    let closed = 0;
    if (status === 'rejected' || status === 'suspended') { const [o] = await conn.query("UPDATE jobs SET status='closed' WHERE recruiter_id=? AND status='published'", [id]); closed = o.affectedRows; }
    await conn.commit();
    res.json({ ok: true, jobs_closed: closed });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
});

export default r;
