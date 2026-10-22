-- Phase 4 (career assistance). Additive. Run once after 001-003.
-- A candidate asks the TechAbhi team for help. Nothing is shared with any company
-- unless the candidate separately approves that specific outreach.
CREATE TABLE IF NOT EXISTS assistance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  status ENUM('submitted','in_review','in_progress','on_hold','closed') NOT NULL DEFAULT 'submitted',
  target_roles VARCHAR(500) NULL,
  preferred_locations VARCHAR(300) NULL,
  availability VARCHAR(300) NULL,
  challenges TEXT NULL,
  consent_review_at DATETIME NOT NULL,
  closed_reason VARCHAR(300) NULL,
  admin_note TEXT NULL,
  first_viewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- NULL when closed, 1 when open: the unique key below allows only ONE open request per candidate
  open_key TINYINT AS (IF(status='closed', NULL, 1)) VIRTUAL,
  UNIQUE KEY uq_one_open (candidate_id, open_key),
  INDEX idx_assist_status (status),
  CONSTRAINT fk_assist_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assistance_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  author ENUM('team','system') NOT NULL DEFAULT 'team',
  message VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_upd_req (request_id),
  CONSTRAINT fk_upd_req FOREIGN KEY (request_id) REFERENCES assistance_requests(id) ON DELETE CASCADE
);

-- One row per proposed contact with a company. hr_contact and admin_note are admin-only.
CREATE TABLE IF NOT EXISTS assistance_outreach (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  hr_contact VARCHAR(300) NULL,
  job_id INT NULL,
  message VARCHAR(1000) NOT NULL,
  shared_fields JSON NOT NULL,
  status ENUM('proposed','candidate_approved','candidate_declined','shared','response_received','interview_scheduled','no_response','closed') NOT NULL DEFAULT 'proposed',
  candidate_decision_at DATETIME NULL,
  shared_at DATETIME NULL,
  interview_at DATETIME NULL,
  interview_info VARCHAR(1000) NULL,
  admin_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_out_req (request_id),
  CONSTRAINT fk_out_req FOREIGN KEY (request_id) REFERENCES assistance_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_out_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- Who on the team looked at a candidate's data, and when.
CREATE TABLE IF NOT EXISTS assistance_access_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('view','resume','packet') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_req (request_id),
  CONSTRAINT fk_log_req FOREIGN KEY (request_id) REFERENCES assistance_requests(id) ON DELETE CASCADE
);
