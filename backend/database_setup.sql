-- SmartStudent Database Complete Setup
-- This script will create a professional, normalized database with views and triggers

-- ============================================
-- STEP 1: BACKUP EXISTING DATA
-- ============================================
CREATE TABLE IF NOT EXISTS courses_backup AS SELECT * FROM courses WHERE 1=0;
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users WHERE 1=0;
CREATE TABLE IF NOT EXISTS resource_requests_backup AS SELECT * FROM resource_requests WHERE 1=0;
CREATE TABLE IF NOT EXISTS admin_backup AS SELECT * FROM admin WHERE 1=0;

-- Copy existing data to backup
INSERT INTO courses_backup SELECT * FROM courses;
INSERT INTO users_backup SELECT * FROM users;
INSERT INTO resource_requests_backup SELECT * FROM resource_requests;
INSERT INTO admin_backup SELECT * FROM admin;

-- Verify backup
SELECT 'Backup completed - Admin records:' as status;
SELECT COUNT(*) as backup_admin_count FROM admin_backup;
SELECT COUNT(*) as backup_users_count FROM users_backup;
SELECT COUNT(*) as backup_courses_count FROM courses_backup;
SELECT COUNT(*) as backup_requests_count FROM resource_requests_backup;

-- ============================================
-- STEP 2: DROP OLD TABLES (keeping backups)
-- ============================================
DROP TABLE IF EXISTS resource_requests;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admin;

-- ============================================
-- STEP 3: CREATE IMPROVED ADMIN TABLE
-- ============================================
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert admin user from backup
INSERT INTO admin (name, email, password, department, is_active) 
SELECT 'Admin User', email, password, 'Administration', TRUE 
FROM admin_backup 
LIMIT 1;

-- If backup is empty, insert default
INSERT INTO admin (name, email, password, department) 
SELECT 'Admin User', 'fathimasafrina57@gmail.com', 'admin123', 'Administration'
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM admin);

SELECT 'Admin table created' as status, COUNT(*) as total_admins FROM admin;

-- ============================================
-- STEP 4: CREATE IMPROVED USERS TABLE
-- ============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  semester INT,
  course_branch VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  role ENUM('student','admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrate existing users
INSERT INTO users (username, email, password, first_name, last_name, role, is_active) 
SELECT username, email, password, SUBSTRING_INDEX(username, '_', 1), SUBSTRING_INDEX(username, '_', -1), role, TRUE
FROM users_backup
WHERE username IS NOT NULL;

-- Insert sample users if none exist
INSERT INTO users (username, email, password, first_name, last_name, phone, semester, course_branch)
SELECT 'safrina', 'safrina@email.com', 'password123', 'Safrina', 'Fathima', '9876543210', 4, 'CSE'
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'safrina');

INSERT INTO users (username, email, password, first_name, last_name, phone, semester, course_branch)
SELECT 'john', 'john@email.com', 'password123', 'John', 'Doe', '9876543211', 2, 'ECE'
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'john');

SELECT 'Users table created' as status, COUNT(*) as total_users FROM users;

-- ============================================
-- STEP 5: CREATE IMPROVED COURSES TABLE
-- ============================================
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) UNIQUE NOT NULL,
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
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE SET NULL,
  INDEX idx_subject (subject),
  INDEX idx_semester (semester),
  INDEX idx_department (department),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrate existing courses
INSERT INTO courses (title, description, subject, level, duration, image, is_active, created_by)
SELECT 
  COALESCE(TRIM(c.title), CONCAT('Course_', c.id)),
  c.description,
  COALESCE(c.subject, 'General'),
  COALESCE(c.level, 'Beginner'),
  c.duration,
  c.image,
  TRUE,
  1
FROM courses_backup c
WHERE TRIM(c.title) IS NOT NULL AND TRIM(c.title) != '';

-- Insert sample courses
INSERT INTO courses (title, description, subject, semester, level, duration, credits, professor_name, professor_email, prerequisites, course_code, department, created_by)
SELECT 'Data Structures and Algorithms', 'Master DSA with Python', 'Computer Science', 2, 'Intermediate', '12 weeks', 4, 'Dr. Rajesh Kumar', 'rajesh@college.edu', 'Basic Programming', 'CS201', 'IT', 1
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS201');

INSERT INTO courses (title, description, subject, semester, level, duration, credits, professor_name, professor_email, prerequisites, course_code, department, created_by)
SELECT 'Web Development with MERN', 'Full Stack Development', 'Web Technology', 3, 'Intermediate', '8 weeks', 3, 'Prof. Amit Singh', 'amit@college.edu', 'JavaScript Basics', 'WD301', 'IT', 1
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'WD301');

INSERT INTO courses (title, description, subject, semester, level, duration, credits, professor_name, professor_email, prerequisites, course_code, department, created_by)
SELECT 'Database Management Systems', 'SQL and Query Optimization', 'Database', 3, 'Advanced', '6 weeks', 3, 'Dr. Aisha Patel', 'aisha@college.edu', 'DS Basics', 'DB301', 'IT', 1
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'DB301');

SELECT 'Courses table created' as status, COUNT(*) as total_courses FROM courses;

-- ============================================
-- STEP 6: CREATE IMPROVED RESOURCE_REQUESTS TABLE
-- ============================================
CREATE TABLE resource_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  semester INT,
  type ENUM('Notes', 'Video', 'PDF', 'Book', 'Link') DEFAULT 'Notes',
  message TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  course_id INT,
  approved_by INT,
  approval_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES admin(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrate existing requests (if any)
INSERT INTO resource_requests (user_id, title, subject, semester, type, message, status)
SELECT 
  (SELECT id FROM users LIMIT 1),
  COALESCE(r.title, 'Request'),
  r.subject,
  r.semester,
  COALESCE(r.type, 'Notes'),
  r.message,
  r.status
FROM resource_requests_backup r;

-- Insert sample requests
INSERT INTO resource_requests (user_id, title, subject, semester, type, message, status)
SELECT 1, 'Advanced DSA Notes', 'Computer Science', 4, 'PDF', 'Need comprehensive DSA notes for interview prep', 'pending'
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM resource_requests WHERE title = 'Advanced DSA Notes');

INSERT INTO resource_requests (user_id, title, subject, semester, type, message, status)
SELECT 2, 'React Tutorial Videos', 'Web Technology', 2, 'Video', 'Looking for video tutorials on React hooks', 'pending'
FROM (SELECT 1) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM resource_requests WHERE title = 'React Tutorial Videos');

SELECT 'Resource Requests table created' as status, COUNT(*) as total_requests FROM resource_requests;

-- ============================================
-- STEP 7: CREATE AUDIT TABLE FOR TRIGGERS
-- ============================================
CREATE TABLE IF NOT EXISTS request_approvals_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT,
  approved_by INT,
  approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_comment TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Audit table created' as status;

-- ============================================
-- STEP 8: CREATE VIEWS
-- ============================================

-- View 1: Active courses with admin info
CREATE OR REPLACE VIEW active_courses_view AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.subject,
  c.semester,
  c.level,
  c.credits,
  c.professor_name,
  c.professor_email,
  c.department,
  c.course_code,
  a.name as created_by_admin,
  a.email as admin_email,
  c.image,
  c.created_at
FROM courses c
LEFT JOIN admin a ON c.created_by = a.id
WHERE c.is_active = TRUE
ORDER BY c.semester, c.subject;

SELECT 'View: active_courses_view created' as status;

-- View 2: Pending requests with student info
CREATE OR REPLACE VIEW pending_requests_view AS
SELECT 
  r.id,
  r.title,
  r.subject,
  r.semester,
  r.type,
  r.message,
  CONCAT(u.first_name, ' ', u.last_name) as student_name,
  u.email as student_email,
  u.username,
  u.semester as student_semester,
  u.course_branch,
  r.created_at
FROM resource_requests r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;

SELECT 'View: pending_requests_view created' as status;

-- View 3: Approved requests with courses
CREATE OR REPLACE VIEW approved_requests_with_courses AS
SELECT 
  r.id as request_id,
  r.title as request_title,
  CONCAT(u.first_name, ' ', u.last_name) as requested_by,
  c.id as course_id,
  c.title as course_title,
  c.subject,
  r.approved_at,
  a.name as approved_by_admin
FROM resource_requests r
JOIN users u ON r.user_id = u.id
LEFT JOIN courses c ON r.course_id = c.id
LEFT JOIN admin a ON r.approved_by = a.id
WHERE r.status = 'approved'
ORDER BY r.approved_at DESC;

SELECT 'View: approved_requests_with_courses created' as status;

-- View 4: Student dashboard
CREATE OR REPLACE VIEW student_dashboard AS
SELECT 
  u.id as student_id,
  CONCAT(u.first_name, ' ', u.last_name) as student_name,
  u.username,
  u.semester,
  u.course_branch,
  COUNT(DISTINCT rr.id) as pending_requests,
  COUNT(DISTINCT c.id) as available_courses,
  u.created_at as joined_date
FROM users u
LEFT JOIN resource_requests rr ON u.id = rr.user_id AND rr.status = 'pending'
LEFT JOIN courses c ON c.semester = u.semester AND c.is_active = TRUE
WHERE u.is_active = TRUE AND u.role = 'student'
GROUP BY u.id, u.first_name, u.last_name, u.username, u.semester, u.course_branch, u.created_at;

SELECT 'View: student_dashboard created' as status;

-- ============================================
-- STEP 9: CREATE TRIGGERS
-- ============================================

-- Trigger 1: Update course timestamp
DELIMITER $$
CREATE TRIGGER course_update_timestamp
BEFORE UPDATE ON courses
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

SELECT 'Trigger: course_update_timestamp created' as status;

-- Trigger 2: Update request timestamp
DELIMITER $$
CREATE TRIGGER request_update_timestamp
BEFORE UPDATE ON resource_requests
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

SELECT 'Trigger: request_update_timestamp created' as status;

-- Trigger 3: Prevent active course deletion
DELIMITER $$
CREATE TRIGGER prevent_active_course_delete
BEFORE DELETE ON courses
FOR EACH ROW
BEGIN
  IF OLD.is_active = TRUE THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete active courses. Set is_active = FALSE first.';
  END IF;
END$$
DELIMITER ;

SELECT 'Trigger: prevent_active_course_delete created' as status;

-- Trigger 4: Log approval to audit table
DELIMITER $$
CREATE TRIGGER log_request_approval
AFTER UPDATE ON resource_requests
FOR EACH ROW
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO request_approvals_audit (request_id, approved_by, approval_comment)
    VALUES (NEW.id, NEW.approved_by, NEW.approval_comment);
  END IF;
END$$
DELIMITER ;

SELECT 'Trigger: log_request_approval created' as status;

-- ============================================
-- STEP 10: VERIFICATION
-- ============================================

SELECT '========================================' as section;
SELECT 'DATABASE SETUP COMPLETED SUCCESSFULLY!' as status;
SELECT '========================================' as section;

SELECT 'ADMIN RECORDS:' as table_info;
SELECT COUNT(*) as count FROM admin;
SELECT id, name, email, department, created_at FROM admin;

SELECT 'USERS RECORDS:' as table_info;
SELECT COUNT(*) as count FROM users;
SELECT id, username, email, first_name, last_name, semester, course_branch FROM users LIMIT 5;

SELECT 'COURSES RECORDS:' as table_info;
SELECT COUNT(*) as count FROM courses;
SELECT id, title, subject, semester, level, professor_name, course_code FROM courses LIMIT 5;

SELECT 'RESOURCE REQUESTS:' as table_info;
SELECT COUNT(*) as count FROM resource_requests;
SELECT id, title, subject, status, created_at FROM resource_requests LIMIT 5;

SELECT 'VIEWS AVAILABLE:' as table_info;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'VIEW';

SELECT 'TRIGGERS AVAILABLE:' as table_info;
SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE();

SELECT '========================================' as section;
SELECT 'All setup complete! You can now:' as message;
SELECT '1. View courses: SELECT * FROM active_courses_view;' as instruction;
SELECT '2. View pending requests: SELECT * FROM pending_requests_view;' as instruction;
SELECT '3. Add more courses through admin panel' as instruction;
SELECT '========================================' as section;
