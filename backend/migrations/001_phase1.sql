-- Additive only. If you already have `jobs` / `admin_users`, DO NOT run this blindly:
-- compare columns and add only what is missing (see README).
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NULL,
  category VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  work_mode VARCHAR(20) NULL,
  employment_type VARCHAR(20) NULL,
  experience VARCHAR(100) NULL,
  salary VARCHAR(150) NULL,
  salary_min INT UNSIGNED NULL,
  salary_max INT UNSIGNED NULL,
  openings INT UNSIGNED NULL,
  education VARCHAR(255) NULL,
  description MEDIUMTEXT NULL,
  responsibilities JSON NULL,
  requirements JSON NULL,
  eligibility TEXT NULL,
  benefits JSON NULL,
  skills JSON NULL,
  application_url VARCHAR(1000) NULL,
  application_email VARCHAR(255) NULL,
  application_instructions TEXT NULL,
  status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_pub (status, published_at),
  INDEX idx_type (employment_type),
  INDEX idx_mode (work_mode)
);

CREATE TABLE IF NOT EXISTS job_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  event_type ENUM('view','apply_click','share') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_event (job_id, event_type),
  CONSTRAINT fk_events_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
