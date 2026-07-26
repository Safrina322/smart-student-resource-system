import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import db, { queryAsync } from "./db.js";
import { setIo } from "./utils/socket.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import adminCourseRoutes from "./routes/adminCourseRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import adminRequestRoutes from "./routes/adminRequestRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import userLearningRoutes from "./routes/userLearningRoutes.js";
import popularResourcesRoutes from "./routes/popularResourcesRoutes.js";
import userNotificationRoutes from "./routes/userNotificationRoutes.js";
import adminAuditRoutes from "./routes/adminAuditRoutes.js";
import lecturerResourceRoutes from "./routes/lecturerResourceRoutes.js";
import moderationRoutes from "./routes/moderationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import resourceHubRoutes from "./routes/resourceHubRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { startReportScheduler } from "./utils/reportScheduler.js";
dotenv.config();

const app = express();

// admin/users/courses/resource_requests were historically created once by
// hand (see database_setup.sql) rather than by this file, so a brand-new
// database (e.g. a freshly provisioned host) never got them. Every other
// migration below assumes these four already exist, so this must finish
// before anything else runs - hence the top-level await.
const ensureFoundationalSchema = async () => {
  await queryAsync(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await queryAsync(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await queryAsync(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await queryAsync(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log("✅ Foundational tables (admin, users, courses, resource_requests) ready");
};

await ensureFoundationalSchema();

// Shared by every "add this column if it's missing" migration below - was
// duplicated inline four times (once per table) as a SHOW COLUMNS + ALTER
// TABLE callback pair. Returns whether it actually added the column, so
// callers can gate one-time follow-up work (e.g. a backfill) on that.
const ensureColumn = async (table, name, definition) => {
  const existing = await queryAsync(`SHOW COLUMNS FROM ${table} LIKE ?`, [name]);
  if (existing.length > 0) return false;
  await queryAsync(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  return true;
};

// Runs one CREATE TABLE IF NOT EXISTS, logging success/failure the same way
// every migration below needs to - a failure here is logged and swallowed
// rather than thrown, matching this file's existing "best effort, don't
// block boot over an optional table" tolerance.
const runMigration = async (successMessage, sql) => {
  try {
    await queryAsync(sql);
    console.log(successMessage);
  } catch (err) {
    console.error("⚠️ Schema migration warning:", err.message);
  }
};

const ensureExtendedLearningSchema = async () => {
  const columnMigrations = [
    { name: "description", definition: "description TEXT" },
    { name: "level", definition: "level VARCHAR(50)" },
    { name: "duration", definition: "duration VARCHAR(50)" },
    { name: "image", definition: "image VARCHAR(255)" },
    { name: "lesson_title", definition: "lesson_title VARCHAR(255)" },
    { name: "lesson_description", definition: "lesson_description TEXT" },
    { name: "resource_url", definition: "resource_url VARCHAR(500)" },
    { name: "lesson_order", definition: "lesson_order INT DEFAULT 1" },
  ];

  for (const { name, definition } of columnMigrations) {
    try {
      await ensureColumn("resource_requests", name, definition);
    } catch (err) {
      console.error("⚠️ Schema migration warning:", err.message);
    }
  }

  await runMigration(
    "✅ course_lessons table ready",
    `CREATE TABLE IF NOT EXISTS course_lessons (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ analytics_events table ready",
    `CREATE TABLE IF NOT EXISTS analytics_events (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ user_learning_progress table ready",
    `CREATE TABLE IF NOT EXISTS user_learning_progress (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ request_status_history table ready",
    `CREATE TABLE IF NOT EXISTS request_status_history (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ user_notifications table ready",
    `CREATE TABLE IF NOT EXISTS user_notifications (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ admin_audit_logs table ready",
    `CREATE TABLE IF NOT EXISTS admin_audit_logs (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  // report_generation_history FKs to report_schedules, so this one must be
  // created first - preserved by simply awaiting them in this order.
  await runMigration(
    "✅ report_schedules table ready",
    `CREATE TABLE IF NOT EXISTS report_schedules (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ report_generation_history table ready",
    `CREATE TABLE IF NOT EXISTS report_generation_history (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

// Expands the role model from 2 roles (student/admin) to 5: users gets
// lecturer/moderator alongside student; admin gets a dept_admin/sysadmin
// tier via a new column. No existing FK relationships change.
const ensureRoleModel = async () => {
  try {
    const userRoleColumn = await queryAsync("SHOW COLUMNS FROM users LIKE 'role'");
    const currentType = userRoleColumn[0]?.Type || "";
    if (currentType.includes("lecturer") && currentType.includes("moderator")) {
      console.log("✅ users.role already includes lecturer/moderator");
    } else {
      await queryAsync(
        "ALTER TABLE users MODIFY COLUMN role ENUM('student','lecturer','moderator') DEFAULT 'student'"
      );
      console.log("✅ Expanded users.role to student/lecturer/moderator");
    }
  } catch (err) {
    console.error("⚠️ Role schema migration warning:", err.message);
  }

  try {
    const adminRoleColumn = await queryAsync("SHOW COLUMNS FROM admin LIKE 'role'");
    if (adminRoleColumn.length > 0) {
      console.log("✅ Column 'role' already exists on admin");
    } else {
      // Existing admin rows predate the dept_admin/sysadmin split; they were
      // the platform's only administrators, so they become sysadmin here.
      await queryAsync(
        "ALTER TABLE admin ADD COLUMN role ENUM('dept_admin','sysadmin') DEFAULT 'sysadmin'"
      );
      console.log("✅ Added role column to admin table (existing admins -> sysadmin)");
    }
  } catch (err) {
    console.error("⚠️ Admin role migration warning:", err.message);
  }
};

// Adds email verification + password reset support to users, and password
// reset support to admin. Self-registered users start unverified; existing
// rows (created before this column existed) are marked verified so nobody
// already using the app gets locked out.
const ensureAuthColumns = async () => {
  const userColumns = [
    { name: "email_verified", definition: "email_verified TINYINT(1) DEFAULT 0" },
    { name: "email_verification_token", definition: "email_verification_token VARCHAR(255) NULL" },
    { name: "password_reset_token", definition: "password_reset_token VARCHAR(255) NULL" },
    { name: "password_reset_expires", definition: "password_reset_expires DATETIME NULL" },
  ];

  for (const { name, definition } of userColumns) {
    let added = false;
    try {
      added = await ensureColumn("users", name, definition);
      if (added) console.log(`✅ Added column 'users.${name}'`);
    } catch (err) {
      console.error(`❌ Failed to add users.${name}:`, err.message);
      continue;
    }

    if (added && name === "email_verified") {
      try {
        await queryAsync("UPDATE users SET email_verified = 1 WHERE email_verified = 0");
        console.log("✅ Backfilled existing users as email_verified");
      } catch (err) {
        console.error("⚠️ email_verified backfill warning:", err.message);
      }
    }
  }

  const adminColumns = [
    { name: "password_reset_token", definition: "password_reset_token VARCHAR(255) NULL" },
    { name: "password_reset_expires", definition: "password_reset_expires DATETIME NULL" },
  ];

  for (const { name, definition } of adminColumns) {
    try {
      const added = await ensureColumn("admin", name, definition);
      if (added) console.log(`✅ Added column 'admin.${name}'`);
    } catch (err) {
      console.error(`❌ Failed to add admin.${name}:`, err.message);
    }
  }
};

// Lecturer-uploaded resources, moderated separately from the existing
// student resource_requests pipeline (which is a request-for-content flow
// with lesson fields) since lecturer uploads are direct, trusted content
// contributions with a different shape and review path.
const ensureResourceHubSchema = async () => {
  await runMigration(
    "✅ lecturer_resources table ready",
    `CREATE TABLE IF NOT EXISTS lecturer_resources (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  // Comments (with one-level-or-deeper replies via parent_comment_id),
  // ratings (one per user per resource, upserted), and bookmarks for the
  // student-facing resource hub built on top of lecturer_resources - all FK
  // to it, so this function must run after the table above is created,
  // preserved here by simply awaiting them in order.
  await runMigration(
    "✅ resource_comments table ready",
    `CREATE TABLE IF NOT EXISTS resource_comments (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ resource_ratings table ready",
    `CREATE TABLE IF NOT EXISTS resource_ratings (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await runMigration(
    "✅ resource_bookmarks table ready",
    `CREATE TABLE IF NOT EXISTS resource_bookmarks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resource_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES lecturer_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_resource_user_bookmark (resource_id, user_id),
      INDEX idx_resource_bookmarks_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

const ensureSearchAndAiSchema = async () => {
  await runMigration(
    "✅ search_logs table ready",
    `CREATE TABLE IF NOT EXISTS search_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      query VARCHAR(255) NOT NULL,
      user_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_search_logs_query (query),
      INDEX idx_search_logs_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  // FKs to lecturer_resources, so this must run after ensureResourceHubSchema.
  await runMigration(
    "✅ ai_content_cache table ready",
    `CREATE TABLE IF NOT EXISTS ai_content_cache (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resource_id INT NOT NULL,
      content_type VARCHAR(30) NOT NULL,
      content_json LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES lecturer_resources(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_resource_content_type (resource_id, content_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
};

// Self-registration only creates students, so lecturer/moderator accounts
// have no signup path yet - seed one of each with known credentials so the
// role-gated dashboards are demoable without a manual DB insert.
const seedDemoRoleAccounts = async () => {
  const demoAccounts = [
    { username: "demo.lecturer", email: "demo.lecturer@smartstudent.dev", role: "lecturer" },
    { username: "demo.moderator", email: "demo.moderator@smartstudent.dev", role: "moderator" },
  ];

  for (const { username, email, role } of demoAccounts) {
    try {
      const rows = await queryAsync("SELECT id FROM users WHERE username = ?", [username]);
      if (rows.length > 0) continue;

      const hashedPassword = await bcrypt.hash("Demo@12345", 10);
      await queryAsync(
        "INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, 1)",
        [username, email, hashedPassword, role]
      );
      console.log(`✅ Seeded demo ${role} account: ${username} / Demo@12345`);
    } catch (err) {
      console.error(`❌ Failed to seed demo ${role}:`, err.message);
    }
  }
};

// The only sysadmin account previously came from a one-time manual run of
// database_setup.sql, so a fresh database (e.g. a newly provisioned host)
// had no way to log into the admin panel at all until this ran.
const seedDefaultAdmin = async () => {
  try {
    const rows = await queryAsync("SELECT id FROM admin LIMIT 1");
    if (rows.length > 0) return;

    const hashedPassword = await bcrypt.hash("admin123", 10);
    await queryAsync(
      "INSERT INTO admin (name, email, password, department, role) VALUES (?, ?, ?, ?, ?)",
      ["Admin User", "fathimasafrina57@gmail.com", hashedPassword, "Administration", "sysadmin"]
    );
    console.log("✅ Seeded default admin account: fathimasafrina57@gmail.com / admin123");
  } catch (err) {
    console.error("❌ Failed to seed default admin:", err.message);
  }
};

// ✅ Configure CORS for the frontend app
// Vite picks the next free port (5174, 5175, ...) whenever 5173 is already
// taken by another process, which silently breaks a fixed-origin CORS check
// with a generic "network error" in the browser. In development, allow any
// localhost port instead of hardcoding one; production still locks to the
// configured FRONTEND_URL.
const isProduction = process.env.NODE_ENV === "production";
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin / non-browser requests (curl, server-to-server)
    if (origin === process.env.FRONTEND_URL) return callback(null, true);
    if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
// crossOriginResourcePolicy is relaxed because the frontend (port 5173) and
// this API/static file server (port 5000) are different origins; helmet's
// default "same-origin" policy would block the frontend from loading
// /images and /lesson-files.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors(corsOptions));

// Each of these previously ran fire-and-forget (a bare function call, not
// awaited), so the server could start accepting requests - and the seed
// functions below could run - before a table/column they depend on had
// actually finished being created. Awaiting them in order (each function
// internally awaits its own steps in the order they must happen, e.g.
// report_generation_history after report_schedules) closes that race.
await ensureExtendedLearningSchema();
await ensureRoleModel();
await ensureAuthColumns();
await ensureResourceHubSchema();
await ensureSearchAndAiSchema();

startReportScheduler();

await seedDemoRoleAccounts();
await seedDefaultAdmin();

console.log("✅ Database schema and seed data ready");

// Hosted free-tier MySQL (e.g. Aiven) auto-powers-off after a period of no
// activity, which then 404s every request until someone manually resumes it
// in the provider dashboard. A cheap periodic query keeps the connection
// active so the database never looks idle. No-op cost on local dev.
setInterval(() => {
  db.query("SELECT 1", (err) => {
    if (err) console.error("⚠️ Keep-alive ping failed:", err.message);
  });
}, 4 * 60 * 1000);

app.use(express.json());
app.use("/api/health", healthRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin/requests", adminRequestRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/user", userLearningRoutes);
app.use("/api/popular", popularResourcesRoutes);
app.use("/api/notifications", userNotificationRoutes);
app.use("/api/admin/audit", adminAuditRoutes);
app.use("/api/lecturer/resources", lecturerResourceRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/resource-hub", resourceHubRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/ai", aiRoutes);

// 🔓 expose images folder
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/images", express.static("images"));
app.use("/lesson-files", express.static("lesson-files"));

// ROUTES (ALWAYS BEFORE listen)
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

// Keep API errors JSON-only so frontend does not receive HTML error pages.
app.use("/api", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error("❌ API Error:", err);
  }
  res.status(statusCode).json({ message: err.message || "Internal server error" });
});




// START SERVER (LAST)
// Socket.io needs the raw HTTP server (not the Express app) so it can
// upgrade connections to WebSockets on the same port.
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: corsOptions.origin, credentials: false },
});

// Only student-side (users table) tokens are accepted - notifications are
// only ever addressed to users.id right now, so there's nothing for an
// admin-token connection to subscribe to.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) return next(new Error("Unauthorized"));
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
});

setIo(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
});