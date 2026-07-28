-- Baseline snapshot of the schema as it existed the day this migration
-- system was introduced. Every statement is idempotent (CREATE TABLE IF NOT
-- EXISTS) so it's safe to run against a database that already has this
-- schema (the runner also only ever runs a given file once, tracked in
-- schema_migrations - this idempotency is a second, independent safety net,
-- not the only one).
--
-- Historically these tables were built up piecemeal (a handful of columns
-- added later via ALTER TABLE as features were added - see this project's
-- git history for `ensureRoleModel`/`ensureAuthColumns` if curious). Those
-- columns are folded directly into the CREATE TABLE statements below rather
-- than replayed as separate ALTERs, since every database this project
-- actually runs against had already received them before this file was
-- written - there is no environment left where the ALTER path has work left
-- to do. A genuinely fresh database gets the final shape directly.

CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  role ENUM('dept_admin','sysadmin') DEFAULT 'sysadmin',
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  semester INT,
  course_branch VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  role ENUM('student','lecturer','moderator') DEFAULT 'student',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  password_reset_token VARCHAR(255),
  email_verified TINYINT(1) DEFAULT 0,
  email_verification_token VARCHAR(255),
  password_reset_expires DATETIME,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  subject VARCHAR(100) NOT NULL,
  semester INT,
  level VARCHAR(50) DEFAULT 'Beginner',
  duration VARCHAR(50),
  credits INT DEFAULT 3,
  professor_name VARCHAR(100),
  professor_email VARCHAR(100),
  prerequisites VARCHAR(255),
  course_code VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  image VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE SET NULL,
  INDEX idx_subject (subject),
  INDEX idx_semester (semester),
  INDEX idx_department (department),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  semester INT,
  type ENUM('Notes','Video','PDF','Book','Link') DEFAULT 'Notes',
  message TEXT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  course_id INT,
  approved_by INT,
  approval_comment TEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  description TEXT,
  level VARCHAR(50),
  duration VARCHAR(50),
  image VARCHAR(255),
  lesson_title VARCHAR(255),
  lesson_description TEXT,
  resource_url VARCHAR(500),
  lesson_order INT DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES admin(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS course_lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  lesson_title VARCHAR(255) NOT NULL,
  lesson_description TEXT,
  resource_type ENUM('PDF', 'Video', 'Link') DEFAULT 'PDF',
  resource_url VARCHAR(500) NOT NULL,
  lesson_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course_lessons_course_id (course_id),
  INDEX idx_course_lessons_order (lesson_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS analytics_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  event_type VARCHAR(100) NOT NULL,
  course_id INT NULL,
  lesson_id INT NULL,
  resource_type VARCHAR(50),
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_analytics_event_type (event_type),
  INDEX idx_analytics_created_at (created_at),
  INDEX idx_analytics_course_id (course_id),
  INDEX idx_analytics_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_learning_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  lesson_id INT NULL,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY user_course (user_id, course_id),
  INDEX idx_user_course_accessed (user_id, last_accessed_at),
  INDEX idx_course_accessed (course_id, last_accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS request_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  changed_by_admin_id INT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES resource_requests(id) ON DELETE CASCADE,
  INDEX idx_request_status_history_request_id (request_id),
  INDEX idx_request_status_history_status (status),
  INDEX idx_request_status_history_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  meta TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notifications_user_id (user_id),
  INDEX idx_user_notifications_read (is_read),
  INDEX idx_user_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NULL,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id INT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL,
  INDEX idx_admin_audit_admin_id (admin_id),
  INDEX idx_admin_audit_action (action_type),
  INDEX idx_admin_audit_target (target_type),
  INDEX idx_admin_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- report_generation_history FKs to report_schedules, so it must come after.
CREATE TABLE IF NOT EXISTS report_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  frequency ENUM('daily', 'weekly') DEFAULT 'daily',
  time_of_day CHAR(5) DEFAULT '09:00',
  range_days INT DEFAULT 30,
  recipient_email VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  next_run_at DATETIME NULL,
  last_run_at DATETIME NULL,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_report_schedule_admin (admin_id),
  INDEX idx_report_schedules_next_run (next_run_at),
  INDEX idx_report_schedules_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS report_generation_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NULL,
  schedule_id INT NULL,
  report_type VARCHAR(100) DEFAULT 'analytics',
  format VARCHAR(20) DEFAULT 'csv',
  range_days INT DEFAULT 30,
  status ENUM('success', 'failed') DEFAULT 'success',
  recipient_email VARCHAR(255),
  file_name VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL,
  FOREIGN KEY (schedule_id) REFERENCES report_schedules(id) ON DELETE SET NULL,
  INDEX idx_report_history_created_at (created_at),
  INDEX idx_report_history_admin_id (admin_id),
  INDEX idx_report_history_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lecturer-uploaded resources, moderated separately from the
-- resource_requests pipeline above (a request-for-content flow) since
-- lecturer uploads are direct, trusted content contributions with a
-- different shape and review path.
CREATE TABLE IF NOT EXISTS lecturer_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploader_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  department VARCHAR(100),
  semester INT,
  course_id INT NULL,
  resource_type ENUM('PDF','Video','Link','Image','ZIP','Document') DEFAULT 'PDF',
  resource_link VARCHAR(500) NOT NULL,
  tags VARCHAR(255),
  status ENUM('pending','approved','rejected','flagged') DEFAULT 'pending',
  reviewed_by INT NULL,
  review_comment TEXT,
  views INT DEFAULT 0,
  downloads INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_lecturer_resources_status (status),
  INDEX idx_lecturer_resources_uploader (uploader_id),
  INDEX idx_lecturer_resources_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Comments (with one-level-or-deeper replies via parent_comment_id), ratings
-- (one per user per resource, upserted), and bookmarks all FK to
-- lecturer_resources, so they must come after it.
CREATE TABLE IF NOT EXISTS resource_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_comment_id INT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES lecturer_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES resource_comments(id) ON DELETE CASCADE,
  INDEX idx_resource_comments_resource (resource_id),
  INDEX idx_resource_comments_parent (parent_comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES lecturer_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_resource_user_rating (resource_id, user_id),
  INDEX idx_resource_ratings_resource (resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource_bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES lecturer_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_resource_user_bookmark (resource_id, user_id),
  INDEX idx_resource_bookmarks_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS search_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  query VARCHAR(255) NOT NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_search_logs_query (query),
  INDEX idx_search_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FKs to lecturer_resources, so it must come after that table.
CREATE TABLE IF NOT EXISTS ai_content_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  content_type VARCHAR(30) NOT NULL,
  content_json LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES lecturer_resources(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_resource_content_type (resource_id, content_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
