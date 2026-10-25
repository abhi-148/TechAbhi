
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
import { sendEmail } from '../services/emailService.js';
import { COLS, dbVal } from './adminJobs.js';

const r = Router();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads/resumes');

const APP_STATUSES = [
  'new',
  'in_review',
  'shortlisted',
  'interview',
  'rejected',
  'hired',
];

const txt = (v, m) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, m) : null;
};

const emailOk = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const sign = (id) =>
  jwt.sign(
    { sub: id, role: 'recruiter' },
    process.env.JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  );

const parseObj = (v) => {
  if (v && typeof v === 'object') return v;
  try {
    return JSON.parse(v) || {};
  } catch {
    return {};
  }
};

async function sendEmailSafely(emailOptions, label) {
  try {
    await sendEmail(emailOptions);
  } catch (error) {
    console.error(
      `${label} email failed:`,
      error.code || error.name || 'Unknown error'
    );
  }
}

// ---------- public: register / login ----------

r.post(
  '/register',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
  }),
  async (req, res) => {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const name = txt(b.full_name, 150);
    const company = txt(b.company_name, 255);
    const pw = String(b.password || '');

    if (!emailOk(email) || email.length > 255) {
      return res.status(400).json({
        error: 'Enter a valid work email.',
      });
    }

    if (!name) {
      return res.status(400).json({
        error: 'Enter your full name.',
      });
    }

    if (!company) {
      return res.status(400).json({
        error: 'Enter your company name.',
      });
    }

    if (pw.length < 8 || pw.length > 72) {
      return res.status(400).json({
        error: 'Password must be 8 to 72 characters.',
      });
    }

    const site = safeUrl(b.company_website);

    if (site === undefined) {
      return res.status(400).json({
        error: 'Company website must be a valid http(s) URL.',
      });
    }

    const [[existing]] = await pool.query(
      'SELECT id FROM recruiters WHERE email=?',
      [email]
    );

    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists. Try logging in.',
      });
    }

    const [out] = await pool.query(
      `INSERT INTO recruiters
       (email, password_hash, full_name, phone, company_name,
        company_website, company_description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        await bcrypt.hash(pw, 12),
        name,
        txt(b.phone, 30),
        company,
        site,
        txt(b.company_description, 3000),
      ]
    );

    // Notify the admin about the new pending recruiter.
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

    if (adminEmail) {
      await sendEmailSafely(
        {
          to: adminEmail,
          subject: 'New recruiter registration - TechAbhi',
          text: [
            'A new recruiter has registered on TechAbhi.',
            '',
            `Name: ${name}`,
            `Company: ${company}`,
            `Email: ${email}`,
            'Status: pending',
            '',
            'Please review this account in the admin dashboard.',
          ].join('\n'),
        },
        'Admin recruiter registration'
      );
    } else {
      console.warn(
        'ADMIN_NOTIFICATION_EMAIL is not configured; admin notification skipped.'
      );
    }

    return res.status(201).json({
      token: sign(out.insertId),
      status: 'pending',
    });
  }
);

r.post(
  '/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();

    const [[recruiter]] = await pool.query(
      'SELECT id, password_hash, status FROM recruiters WHERE email=?',
      [email]
    );

    if (
      !(await checkPassword(
        req.body?.password,
        recruiter?.password_hash
      ))
    ) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    return res.json({
      token: sign(recruiter.id),
      status: recruiter.status,
    });
  }
);

// ---------- authenticated recruiter routes ----------

r.use(requireRecruiter);

// Any status can view their profile and approval status.
r.get('/me', (req, res) => {
  res.json({ recruiter: req.recruiter });
});

r.put('/profile', async (req, res) => {
  const site = safeUrl(req.body?.company_website);

  if (site === undefined) {
    return res.status(400).json({
      error: 'Company website must be a valid http(s) URL.',
    });
  }

  await pool.query(
    `UPDATE recruiters
     SET phone=?,
         company_website=?,
         company_description=?,
         full_name=COALESCE(?, full_name)
     WHERE id=?`,
    [
      txt(req.body?.phone, 30),
      site,
      txt(req.body?.company_description, 3000),
      txt(req.body?.full_name, 150),
      req.recruiter.id,
    ]
  );

  res.json({ ok: true });
});

// ---------- routes below require an approved recruiter ----------

r.use(requireApproved);

const own = async (jobId, recruiterId) => {
  const [[row]] = await pool.query(
    'SELECT * FROM jobs WHERE id=? AND recruiter_id=?',
    [parseInt(jobId, 10) || 0, recruiterId]
  );

  return row ? serialize(row) : null;
};

// List this recruiter's jobs.
r.get('/jobs', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT j.*,
      (
        SELECT COUNT(*)
        FROM job_submissions s
        WHERE s.job_id=j.id AND s.status<>'withdrawn'
      ) app_count
     FROM jobs j
     WHERE j.recruiter_id=?
     ORDER BY j.updated_at DESC
     LIMIT 200`,
    [req.recruiter.id]
  );

  res.json({ jobs: rows.map(serialize) });
});

// Parse a pasted job description using AI.
r.post(
  '/jobs/parse',
  rateLimit({ windowMs: 60 * 1000, max: 10 }),
  async (req, res) => {
    const text = String(req.body?.text || '').trim();

    if (text.length < 30) {
      return res.status(400).json({
        error: 'Paste the full job description (at least 30 characters).',
      });
    }

    if (text.length > 30000) {
      return res.status(400).json({
        error: 'Text too long (max 30,000 characters).',
      });
    }

    try {
      res.json(await parseJobText(text));
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message,
      });
    }
  }
);

r.get('/jobs/:id', async (req, res) => {
  const job = await own(req.params.id, req.recruiter.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({ job });
});

// Create a draft job.
r.post('/jobs', async (req, res) => {
  const { value, errors } = sanitizeJob(req.body);

  if (errors.length) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  value.company = req.recruiter.company_name;

  const [out] = await pool.query(
    `INSERT INTO jobs
     (${COLS.join(',')}, status, recruiter_id)
     VALUES (${COLS.map(() => '?').join(',')}, 'draft', ?)`,
    [
      ...COLS.map((column) => dbVal(column, value[column])),
      req.recruiter.id,
    ]
  );

  res.status(201).json({
    job: await own(out.insertId, req.recruiter.id),
  });
});

// Update a job.
r.put('/jobs/:id', async (req, res) => {
  const current = await own(req.params.id, req.recruiter.id);

  if (!current) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const { value, errors } = sanitizeJob(req.body);

  if (errors.length) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  value.company = req.recruiter.company_name;

  if (current.status === 'published') {
    const publishValidation = publishErrors(value, {
      internal: true,
    });

    if (publishValidation.length) {
      return res.status(400).json({
        error: 'A published job must stay complete',
        details: publishValidation,
      });
    }
  }

  await pool.query(
    `UPDATE jobs
     SET ${COLS.map((column) => `${column}=?`).join(',')}
     WHERE id=? AND recruiter_id=?`,
    [
      ...COLS.map((column) => dbVal(column, value[column])),
      current.id,
      req.recruiter.id,
    ]
  );

  res.json({
    job: await own(current.id, req.recruiter.id),
  });
});

// Publish, draft, or close a job.
r.post('/jobs/:id/status', async (req, res) => {
  const job = await own(req.params.id, req.recruiter.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const status = req.body?.status;

  if (!['draft', 'published', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (status === 'published') {
    const validation = publishErrors(job, { internal: true });

    if (validation.length) {
      return res.status(400).json({
        error: 'Cannot publish yet',
        details: validation,
      });
    }

    if (job.expires_at && new Date(job.expires_at) <= new Date()) {
      return res.status(400).json({
        error: 'Expiry date has passed. Edit or clear it before publishing/reopening.',
      });
    }
  }

  await pool.query(
    `UPDATE jobs
     SET status=?,
         published_at = CASE
           WHEN ?='published' AND published_at IS NULL
           THEN UTC_TIMESTAMP()
           ELSE published_at
         END
     WHERE id=? AND recruiter_id=?`,
    [status, status, job.id, req.recruiter.id]
  );

  res.json({
    job: await own(job.id, req.recruiter.id),
  });
});

// Delete a non-published job only when it has no submissions.
r.delete('/jobs/:id', async (req, res) => {
  const job = await own(req.params.id, req.recruiter.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status === 'published') {
    return res.status(409).json({
      error: 'Unpublish or close the job before deleting it.',
    });
  }

  const [[submissionCount]] = await pool.query(
    'SELECT COUNT(*) AS n FROM job_submissions WHERE job_id=?',
    [job.id]
  );

  if (submissionCount.n > 0) {
    return res.status(409).json({
      error: 'This job has applications. Close it instead of deleting.',
    });
  }

  await pool.query(
    'DELETE FROM jobs WHERE id=? AND recruiter_id=?',
    [job.id, req.recruiter.id]
  );

  res.json({ ok: true });
});

// ---------- applications ----------

// List applications submitted to this recruiter's jobs.
r.get('/applications', async (req, res) => {
  const where = ['j.recruiter_id=?'];
  const params = [req.recruiter.id];

  if (req.query.job_id) {
    where.push('s.job_id=?');
    params.push(parseInt(req.query.job_id, 10) || 0);
  }

  if ([...APP_STATUSES, 'withdrawn'].includes(req.query.status)) {
    where.push('s.status=?');
    params.push(req.query.status);
  }

  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.job_id,
       j.title AS job_title,
       s.candidate_name,
       s.status,
       s.submitted_at,
       s.viewed_at,
       (s.resume_text IS NOT NULL) AS has_resume
     FROM job_submissions s
     JOIN jobs j ON j.id=s.job_id
     WHERE ${where.join(' AND ')}
     ORDER BY s.submitted_at DESC
     LIMIT 200`,
    params
  );

  res.json({
    applications: rows.map((row) => ({
      ...row,
      has_resume: Boolean(row.has_resume),
    })),
  });
});

async function ownSub(id, recruiterId) {
  const [[submission]] = await pool.query(
    `SELECT s.*, j.title AS job_title
     FROM job_submissions s
     JOIN jobs j ON j.id=s.job_id
     WHERE s.id=? AND j.recruiter_id=?`,
    [parseInt(id, 10) || 0, recruiterId]
  );

  return submission || null;
}

// Get an application belonging to this recruiter.
r.get('/applications/:id', async (req, res) => {
  const submission = await ownSub(
    req.params.id,
    req.recruiter.id
  );

  if (!submission) {
    return res.status(404).json({
      error: 'Application not found',
    });
  }

  if (
    submission.status !== 'withdrawn' &&
    !submission.viewed_at
  ) {
    await pool.query(
      'UPDATE job_submissions SET viewed_at=UTC_TIMESTAMP() WHERE id=?',
      [submission.id]
    );

    submission.viewed_at = new Date();
  }

  const profile = parseObj(submission.profile_json);

  res.json({
    application: {
      id: submission.id,
      job_id: submission.job_id,
      job_title: submission.job_title,
      status: submission.status,
      submitted_at: submission.submitted_at,
      viewed_at: submission.viewed_at,
      candidate_name: submission.candidate_name,
      candidate_email: submission.candidate_email || null,
      cover_note: submission.cover_note,
      recruiter_note: submission.recruiter_note,
      resume_text: submission.resume_text,
      has_resume_file: Boolean(submission.resume_file),
      profile:
        submission.status === 'withdrawn'
          ? null
          : {
              ...profile,
              skills: J(profile.skills),
              education: J(profile.education),
              experience: J(profile.experience),
              projects: J(profile.projects),
            },
    },
  });
});

// Update application status and notify the candidate if it changed.
r.put('/applications/:id', async (req, res) => {
  const submission = await ownSub(
    req.params.id,
    req.recruiter.id
  );

  if (!submission) {
    return res.status(404).json({
      error: 'Application not found',
    });
  }

  if (submission.status === 'withdrawn') {
    return res.status(409).json({
      error: 'The candidate withdrew this application.',
    });
  }

  const status = req.body?.status ?? submission.status;

  if (!APP_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const note =
    req.body?.recruiter_note !== undefined
      ? txt(req.body.recruiter_note, 2000)
      : submission.recruiter_note;

  await pool.query(
    'UPDATE job_submissions SET status=?, recruiter_note=? WHERE id=?',
    [status, note, submission.id]
  );

  if (status !== submission.status && submission.candidate_email) {
    await sendEmailSafely(
      {
        to: submission.candidate_email,
        subject: `Application status update - ${submission.job_title}`,
        text: [
          `Hello ${submission.candidate_name || 'Candidate'},`,
          '',
          `Your application for "${submission.job_title}" has been updated.`,
          `New status: ${status.replace(/_/g, ' ')}`,
          '',
          'Please sign in to TechAbhi to review your application.',
          '',
          'Regards,',
          'TechAbhi Team',
        ].join('\n'),
      },
      'Candidate application-status'
    );
  }

  res.json({ ok: true });
});

// Download a resume explicitly shared with this recruiter.
r.get('/applications/:id/resume', async (req, res) => {
  const submission = await ownSub(
    req.params.id,
    req.recruiter.id
  );

  if (
    !submission ||
    !submission.resume_file ||
    !/^[a-f0-9]{32}\.pdf$/.test(submission.resume_file)
  ) {
    return res.status(404).json({
      error: 'No resume file shared',
    });
  }

  res.download(
    path.join(UPLOAD_DIR, submission.resume_file),
    submission.resume_file_name || 'resume.pdf'
  );
});

// ---------- dashboard ----------

r.get('/dashboard', async (req, res) => {
  const id = req.recruiter.id;

  const count = (rows, key) =>
    Object.fromEntries(
      rows.map((row) => [row[key], Number(row.n)])
    );

  const [jobs] = await pool.query(
    'SELECT status, COUNT(*) n FROM jobs WHERE recruiter_id=? GROUP BY status',
    [id]
  );

  const [apps] = await pool.query(
    `SELECT s.status, COUNT(*) n
     FROM job_submissions s
     JOIN jobs j ON j.id=s.job_id
     WHERE j.recruiter_id=?
     GROUP BY s.status`,
    [id]
  );

  const [events] = await pool.query(
    `SELECT e.event_type, COUNT(*) n
     FROM job_events e
     JOIN jobs j ON j.id=e.job_id
     WHERE j.recruiter_id=?
     GROUP BY e.event_type`,
    [id]
  );

  const [recent] = await pool.query(
    `SELECT
       s.id,
       s.candidate_name,
       s.status,
       s.submitted_at,
       j.title AS job_title
     FROM job_submissions s
     JOIN jobs j ON j.id=s.job_id
     WHERE j.recruiter_id=? AND s.status<>'withdrawn'
     ORDER BY s.submitted_at DESC
     LIMIT 5`,
    [id]
  );

  res.json({
    jobs: count(jobs, 'status'),
    applications: count(apps, 'status'),
    events: count(events, 'event_type'),
    recent,
  });
});

export default r;
