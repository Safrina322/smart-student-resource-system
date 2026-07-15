# SmartStudent SQL Study Guide

This file collects SQL used in this project for learning.

## 1) Setup and Migration SQL (DDL + data migration)
Source: backend/database_setup.sql

### 1.1 Backup and reset
```sql
CREATE TABLE IF NOT EXISTS courses_backup AS SELECT * FROM courses WHERE 1=0;
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users WHERE 1=0;
CREATE TABLE IF NOT EXISTS resource_requests_backup AS SELECT * FROM resource_requests WHERE 1=0;
CREATE TABLE IF NOT EXISTS admin_backup AS SELECT * FROM admin WHERE 1=0;

INSERT INTO courses_backup SELECT * FROM courses;
INSERT INTO users_backup SELECT * FROM users;
INSERT INTO resource_requests_backup SELECT * FROM resource_requests;
INSERT INTO admin_backup SELECT * FROM admin;

DROP TABLE IF EXISTS resource_requests;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admin;
```
Use: Back up old tables, then recreate improved schema.

### 1.2 Core tables
```sql
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

CREATE TABLE resource_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  semester INT,
  type ENUM('Notes', 'Video', 'PDF', 'Book', 'Link') DEFAULT 'Notes',
  level VARCHAR(50) DEFAULT 'Beginner',
  duration VARCHAR(50),
  image VARCHAR(255),
  lesson_title VARCHAR(255),
  lesson_description TEXT,
  resource_url VARCHAR(500),
  lesson_order INT DEFAULT 1,
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

CREATE TABLE course_lessons (
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

CREATE TABLE IF NOT EXISTS request_approvals_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT,
  approved_by INT,
  approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_comment TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
Use: Main app entities and relationships.

### 1.3 Views
```sql
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
```
Use: Ready-to-query virtual tables for dashboards.

### 1.4 Triggers
```sql
DELIMITER $$
CREATE TRIGGER course_update_timestamp
BEFORE UPDATE ON courses
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER request_update_timestamp
BEFORE UPDATE ON resource_requests
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

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
```
Use: Automatic timestamping, safety checks, and approval audit logging.

## 2) Runtime schema migrations and seed SQL
Source: backend/index.js

```sql
SHOW COLUMNS FROM resource_requests LIKE ?;
ALTER TABLE resource_requests ADD COLUMN ${definition};

CREATE TABLE IF NOT EXISTS course_lessons (...);
CREATE TABLE IF NOT EXISTS analytics_events (...);
CREATE TABLE IF NOT EXISTS user_learning_progress (...);
CREATE TABLE IF NOT EXISTS request_status_history (...);
CREATE TABLE IF NOT EXISTS user_notifications (...);
CREATE TABLE IF NOT EXISTS admin_audit_logs (...);
CREATE TABLE IF NOT EXISTS resources (...);

SELECT COUNT(*) AS count FROM resources;
INSERT INTO resources (title, description, category, image_url, resource_link) VALUES ?;
```
Use: Ensure required tables/columns exist when server boots, and seed starter resources.

## 3) Authentication SQL
Sources: backend/routes/authRoutes.js, backend/routes/adminAuthRoutes.js

```sql
INSERT INTO users (username, email, password) VALUES (?, ?, ?);
SELECT * FROM users WHERE username = ?;
UPDATE users SET password = ? WHERE id = ?;

SELECT * FROM admin WHERE email = ? AND password = ?;
```
Use: Register/login flows for students and admins.

## 4) Course and lesson SQL
Sources: backend/routes/courseRoutes.js, backend/routes/adminCourseRoutes.js

```sql
SELECT * FROM courses ORDER BY created_at DESC;
SELECT * FROM courses WHERE id = ? LIMIT 1;
SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order ASC, created_at ASC;

INSERT INTO courses (title, description, subject, level, duration, image)
VALUES (?, ?, ?, ?, ?, ?);

INSERT INTO course_lessons
(course_id, lesson_title, lesson_description, resource_type, resource_url, lesson_order)
VALUES (?, ?, ?, ?, ?, ?);

UPDATE course_lessons
SET lesson_title = ?, lesson_description = ?, resource_type = ?, resource_url = ?, lesson_order = ?
WHERE id = ?;

DELETE FROM course_lessons WHERE id = ?;
```
Use: Course listing and admin lesson management.

## 5) Resource request SQL (student + admin)
Sources: backend/routes/requestRoutes.js, backend/routes/adminRequestRoutes.js

```sql
INSERT INTO request_status_history (request_id, status, note, changed_by_admin_id)
VALUES (?, ?, ?, ?);

SELECT id FROM resource_requests
WHERE title=? AND subject=? AND semester=? AND type=? AND status='pending';

INSERT INTO resource_requests
(user_id, title, description, subject, semester, level, duration, type, message, image, lesson_title, lesson_description, resource_url, lesson_order, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending');

SELECT
  rr.id,
  rr.title,
  rr.subject,
  rr.semester,
  rr.type,
  rr.status,
  rr.message,
  rr.created_at,
  rr.updated_at,
  rr.course_id,
  c.title AS course_title
FROM resource_requests rr
LEFT JOIN courses c ON c.id = rr.course_id
WHERE rr.user_id = ?
ORDER BY rr.created_at DESC;

SELECT
  h.id,
  h.request_id,
  h.status,
  h.note,
  h.changed_by_admin_id,
  h.changed_at
FROM request_status_history h
WHERE h.request_id IN (?)
ORDER BY h.changed_at ASC;

SELECT * FROM resource_requests WHERE status='pending';

SELECT rr.*, u.email AS user_email, u.username AS username
FROM resource_requests rr
LEFT JOIN users u ON rr.user_id = u.id
WHERE rr.id=?;

SELECT id FROM courses WHERE title = ? AND subject = ? LIMIT 1;
UPDATE resource_requests SET status='approved', course_id=? WHERE id=?;
SELECT id FROM courses WHERE title = ? LIMIT 1;
INSERT INTO courses (title, description, subject, level, duration, image) VALUES (?, ?, ?, ?, ?, ?);

INSERT INTO course_lessons
(course_id, lesson_title, lesson_description, resource_type, resource_url, lesson_order)
VALUES (?, ?, ?, ?, ?, ?);

UPDATE resource_requests SET status='rejected' WHERE id=?;
```
Use: Submit, review, approve, reject, and track request timeline.

## 6) Analytics SQL
Sources: backend/routes/analyticsRoutes.js, backend/routes/adminAnalyticsRoutes.js

```sql
INSERT INTO analytics_events
(user_id, event_type, course_id, lesson_id, resource_type, metadata)
VALUES (?, ?, ?, ?, ?, ?);

SELECT COUNT(*) AS count FROM resource_requests WHERE status='pending';

SELECT COUNT(*) AS count
FROM resource_requests
WHERE status='approved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

SELECT COUNT(*) AS count
FROM analytics_events
WHERE event_type='resource_open' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

SELECT subject, COUNT(*) AS count
FROM courses
WHERE subject IS NOT NULL AND subject != ''
GROUP BY subject
ORDER BY count DESC
LIMIT 1;

SELECT resource_type, COUNT(*) AS count
FROM course_lessons
GROUP BY resource_type
ORDER BY count DESC
LIMIT 1;

SELECT DATE(updated_at) AS day, COUNT(*) AS count
FROM resource_requests
WHERE status='approved' AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
GROUP BY DATE(updated_at)
ORDER BY day ASC;

SELECT DATE(created_at) AS day, COUNT(*) AS count
FROM analytics_events
WHERE event_type='resource_open' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
GROUP BY DATE(created_at)
ORDER BY day ASC;

SELECT subject, COUNT(*) AS count
FROM courses
WHERE subject IS NOT NULL AND subject != ''
GROUP BY subject
ORDER BY count DESC
LIMIT 5;
```
Use: Admin dashboard totals and trend charts.

## 7) Popular and trending SQL
Source: backend/routes/popularResourcesRoutes.js

```sql
SELECT
  c.id,
  c.title,
  c.subject,
  c.level,
  c.image,
  c.description,
  COUNT(DISTINCT ae.id) as total_views,
  COUNT(DISTINCT ae.user_id) as unique_users,
  (COUNT(DISTINCT ae.id) * 1.0 + COUNT(DISTINCT rr.id) * 2.5) as popularity_score
FROM courses c
LEFT JOIN analytics_events ae ON c.id = ae.course_id
  AND ae.event_type IN ('resource_open', 'course_access')
LEFT JOIN resource_requests rr ON c.id = rr.course_id
  AND rr.status IN ('approved', 'pending')
GROUP BY c.id, c.title, c.subject, c.level, c.image, c.description
HAVING popularity_score > 0
ORDER BY popularity_score DESC, total_views DESC
LIMIT 10;

SELECT
  cl.id,
  cl.lesson_title,
  cl.lesson_description,
  cl.resource_type,
  cl.lesson_order,
  COUNT(DISTINCT ae.id) as view_count,
  COUNT(DISTINCT ae.user_id) as unique_users
FROM course_lessons cl
LEFT JOIN analytics_events ae ON cl.id = ae.lesson_id
  AND ae.event_type = 'resource_open'
  AND ae.course_id = ?
WHERE cl.course_id = ?
GROUP BY cl.id, cl.lesson_title, cl.lesson_description, cl.resource_type, cl.lesson_order
ORDER BY view_count DESC, cl.lesson_order ASC
LIMIT 5;

SELECT
  c.id,
  c.title,
  c.subject,
  c.image,
  COUNT(DISTINCT ae.id) as recent_views,
  COUNT(DISTINCT ae.user_id) as unique_users,
  MAX(ae.created_at) as last_accessed
FROM courses c
LEFT JOIN analytics_events ae ON c.id = ae.course_id
  AND ae.event_type IN ('resource_open', 'course_access')
  AND ae.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
WHERE c.id IN (
  SELECT DISTINCT course_id FROM analytics_events
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
)
GROUP BY c.id, c.title, c.subject, c.image
ORDER BY recent_views DESC
LIMIT 6;
```
Use: Ranking logic for most popular and trending content.

## 8) Resource listing SQL
Sources: backend/routes/resourceRoute.js, backend/routes/resources.js

```sql
SELECT
  id,
  title,
  COALESCE(description, '') AS description,
  COALESCE(category, subject, 'General') AS category,
  CASE
    WHEN image_url IS NOT NULL AND image_url <> '' THEN image_url
    ELSE NULL
  END AS image_url,
  COALESCE(resource_link, file_url, '') AS resource_link,
  created_at
FROM resources
ORDER BY created_at DESC
LIMIT 20;

SELECT * FROM resources ORDER BY created_at DESC;

INSERT INTO resources
(title, description, category, image_url, resource_link)
VALUES (?, ?, ?, ?, ?);
```
Use: Public or protected resources list and create-resource endpoint.

## 9) Notifications SQL
Sources: backend/utils/notifications.js, backend/routes/userNotificationRoutes.js

```sql
INSERT INTO user_notifications (user_id, type, title, message, meta)
VALUES (?, ?, ?, ?, ?);

SELECT id, type, title, message, meta, is_read, created_at, read_at
FROM user_notifications
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 30;

UPDATE user_notifications
SET is_read = 1, read_at = NOW()
WHERE id = ? AND user_id = ?;

UPDATE user_notifications
SET is_read = 1, read_at = NOW()
WHERE user_id = ? AND is_read = 0;
```
Use: Store and mark notifications.

## 10) Learning progress SQL
Source: backend/routes/userLearningRoutes.js

```sql
INSERT INTO user_learning_progress (user_id, course_id, lesson_id, last_accessed_at, created_at)
VALUES (?, ?, ?, NOW(), NOW())
ON DUPLICATE KEY UPDATE
lesson_id = COALESCE(?, lesson_id),
last_accessed_at = NOW();

SELECT
  ulp.id,
  ulp.course_id,
  ulp.lesson_id,
  ulp.last_accessed_at,
  c.title as course_title,
  c.subject,
  c.image,
  cl.lesson_title,
  cl.id as current_lesson_id
FROM user_learning_progress ulp
JOIN courses c ON ulp.course_id = c.id
LEFT JOIN course_lessons cl ON cl.id = ulp.lesson_id
WHERE ulp.user_id = ?
ORDER BY ulp.last_accessed_at DESC
LIMIT 1;

SELECT
  ae.id,
  ae.course_id,
  ae.lesson_id,
  ae.resource_type,
  ae.created_at,
  c.title as course_title,
  cl.lesson_title
FROM analytics_events ae
JOIN courses c ON ae.course_id = c.id
LEFT JOIN course_lessons cl ON cl.id = ae.lesson_id
WHERE ae.user_id = ?
  AND ae.event_type = 'resource_open'
ORDER BY ae.created_at DESC
LIMIT 5;
```
Use: Continue-learning card and recent activity history.

## 11) Audit log SQL
Source: backend/routes/adminAuditRoutes.js and backend/utils/auditLogger.js

```sql
INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details)
VALUES (?, ?, ?, ?, ?);

SELECT
  l.id,
  l.admin_id,
  a.name AS admin_name,
  a.email AS admin_email,
  l.action_type,
  l.target_type,
  l.target_id,
  l.details,
  l.created_at
FROM admin_audit_logs l
LEFT JOIN admin a ON a.id = l.admin_id
ORDER BY l.created_at DESC
LIMIT 100;
```
Use: Track and display admin actions.

## 12) Extra notes
- Placeholder markers (?) are parameterized values sent from Node.js.
- Dynamic SQL exists in backend/index.js for ALTER TABLE migration.
- There are old commented queries in backend/routes/requestRoutes.js kept as legacy examples.
