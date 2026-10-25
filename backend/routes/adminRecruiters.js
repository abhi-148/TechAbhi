
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';

const r = Router();

r.use(requireAdmin);

// List recruiters, optionally filtered by status.
r.get('/recruiters', async (req, res) => {
  const st = req.query.status;

  const where = [
    'pending',
    'approved',
    'rejected',
    'suspended',
  ].includes(st)
    ? 'WHERE r.status=?'
    : '';

  const [rows] = await pool.query(
    `SELECT
       r.id,
       r.email,
       r.full_name,
       r.phone,
       r.company_name,
       r.company_website,
       r.company_description,
       r.status,
       r.status_reason,
       r.created_at,
       (
         SELECT COUNT(*)
         FROM jobs j
         WHERE j.recruiter_id=r.id
       ) job_count
     FROM recruiters r
     ${where}
     ORDER BY r.created_at DESC
     LIMIT 200`,
    where ? [st] : []
  );

  res.json({ recruiters: rows });
});

// Approve, reject, suspend, or return a recruiter to pending.
// Rejected or suspended recruiters' published jobs are closed.
r.post('/recruiters/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const status = req.body?.status;
  const reason =
    String(req.body?.reason || '').trim().slice(0, 500) || null;

  if (
    !['approved', 'rejected', 'suspended', 'pending'].includes(status)
  ) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (
    ['rejected', 'suspended'].includes(status) &&
    !reason
  ) {
    return res.status(400).json({
      error: 'Give a short reason. The recruiter will see it.',
    });
  }

  const conn = await pool.getConnection();
  let closed = 0;
  let recruiter = null;

  try {
    await conn.beginTransaction();

    const [[rec]] = await conn.query(
      `SELECT id, email, full_name, company_name, status
       FROM recruiters
       WHERE id=?
       FOR UPDATE`,
      [id]
    );

    if (!rec) {
      await conn.rollback();

      return res.status(404).json({
        error: 'Recruiter not found',
      });
    }

    recruiter = rec;

    await conn.query(
      `UPDATE recruiters
       SET status=?,
           status_reason=?,
           approved_at = CASE
             WHEN ?='approved' THEN UTC_TIMESTAMP()
             ELSE approved_at
           END
       WHERE id=?`,
      [
        status,
        status === 'approved' ? null : reason,
        status,
        id,
      ]
    );

    if (['rejected', 'suspended'].includes(status)) {
      const [out] = await conn.query(
        `UPDATE jobs
         SET status='closed'
         WHERE recruiter_id=?
           AND status='published'`,
        [id]
      );

      closed = out.affectedRows;
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  // Notify the recruiter only after the database update succeeds.
  // Email failure must not undo the status change.
  try {
    if (recruiter?.email) {
      const statusLabels = {
        approved: 'approved',
        rejected: 'rejected',
        suspended: 'suspended',
        pending: 'pending review',
      };

      const subjectMap = {
        approved: 'Your TechAbhi recruiter account is approved',
        rejected: 'Update on your TechAbhi recruiter account',
        suspended: 'Your TechAbhi recruiter account is suspended',
        pending: 'Your TechAbhi recruiter account is pending review',
      };

      const greeting = recruiter.full_name || 'Recruiter';
      const company = recruiter.company_name || 'your company';

      const message = [
        `Hello ${greeting},`,
        '',
        `Your TechAbhi recruiter account for ${company} is now ${statusLabels[status]}.`,
        ...(reason ? ['', `Reason: ${reason}`] : []),
        '',
        status === 'approved'
          ? 'Your account is approved. You can now access recruiter features.'
          : status === 'rejected'
            ? 'Your account was rejected. Please review the reason above and contact support if you need clarification.'
            : status === 'suspended'
              ? 'Your account is suspended. Please contact support if you believe this is an error.'
              : 'Your account is awaiting review. We will update you when its status changes.',
        '',
        'Regards,',
        'TechAbhi Team',
      ].join('\n');

      // Escape dynamic values before inserting them into HTML.
      const escapeHtml = (value) =>
        String(value ?? '').replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]);

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.6;color:#222">
          <h2>TechAbhi Recruiter Account Update</h2>
          <p>Hello ${escapeHtml(greeting)},</p>
          <p>
            Your recruiter account for
            <strong>${escapeHtml(company)}</strong>
            is now <strong>${escapeHtml(statusLabels[status])}</strong>.
          </p>
          ${
            reason
              ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
              : ''
          }
          <p>${escapeHtml(
            status === 'approved'
              ? 'Your account is approved. You can now access recruiter features.'
              : status === 'rejected'
                ? 'Your account was rejected. Please contact support if you need clarification.'
                : status === 'suspended'
                  ? 'Your account is suspended. Please contact support if you believe this is an error.'
                  : 'Your account is awaiting review. We will update you when its status changes.'
          )}</p>
          <p>Regards,<br>TechAbhi Team</p>
        </div>
      `;

      await sendEmail({
        to: recruiter.email,
        subject: subjectMap[status],
        text: message,
        html,
      });
    }
  } catch (emailError) {
    console.error(
      'Recruiter status email failed:',
      emailError.code || emailError.name
    );
  }

  return res.json({
    ok: true,
    jobs_closed: closed,
    email_notification_attempted: Boolean(recruiter?.email),
  });
});

export default r;
