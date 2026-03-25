# SmartStudent Database Complete Setup Guide

## Overview
This guide will help you create a **clean, professional, normalized database** with:
- ✅ Proper relationships (Foreign Keys)
- ✅ Better data structure
- ✅ Automatic timestamps
- ✅ Useful views for querying
- ✅ Triggers for automation
- ✅ Data integrity constraints

---

## STEP 1: Backup Your Current Data (IMPORTANT!)
Before making changes, backup your existing data:

```sql
-- Backup existing courses
CREATE TABLE courses_backup AS SELECT * FROM courses;

-- Backup existing users
CREATE TABLE users_backup AS SELECT * FROM users;

-- Backup existing requests
CREATE TABLE resource_requests_backup AS SELECT * FROM resource_requests;

-- Backup existing admin
CREATE TABLE admin_backup AS SELECT * FROM admin;
```

---

## STEP 2: Drop Old Tables (if starting fresh)
⚠️ **ONLY if you want to completely redesign:**

```sql
-- Drop tables in order (reverse dependency order)
DROP TABLE IF EXISTS resource_requests;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admin;

-- Optional: Drop backup tables later
-- DROP TABLE IF EXISTS courses_backup;
-- DROP TABLE IF EXISTS users_backup;
-- DROP TABLE IF EXISTS resource_requests_backup;
-- DROP TABLE IF EXISTS admin_backup;
```

---

## STEP 3: Create Improved Admin Table

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
);

-- Insert admin user
INSERT INTO admin (name, email, password, department) 
VALUES ('Admin User', 'fathimasafrina57@gmail.com', 'admin123', 'Administration');
```

**What's New:**
- `name` - Admin full name
- `phone` - Contact number
- `department` - Which department they manage
- `is_active` - Soft delete (don't physically delete)
- `updated_at` - Track when record was last updated
- `INDEX` - Makes searches faster

---

## STEP 4: Create Improved Users Table

```sql
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
);
```

**What's New:**
- `first_name`, `last_name` - Better than just username
- `phone` - Contact details
- `semester` - Current semester (1,2,3,4,5,6,7,8)
- `course_branch` - Branch (CSE, ECE, Mechanical, etc)
- `is_active` - Deactivate without deleting
- Indexes for faster searches

---

## STEP 5: Create Improved Courses Table

```sql
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  subject VARCHAR(100) NOT NULL,
  semester INT,
  level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
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
  FOREIGN KEY (created_by) REFERENCES admin(id),
  INDEX idx_subject (subject),
  INDEX idx_semester (semester),
  INDEX idx_department (department)
);
```

**What's New:**
- `credits` - Academic credits
- `professor_name` - Who teaches this
- `professor_email` - Contact professor
- `prerequisites` - What courses needed before
- `course_code` - Unique course identifier
- `department` - Which department offers it
- `created_by` - Which admin added it (Foreign Key to admin table)
- `is_active` - Hide/show courses
- Multiple indexes for efficient filtering

---

## STEP 6: Create Improved Resource Requests Table

```sql
CREATE TABLE resource_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
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
);
```

**What's New:**
- `user_id` - Who requested it (links to users)
- `type` - Better categories (Notes, Video, PDF, etc)
- `course_id` - Links approved request to a course
- `approved_by` - Which admin approved it
- `approval_comment` - Admin feedback
- `approved_at` - When it was approved
- Foreign Keys with cascading rules
- Better indexes

---

## STEP 7: Create Useful VIEWS (for easier querying)

### View 1: Get all active courses with admin info
```sql
CREATE VIEW active_courses_view AS
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
  a.name as created_by_admin,
  a.email as admin_email,
  c.created_at
FROM courses c
LEFT JOIN admin a ON c.created_by = a.id
WHERE c.is_active = TRUE
ORDER BY c.semester, c.subject;
```

**Use this to:** See all active courses with who created them

---

### View 2: Get pending resource requests with student info
```sql
CREATE VIEW pending_requests_view AS
SELECT 
  r.id,
  r.title,
  r.subject,
  r.semester,
  r.type,
  r.message,
  CONCAT(u.first_name, ' ', u.last_name) as student_name,
  u.email as student_email,
  u.semester as student_semester,
  u.course_branch,
  r.created_at
FROM resource_requests r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;
```

**Use this to:** Admin sees all pending requests with student details

---

### View 3: Get approved requests that became courses
```sql
CREATE VIEW approved_requests_with_courses AS
SELECT 
  r.id as request_id,
  r.title,
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
```

**Use this to:** Track which requests became courses

---

### View 4: Student dashboard - their courses and pending requests
```sql
CREATE VIEW student_dashboard AS
SELECT 
  u.id as student_id,
  CONCAT(u.first_name, ' ', u.last_name) as student_name,
  u.semester,
  COUNT(DISTINCT rr.id) as pending_requests,
  COUNT(DISTINCT c.id) as available_courses
FROM users u
LEFT JOIN resource_requests rr ON u.id = rr.user_id AND rr.status = 'pending'
LEFT JOIN courses c ON c.semester = u.semester AND c.is_active = TRUE
WHERE u.is_active = TRUE AND u.role = 'student'
GROUP BY u.id, u.first_name, u.last_name, u.semester;
```

**Use this to:** See student engagement metrics

---

## STEP 8: Create TRIGGERS (for automation)

### Trigger 1: Auto-update course updated_at timestamp
```sql
CREATE TRIGGER course_update_timestamp
BEFORE UPDATE ON courses
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;
```

**What it does:** Automatically sets `updated_at` when course is modified

---

### Trigger 2: Prevent deleting active courses
```sql
CREATE TRIGGER prevent_active_course_delete
BEFORE DELETE ON courses
FOR EACH ROW
BEGIN
  IF OLD.is_active = TRUE THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete active courses. Set is_active = FALSE first.';
  END IF;
END;
```

**What it does:** Prevents accidental deletion of active courses

---

### Trigger 3: Auto-update request updated_at
```sql
CREATE TRIGGER request_update_timestamp
BEFORE UPDATE ON resource_requests
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;
```

**What it does:** Auto-update timestamp when request status changes

---

### Trigger 4: Log when request is approved (optional - requires audit table)
```sql
-- First create audit table
CREATE TABLE request_approvals_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT,
  approved_by INT,
  approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_comment TEXT
);

-- Then create trigger
CREATE TRIGGER log_request_approval
AFTER UPDATE ON resource_requests
FOR EACH ROW
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO request_approvals_audit (request_id, approved_by, approval_comment)
    VALUES (NEW.id, NEW.approved_by, NEW.approval_comment);
  END IF;
END;
```

**What it does:** Creates an audit trail of all approvals

---

## STEP 9: Insert Sample Data

### Insert sample users
```sql
INSERT INTO users (username, email, password, first_name, last_name, phone, semester, course_branch)
VALUES 
('safrina', 'safrina@email.com', 'password123', 'Safrina', 'Fathima', '9876543210', 4, 'CSE'),
('john', 'john@email.com', 'password123', 'John', 'Doe', '9876543211', 2, 'ECE'),
('jane', 'jane@email.com', 'password123', 'Jane', 'Smith', '9876543212', 3, 'Mechanical'),
('adam', 'adam@email.com', 'password123', 'Adam', 'Wilson', '9876543213', 1, 'Civil');
```

---

### Insert sample courses
```sql
INSERT INTO courses (title, description, subject, semester, level, duration, credits, professor_name, professor_email, prerequisites, course_code, department, created_by)
VALUES 
('Data Structures and Algorithms', 'Master DSA with Python', 'Computer Science', 2, 'Intermediate', '12 weeks', 4, 'Dr. Rajesh Kumar', 'rajesh@college.edu', 'Basic Programming', 'CS201', 'IT', 1),
('Web Development with MERN', 'Full Stack Development', 'Web Technology', 3, 'Intermediate', '8 weeks', 3, 'Prof. Amit Singh', 'amit@college.edu', 'JavaScript Basics', 'WD301', 'IT', 1),
('Database Management Systems', 'SQL and Query Optimization', 'Database', 3, 'Advanced', '6 weeks', 3, 'Dr. Aisha Patel', 'aisha@college.edu', 'DS Basics', 'DB301', 'IT', 1),
('Machine Learning Basics', 'Introduction to ML with Python', 'AI/ML', 4, 'Advanced', '10 weeks', 4, 'Prof. Vikram Reddy', 'vikram@college.edu', 'Statistics, Linear Algebra', 'ML401', 'IT', 1);
```

---

### Insert sample resource requests
```sql
INSERT INTO resource_requests (user_id, title, subject, semester, type, message, status)
VALUES 
(1, 'Advanced DSA Notes', 'Computer Science', 4, 'PDF', 'Need comprehensive DSA notes for interview prep', 'pending'),
(2, 'React Tutorial Videos', 'Web Technology', 2, 'Video', 'Looking for video tutorials on React hooks', 'pending'),
(3, 'Database Design Patterns', 'Database', 3, 'Book', 'Recommend books on database design', 'pending');
```

---

## STEP 10: Verify Your Database

### Check all tables exist
```sql
SHOW TABLES;
```

### View table structure
```sql
DESCRIBE admin;
DESCRIBE users;
DESCRIBE courses;
DESCRIBE resource_requests;
```

### Check views
```sql
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';
```

### Test views
```sql
SELECT * FROM active_courses_view;
SELECT * FROM pending_requests_view;
SELECT * FROM approved_requests_with_courses;
SELECT * FROM student_dashboard;
```

---

## STEP 11: Update Your Backend Routes (Quick Changes)

### In `/backend/routes/courseRoutes.js`, change the query:
```javascript
// OLD:
const sql = "SELECT * FROM courses ORDER BY created_at DESC";

// NEW - Use the view instead:
const sql = `
  SELECT id, title, description, subject, semester, level, 
         duration, credits, professor_name, image, created_at 
  FROM active_courses_view 
  ORDER BY created_at DESC
`;
```

---

### In admin requests endpoint, use the view:
```javascript
// To get pending requests (use the view):
const sql = `
  SELECT * FROM pending_requests_view 
  ORDER BY created_at DESC
`;

// When approving, also set approved_by and approved_at:
const approveSql = `
  UPDATE resource_requests 
  SET status = 'approved', 
      approved_by = ?, 
      approved_at = NOW() 
  WHERE id = ?
`;
```

---

## STEP 12: Summary of What You Get

| Feature | Benefit |
|---------|---------|
| **Foreign Keys** | Maintains data integrity |
| **Indexes** | Faster queries |
| **Views** | Simplified querying for frontend |
| **Triggers** | Automatic timestamp updates |
| **is_active fields** | Soft deletes (don't lose data) |
| **Audit Trail** | Track who approved what |
| **Better Fields** | More complete data (professor, credits, etc) |
| **Normalized Schema** | No data duplication |

---

## QUICK REFERENCE: Common Queries

### Get all active courses for a semester
```sql
SELECT * FROM active_courses_view WHERE semester = 3;
```

### Get student's pending requests
```sql
SELECT * FROM pending_requests_view WHERE student_email = 'safrina@email.com';
```

### Count approvals by admin
```sql
SELECT approved_by, COUNT(*) as total_approvals 
FROM resource_requests 
WHERE status = 'approved' 
GROUP BY approved_by;
```

### Get courses by department
```sql
SELECT * FROM active_courses_view WHERE department = 'IT';
```

### Deactivate a course (don't delete it)
```sql
UPDATE courses SET is_active = FALSE WHERE id = 5;
```

---

## ⚠️ IMPORTANT NOTES

1. **Run commands in order** - Dependencies matter (admin before users, users before requests)
2. **Test in MySQL Workbench first** - Copy-paste each command separately
3. **Backup before changing** - STEP 1 is crucial!
4. **Update backend after DB changes** - Adjust route queries to use new field names
5. **Test frontend** - Make sure courses still load correctly

---

## Need Help?
- If a command fails, check the error message
- Most errors are due to:
  - Table doesn't exist yet
  - Duplicate data in UNIQUE columns
  - Foreign key constraint violation
  - Syntax error (check parentheses/commas)

Run this to check for errors:
```sql
SHOW ERRORS;
SHOW WARNINGS;
```

Good luck! Your database will be professional and clean after this. 🚀
