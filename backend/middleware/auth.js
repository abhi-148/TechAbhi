import jwt from 'jsonwebtoken';
export function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (p.role !== 'admin') throw new Error('role');
    req.admin = p;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireCandidate(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (p.role !== 'candidate') throw new Error('role');
    req.user = { id: p.sub };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

import { pool } from '../db.js';
// Recruiter identity comes ONLY from the verified token; status is re-read from the DB on every request,
// so an admin suspending someone takes effect immediately.
export async function requireRecruiter(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in' });
  let p;
  try { p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); if (p.role !== 'recruiter') throw new Error('role'); }
  catch { return res.status(401).json({ error: 'Session expired. Please log in again.' }); }
  const [[rec]] = await pool.query('SELECT id,email,full_name,phone,company_name,company_website,company_description,status,status_reason FROM recruiters WHERE id=?', [p.sub]);
  if (!rec) return res.status(401).json({ error: 'Account not found' });
  req.recruiter = rec;
  next();
}
export function requireApproved(req, res, next) {
  if (req.recruiter.status !== 'approved') return res.status(403).json({ error: `Your recruiter account is ${req.recruiter.status}.`, status: req.recruiter.status });
  next();
}
