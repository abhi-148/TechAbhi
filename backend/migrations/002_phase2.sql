-- Phase 2 (additive). If you already have candidates / candidate_resumes / saved_jobs /
-- job_applications tables, compare columns first and ALTER instead of running this blindly.
CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candidate_profiles (
  candidate_id INT PRIMARY KEY,
  headline VARCHAR(200) NULL,
  summary TEXT NULL,
  skills JSON NULL,
  education JSON NULL,
  experience JSON NULL,
  projects JSON NULL,
  preferred_location VARCHAR(255) NULL,
  preferred_employment_type VARCHAR(20) NULL,
  preferred_work_mode VARCHAR(20) NULL,
  career_interests TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prof_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS candidate_resumes (
  candidate_id INT PRIMARY KEY,
  file_name VARCHAR(255) NULL,
  stored_name VARCHAR(100) NULL,
  resume_text MEDIUMTEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS saved_jobs (
  candidate_id INT NOT NULL,
  job_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (candidate_id, job_id),
  CONSTRAINT fk_sj_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_sj_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
-- link_opened = candidate opened the employer's link. All later statuses are SELF-REPORTED by the
-- candidate; nothing here is employer-confirmed.
CREATE TABLE IF NOT EXISTS job_applications (
  candidate_id INT NOT NULL,
  job_id INT NOT NULL,
  status ENUM('link_opened','applied','interview','offer','rejected','withdrawn') NOT NULL DEFAULT 'link_opened',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (candidate_id, job_id),
  CONSTRAINT fk_ja_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_ja_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
