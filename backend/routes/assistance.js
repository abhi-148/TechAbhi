import { Router } from 'express';
import path from 'path';
import { pool } from '../db.js';
import { J } from '../utils/job.js';
import { getProfile, getResume } from './candidate.js';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads/resumes');
const txt = (v, m) => { if (v === null || v === undefined) return null; const s = String(v).trim(); return s ? s.slice(0, m) : null; };
const SHARE_FIELDS = ['email', 'profile', 'resume'];                 // the candidate's name is always included
const NEXT = { proposed: ['closed'], candidate_approved: ['shared', 'closed'], shared: ['response_received', 'no_response', 'closed'], response_received: ['interview_scheduled', 'no_response', 'closed'], interview_scheduled: ['interview_scheduled', 'closed'], candidate_declined: [], no_response: ['closed'], closed: [] };
const fmt = (d) => new Date(d).toISOString().slice(0, 10);
const addUpdate = (reqId, message, author = 'system') => pool.query('INSERT INTO assistance_updates (request_id,author,message) VALUES (?,?,?)', [reqId, author, message.slice(0, 1000)]);
const isOpen = (r) => r && r.status !== 'closed';

// =====================================================================================
// CANDIDATE SIDE  (mounted behind requireCandidate)  /api/candidate/assistance
// =====================================================================================
export const candidateRouter = Router();

async function candidateView(candidateId) {
  const [[rq]] = await pool.query('SELECT * FROM assistance_requests WHERE candidate_id=? ORDER BY id DESC LIMIT 1', [candidateId]);
  if (!rq) return { request: null, can_request: true };
  const [updates] = await pool.query('SELECT author,message,created_at FROM assistance_updates WHERE request_id=? ORDER BY id DESC', [rq.id]);
  const [out] = await pool.query('SELECT o.id,o.company_name,o.message,o.shared_fields,o.status,o.candidate_decision_at,o.shared_at,o.interview_at,o.interview_info,o.updated_at,j.title job_title FROM assistance_outreach o LEFT JOIN jobs j ON j.id=o.job_id WHERE o.request_id=? ORDER BY o.id DESC', [rq.id]);
  return {
    can_request: rq.status === 'closed',
    request: { id: rq.id, status: rq.status, target_roles: rq.target_roles, preferred_locations: rq.preferred_locations, availability: rq.availability, challenges: rq.challenges,
      closed_reason: rq.closed_reason, first_viewed_at: rq.first_viewed_at, created_at: rq.created_at, updates,
      outreach: out.map((o) => ({ ...o, shared_fields: J(o.shared_fields) })) },    // never includes hr_contact or admin notes
  };
}
candidateRouter.get('/', async (req, res) => res.json(await candidateView(req.user.id)));

candidateRouter.post('/', async (req, res) => {
  const b = req.body || {};
  if (b.consent_review !== true) return res.status(400).json({ error: 'Please confirm you agree to let the TechAbhi team read your profile and resume to review your request.' });
  const roles = txt(b.target_roles, 500);
  if (!roles) return res.status(400).json({ error: 'Tell us what kind of roles you are looking for.' });
  const profile = await getProfile(req.user.id); const resume = await getResume(req.user.id);
  if (!resume && !profile.skills.length) return res.status(400).json({ error: 'Add a resume or a few skills to your profile first, so the team has something to review.' });
  try {
    await pool.query('INSERT INTO assistance_requests (candidate_id,target_roles,preferred_locations,availability,challenges,consent_review_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP())',
      [req.user.id, roles, txt(b.preferred_locations, 300), txt(b.availability, 300), txt(b.challenges, 2000)]);
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'You already have an open request.' }); throw e; }
  const v = await candidateView(req.user.id);
  await addUpdate(v.request.id, 'Request received. The TechAbhi team will review it. This does not guarantee a job or an interview.');
  res.status(201).json(await candidateView(req.user.id));
});

// Withdraw: closes the request, cancels anything not yet shared, wipes the free-text details.
candidateRouter.post('/withdraw', async (req, res) => {
  const [[rq]] = await pool.query("SELECT id FROM assistance_requests WHERE candidate_id=? AND status<>'closed'", [req.user.id]);
  if (!rq) return res.status(404).json({ error: 'No open request' });
  await pool.query("UPDATE assistance_requests SET status='closed', closed_reason='Withdrawn by you', target_roles=NULL, preferred_locations=NULL, availability=NULL, challenges=NULL, admin_note=NULL WHERE id=?", [rq.id]);
  await pool.query("UPDATE assistance_outreach SET status='closed', admin_note=NULL WHERE request_id=? AND status IN ('proposed','candidate_approved')", [rq.id]);
  await addUpdate(rq.id, 'You withdrew this request. Nothing further will be shared.');
  res.json({ ok: true });
});

// Approve / decline / revoke ONE specific outreach. Only the candidate who owns it can.
async function ownOutreach(id, candidateId) {
  const [[o]] = await pool.query('SELECT o.*, r.status request_status FROM assistance_outreach o JOIN assistance_requests r ON r.id=o.request_id WHERE o.id=? AND r.candidate_id=?', [parseInt(id, 10) || 0, candidateId]);
  return o || null;
}
candidateRouter.post('/outreach/:id/decision', async (req, res) => {
  const o = await ownOutreach(req.params.id, req.user.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.request_status === 'closed') return res.status(409).json({ error: 'This request is closed.' });
  const d = req.body?.decision;
  let to;
  if (d === 'approve' && o.status === 'proposed') to = 'candidate_approved';
  else if (d === 'decline' && o.status === 'proposed') to = 'candidate_declined';
  else if (d === 'revoke' && o.status === 'candidate_approved') to = 'candidate_declined';   // allowed only until it has actually been shared
  else return res.status(409).json({ error: o.status === 'shared' || ['response_received', 'interview_scheduled', 'no_response'].includes(o.status) ? 'Your details were already shared, so this can no longer be changed here.' : 'That action is not available.' });
  await pool.query('UPDATE assistance_outreach SET status=?, candidate_decision_at=UTC_TIMESTAMP() WHERE id=?', [to, o.id]);
  await addUpdate(o.request_id, to === 'candidate_approved' ? `You approved sharing with ${o.company_name}. The team has not shared anything yet.` : `You declined sharing with ${o.company_name}. Nothing was shared.`);
  res.json(await candidateView(req.user.id));
});

// =====================================================================================
// ADMIN SIDE  (mounted behind requireAdmin)  /api/admin/assistance
// =====================================================================================
export const adminRouter = Router();

adminRouter.get('/', async (req, res) => {
  const st = req.query.status;
  const where = ['submitted', 'in_review', 'in_progress', 'on_hold', 'closed'].includes(st) ? 'WHERE r.status=?' : '';
  const [rows] = await pool.query(`SELECT r.id,r.status,r.created_at,r.first_viewed_at,r.target_roles,c.full_name,
    (SELECT COUNT(*) FROM assistance_outreach o WHERE o.request_id=r.id) outreach_count FROM assistance_requests r JOIN candidates c ON c.id=r.candidate_id ${where} ORDER BY r.created_at DESC LIMIT 200`, where ? [st] : []);
  res.json({ requests: rows.map((x) => ({ ...x, target_roles: x.status === 'closed' ? null : x.target_roles })) });
});

async function loadRequest(id) { const [[r]] = await pool.query('SELECT r.*, c.full_name, c.email FROM assistance_requests r JOIN candidates c ON c.id=r.candidate_id WHERE r.id=?', [parseInt(id, 10) || 0]); return r || null; }
const log = (reqId, adminId, action) => pool.query('INSERT INTO assistance_access_log (request_id,admin_id,action) VALUES (?,?,?)', [reqId, adminId, action]);

adminRouter.get('/:id(\\d+)', async (req, res) => {
  const r = await loadRequest(req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  const open = isOpen(r);
  let profile = null, resume = null;
  if (open) {                                  // personal data is only readable while the request is open (consent covers review)
    if (!r.first_viewed_at) await pool.query('UPDATE assistance_requests SET first_viewed_at=UTC_TIMESTAMP() WHERE id=?', [r.id]);
    await log(r.id, req.admin.sub, 'view');
    profile = await getProfile(r.candidate_id);
    const rs = await getResume(r.candidate_id);
    resume = rs ? { text: rs.resume_text, has_file: !!rs.stored_name, file_name: rs.file_name } : null;
  }
  const [updates] = await pool.query('SELECT author,message,created_at FROM assistance_updates WHERE request_id=? ORDER BY id DESC', [r.id]);
  const [out] = await pool.query('SELECT o.*, j.title job_title FROM assistance_outreach o LEFT JOIN jobs j ON j.id=o.job_id WHERE o.request_id=? ORDER BY o.id DESC', [r.id]);
  res.json({ request: { id: r.id, status: r.status, target_roles: open ? r.target_roles : null, preferred_locations: open ? r.preferred_locations : null, availability: open ? r.availability : null, challenges: open ? r.challenges : null, closed_reason: r.closed_reason, admin_note: r.admin_note, created_at: r.created_at, first_viewed_at: r.first_viewed_at },
    candidate: open ? { name: r.full_name, email: r.email } : { name: r.full_name }, profile, resume, updates, outreach: out.map((o) => ({ ...o, shared_fields: J(o.shared_fields) })) });
});

adminRouter.put('/:id(\\d+)/status', async (req, res) => {
  const r = await loadRequest(req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.status === 'closed') return res.status(409).json({ error: 'This request is closed.' });
  const st = req.body?.status;
  if (!['in_review', 'in_progress', 'on_hold', 'closed'].includes(st)) return res.status(400).json({ error: 'Invalid status' });
  if (st === 'closed') {
    const reason = txt(req.body?.reason, 300);
    if (!reason) return res.status(400).json({ error: 'Give a short reason. The candidate will see it.' });
    await pool.query("UPDATE assistance_requests SET status='closed', closed_reason=? WHERE id=?", [reason, r.id]);
    await pool.query("UPDATE assistance_outreach SET status='closed' WHERE request_id=? AND status IN ('proposed','candidate_approved')", [r.id]);
    await addUpdate(r.id, `Your request was closed: ${reason}`);
  } else {
    await pool.query('UPDATE assistance_requests SET status=? WHERE id=?', [st, r.id]);
    await addUpdate(r.id, { in_review: 'The team is reviewing your request.', in_progress: 'The team is now looking for suitable opportunities. This is not a promise of a job or interview.', on_hold: 'Your request is on hold for now.' }[st]);
  }
  res.json({ ok: true });
});

adminRouter.put('/:id(\\d+)/note', async (req, res) => {
  const r = await loadRequest(req.params.id); if (!r) return res.status(404).json({ error: 'Request not found' });
  await pool.query('UPDATE assistance_requests SET admin_note=? WHERE id=?', [txt(req.body?.admin_note, 5000), r.id]);
  res.json({ ok: true });
});

adminRouter.post('/:id(\\d+)/updates', async (req, res) => {
  const r = await loadRequest(req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (!isOpen(r)) return res.status(409).json({ error: 'This request is closed.' });
  const m = txt(req.body?.message, 1000);
  if (!m) return res.status(400).json({ error: 'Write a message.' });
  await addUpdate(r.id, m, 'team');
  res.status(201).json({ ok: true });
});

adminRouter.get('/:id(\\d+)/resume', async (req, res) => {
  const r = await loadRequest(req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (!isOpen(r)) return res.status(409).json({ error: 'This request is closed.' });
  const rs = await getResume(r.candidate_id);
  if (!rs?.stored_name || !/^[a-f0-9]{32}\.pdf$/.test(rs.stored_name)) return res.status(404).json({ error: 'No resume file' });
  await log(r.id, req.admin.sub, 'resume');
  res.download(path.join(UPLOAD_DIR, rs.stored_name), rs.file_name || 'resume.pdf');
});

// Propose contacting a company. NOTHING is shared; the candidate must approve this specific proposal first.
adminRouter.post('/:id(\\d+)/outreach', async (req, res) => {
  const r = await loadRequest(req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (!isOpen(r)) return res.status(409).json({ error: 'This request is closed.' });
  const b = req.body || {};
  const company = txt(b.company_name, 255); const message = txt(b.message, 1000);
  const fields = Array.isArray(b.shared_fields) ? [...new Set(b.shared_fields)] : [];
  if (!company) return res.status(400).json({ error: 'Company name is required.' });
  if (!message) return res.status(400).json({ error: 'Explain to the candidate why this company and what you would share.' });
  if (fields.some((f) => !SHARE_FIELDS.includes(f))) return res.status(400).json({ error: 'shared_fields may only contain: ' + SHARE_FIELDS.join(', ') });
  let jobId = null;
  if (b.job_id) { const [[j]] = await pool.query("SELECT id FROM jobs WHERE id=? AND status<>'draft'", [parseInt(b.job_id, 10) || 0]); if (!j) return res.status(400).json({ error: 'That job does not exist.' }); jobId = j.id; }
  const [out] = await pool.query('INSERT INTO assistance_outreach (request_id,company_name,hr_contact,job_id,message,shared_fields,admin_note) VALUES (?,?,?,?,?,?,?)', [r.id, company, txt(b.hr_contact, 300), jobId, message, JSON.stringify(fields), txt(b.admin_note, 2000)]);
  await addUpdate(r.id, `The team proposes contacting ${company} on your behalf. Review it below. Nothing is shared unless you approve.`);
  res.status(201).json({ id: out.insertId });
});

adminRouter.put('/outreach/:oid(\\d+)', async (req, res) => {
  const [[o]] = await pool.query('SELECT o.*, r.status request_status FROM assistance_outreach o JOIN assistance_requests r ON r.id=o.request_id WHERE o.id=?', [req.params.oid]);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.request_status === 'closed') return res.status(409).json({ error: 'This request is closed.' });
  const b = req.body || {};
  if (b.admin_note !== undefined) await pool.query('UPDATE assistance_outreach SET admin_note=? WHERE id=?', [txt(b.admin_note, 2000), o.id]);
  if (b.hr_contact !== undefined) await pool.query('UPDATE assistance_outreach SET hr_contact=? WHERE id=?', [txt(b.hr_contact, 300), o.id]);
  const to = b.status;
  if (to) {
    if (!(NEXT[o.status] || []).includes(to)) return res.status(409).json({ error: `Cannot move from "${o.status}" to "${to}".${to === 'shared' && o.status !== 'candidate_approved' ? ' The candidate has not approved sharing.' : ''}` });
    if (to === 'interview_scheduled') {
      const at = new Date(b.interview_at); const info = txt(b.interview_info, 1000);
      if (isNaN(at) || !info) return res.status(400).json({ error: 'Interview date/time and details are required. Record only what the company actually confirmed.' });
      await pool.query("UPDATE assistance_outreach SET status='interview_scheduled', interview_at=?, interview_info=? WHERE id=?", [at, info, o.id]);
    } else if (to === 'shared') {
      await pool.query("UPDATE assistance_outreach SET status='shared', shared_at=UTC_TIMESTAMP() WHERE id=?", [o.id]);
    } else await pool.query('UPDATE assistance_outreach SET status=? WHERE id=?', [to, o.id]);
    const msgs = {   // lazy: only the entry for this transition is evaluated
      shared: () => `The team recorded that your details were shared with ${o.company_name} on ${fmt(new Date())}, as you approved.`,
      response_received: () => `The team recorded a response from ${o.company_name}.`,
      interview_scheduled: () => `The team recorded an interview with ${o.company_name} on ${fmt(b.interview_at)}. See details below.`,
      no_response: () => `No response from ${o.company_name} has been recorded.`,
      closed: () => `The outreach to ${o.company_name} was closed.`,
    };
    const msg = msgs[to]();
    await addUpdate(o.request_id, msg);
  }
  res.json({ ok: true });
});

// Copy-ready packet containing ONLY what the candidate approved for this company.
adminRouter.get('/outreach/:oid(\\d+)/packet', async (req, res) => {
  const [[o]] = await pool.query('SELECT o.*, r.status request_status, r.candidate_id FROM assistance_outreach o JOIN assistance_requests r ON r.id=o.request_id WHERE o.id=?', [req.params.oid]);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.request_status === 'closed') return res.status(409).json({ error: 'This request is closed.' });
  if (!['candidate_approved', 'shared', 'response_received', 'interview_scheduled', 'no_response'].includes(o.status)) return res.status(409).json({ error: 'The candidate has not approved sharing with this company.' });
  const f = J(o.shared_fields); const [[c]] = await pool.query('SELECT full_name,email FROM candidates WHERE id=?', [o.candidate_id]);
  const L = [`Candidate: ${c.full_name}`]; if (f.includes('email')) L.push(`Email: ${c.email}`);
  if (f.includes('profile')) {
    const p = await getProfile(o.candidate_id);
    if (p.headline) L.push(`Headline: ${p.headline}`); if (p.summary) L.push(`Summary: ${p.summary}`); if (p.skills.length) L.push(`Skills: ${p.skills.join(', ')}`);
    p.education.forEach((e) => L.push(`Education: ${[e.degree, e.institution, e.year].filter(Boolean).join(', ')}`));
    p.experience.forEach((e) => L.push(`Experience: ${[e.title, e.company, e.period].filter(Boolean).join(', ')}${e.details ? ' - ' + e.details : ''}`));
    p.projects.forEach((e) => L.push(`Project: ${e.name}${e.details ? ' - ' + e.details : ''}`));
  }
  if (f.includes('resume')) { const rs = await getResume(o.candidate_id); L.push('', 'Resume:', rs ? rs.resume_text : '(no resume on file)'); }
  L.push('', `Shared with the candidate's consent for ${o.company_name}. Use only for hiring purposes.`);
  await log(o.request_id, req.admin.sub, 'packet');
  res.json({ company_name: o.company_name, hr_contact: o.hr_contact, text: L.join('\n') });
});

export default { candidateRouter, adminRouter };
