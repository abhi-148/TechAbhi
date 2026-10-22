-- Phase 3 (recruiters). Run ONCE. If you already have a `recruiters` table, compare columns first.
-- The ALTER below is not idempotent (MySQL has no ADD COLUMN IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS recruiters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL,
  company_name VARCHAR(255) NOT NULL,
  company_website VARCHAR(500) NULL,
  company_description TEXT NULL,
  status ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  status_reason VARCHAR(500) NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rec_status (status)
);

ALTER TABLE jobs
  ADD COLUMN recruiter_id INT NULL,
  ADD INDEX idx_jobs_recruiter (recruiter_id),
  ADD CONSTRAINT fk_jobs_recruiter FOREIGN KEY (recruiter_id) REFERENCES recruiters(id);

-- An application submitted THROUGH TechAbhi to a recruiter's job, with the candidate's explicit consent.
-- It is a snapshot of what the candidate agreed to share. Withdrawing wipes the snapshot.
-- (External-link "applications" are NOT here; those only live in the candidate's own tracker.)
CREATE TABLE IF NOT EXISTS job_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  candidate_id INT NOT NULL,
  candidate_name VARCHAR(150) NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  profile_json JSON NULL,
  cover_note TEXT NULL,
  resume_text MEDIUMTEXT NULL,
  resume_file VARCHAR(100) NULL,
  resume_file_name VARCHAR(255) NULL,
  status ENUM('new','in_review','shortlisted','interview','rejected','hired','withdrawn') NOT NULL DEFAULT 'new',
  recruiter_note TEXT NULL,
  consent_at DATETIME NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  viewed_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_candidate (job_id, candidate_id),
  INDEX idx_sub_job_status (job_id, status),
  CONSTRAINT fk_sub_job FOREIGN KEY (job_id) REFERENCES jobs(id),
  CONSTRAINT fk_sub_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
