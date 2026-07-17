import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import db from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import resourceRoutes from "./routes/resourceRoute.js";
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
import { startReportScheduler } from "./utils/reportScheduler.js";
dotenv.config();

const app = express();

const ensureExtendedLearningSchema = () => {
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

  columnMigrations.forEach(({ name, definition }) => {
    db.query("SHOW COLUMNS FROM resource_requests LIKE ?", [name], (checkErr, result) => {
      if (checkErr) {
        console.error("⚠️ Schema check warning:", checkErr.message);
        return;
      }

      if (result.length > 0) {
        return;
      }

      db.query(`ALTER TABLE resource_requests ADD COLUMN ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error("⚠️ Schema migration warning:", alterErr.message);
        }
      });
    });
  });

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
    `CREATE TABLE IF NOT EXISTS resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      image_url VARCHAR(500),
      resource_link VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_resources_category (category),
      INDEX idx_resources_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );

  db.query(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    (tableErr) => {
      if (tableErr) {
        console.error("⚠️ Schema migration warning:", tableErr.message);
      }
    }
  );
};

ensureExtendedLearningSchema();

// Expands the role model from 2 roles (student/admin) to 5: users gets
// lecturer/moderator alongside student; admin gets a dept_admin/sysadmin
// tier via a new column. No existing FK relationships change.
const ensureRoleModel = () => {
  db.query("SHOW COLUMNS FROM users LIKE 'role'", (checkErr, result) => {
    if (checkErr) {
      console.error("⚠️ Role schema check warning:", checkErr.message);
      return;
    }

    const currentType = result[0]?.Type || "";
    if (currentType.includes("lecturer") && currentType.includes("moderator")) {
      console.log("✅ users.role already includes lecturer/moderator");
      return;
    }

    db.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('student','lecturer','moderator') DEFAULT 'student'",
      (alterErr) => {
        if (alterErr) {
          console.error("⚠️ Role schema migration warning:", alterErr.message);
        } else {
          console.log("✅ Expanded users.role to student/lecturer/moderator");
        }
      }
    );
  });

  db.query("SHOW COLUMNS FROM admin LIKE 'role'", (checkErr, result) => {
    if (checkErr) {
      console.error("⚠️ Admin role schema check warning:", checkErr.message);
      return;
    }

    if (result.length > 0) {
      console.log("✅ Column 'role' already exists on admin");
      return;
    }

    // Existing admin rows predate the dept_admin/sysadmin split; they were
    // the platform's only administrators, so they become sysadmin here.
    db.query(
      "ALTER TABLE admin ADD COLUMN role ENUM('dept_admin','sysadmin') DEFAULT 'sysadmin'",
      (alterErr) => {
        if (alterErr) {
          console.error("⚠️ Admin role migration warning:", alterErr.message);
        } else {
          console.log("✅ Added role column to admin table (existing admins -> sysadmin)");
        }
      }
    );
  });
};

ensureRoleModel();

// Adds email verification + password reset support to users, and password
// reset support to admin. Self-registered users start unverified; existing
// rows (created before this column existed) are marked verified so nobody
// already using the app gets locked out.
const ensureAuthColumns = () => {
  const userColumns = [
    { name: "email_verified", definition: "email_verified TINYINT(1) DEFAULT 0" },
    { name: "email_verification_token", definition: "email_verification_token VARCHAR(255) NULL" },
    { name: "password_reset_token", definition: "password_reset_token VARCHAR(255) NULL" },
    { name: "password_reset_expires", definition: "password_reset_expires DATETIME NULL" },
  ];

  userColumns.forEach(({ name, definition }) => {
    db.query("SHOW COLUMNS FROM users LIKE ?", [name], (checkErr, result) => {
      if (checkErr) {
        console.error(`⚠️ Auth column check error for users.${name}:`, checkErr.message);
        return;
      }
      if (result.length > 0) return;

      db.query(`ALTER TABLE users ADD COLUMN ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`❌ Failed to add users.${name}:`, alterErr.message);
          return;
        }
        console.log(`✅ Added column 'users.${name}'`);

        if (name === "email_verified") {
          db.query("UPDATE users SET email_verified = 1 WHERE email_verified = 0", (backfillErr) => {
            if (backfillErr) {
              console.error("⚠️ email_verified backfill warning:", backfillErr.message);
            } else {
              console.log("✅ Backfilled existing users as email_verified");
            }
          });
        }
      });
    });
  });

  const adminColumns = [
    { name: "password_reset_token", definition: "password_reset_token VARCHAR(255) NULL" },
    { name: "password_reset_expires", definition: "password_reset_expires DATETIME NULL" },
  ];

  adminColumns.forEach(({ name, definition }) => {
    db.query("SHOW COLUMNS FROM admin LIKE ?", [name], (checkErr, result) => {
      if (checkErr) {
        console.error(`⚠️ Auth column check error for admin.${name}:`, checkErr.message);
        return;
      }
      if (result.length > 0) return;

      db.query(`ALTER TABLE admin ADD COLUMN ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`❌ Failed to add admin.${name}:`, alterErr.message);
        } else {
          console.log(`✅ Added column 'admin.${name}'`);
        }
      });
    });
  });
};

ensureAuthColumns();

// Lecturer-uploaded resources, moderated separately from the existing
// student resource_requests pipeline (which is a request-for-content flow
// with lesson fields) since lecturer uploads are direct, trusted content
// contributions with a different shape and review path.
db.query(
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  (tableErr) => {
    if (tableErr) {
      console.error("⚠️ lecturer_resources migration warning:", tableErr.message);
    } else {
      console.log("✅ lecturer_resources table ready");
    }
  }
);

// ✅ ADD MISSING COLUMNS TO RESOURCES TABLE
const ensureResourcesColumns = () => {
  const columnsToAdd = [
    { name: "description", definition: "description TEXT" },
    { name: "category", definition: "category VARCHAR(100)" },
    { name: "image_url", definition: "image_url VARCHAR(500)" },
    { name: "resource_link", definition: "resource_link VARCHAR(500)" },
  ];

  columnsToAdd.forEach(({ name, definition }) => {
    db.query(`SHOW COLUMNS FROM resources LIKE ?`, [name], (checkErr, result) => {
      if (checkErr) {
        console.error(`⚠️ Column check error for ${name}:`, checkErr.message);
        return;
      }

      if (result.length > 0) {
        console.log(`✅ Column '${name}' already exists`);
        return;
      }

      db.query(`ALTER TABLE resources ADD COLUMN ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`❌ Failed to add column '${name}':`, alterErr.message);
        } else {
          console.log(`✅ Added column '${name}' to resources table`);
        }
      });
    });
  });
};

ensureResourcesColumns();
startReportScheduler();

const seedResources = () => {
  db.query("SELECT COUNT(*) AS count FROM resources", (countErr, countRows) => {
    if (countErr) {
      console.error("❌ Resource seed error:", countErr.message);
      return;
    }

    const resourceCount = countRows[0]?.count || 0;
    console.log(`📊 Current resources in DB: ${resourceCount}`);
    
    if (resourceCount > 0) {
      console.log("✅ Resources already exist, skipping seed");
      return;
    }

    console.log("🌱 Seeding sample resources...");
    const sampleResources = [
      [
        "MDN Web Docs - HTML",
        "Official HTML guide and reference from Mozilla.",
        "Web Development",
        "https://upload.wikimedia.org/wikipedia/commons/6/61/HTML5_logo_and_wordmark.svg",
        "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML",
      ],
      [
        "freeCodeCamp - JavaScript Basics",
        "Free interactive lessons to learn JavaScript fundamentals.",
        "Programming",
        "https://design-style-guide.freecodecamp.org/downloads/fcc_secondary_large.png",
        "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
      ],
      [
        "Khan Academy - Algebra 1",
        "Step-by-step algebra lessons, practice, and quizzes.",
        "Mathematics",
        "https://upload.wikimedia.org/wikipedia/commons/4/43/Khan_Academy_logo.svg",
        "https://www.khanacademy.org/math/algebra",
      ],
      [
        "Google Digital Garage",
        "Free courses in digital skills, career growth, and productivity tools.",
        "Career Skills",
        "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
        "https://grow.google/intl/en_in/",
      ],
      [
        "Coursera - AI for Everyone",
        "Beginner-friendly introduction to artificial intelligence concepts.",
        "Artificial Intelligence",
        "https://upload.wikimedia.org/wikipedia/commons/e/e5/Coursera_logo.svg",
        "https://www.coursera.org/learn/ai-for-everyone",
      ],
    ];

    db.query(
      `INSERT INTO resources (title, description, category, image_url, resource_link)
       VALUES ?`,
      [sampleResources],
      (insertErr) => {
        if (insertErr) {
          console.error("❌ Resource seed error:", insertErr.message);
        } else {
          console.log("✅ Sample resources seeded successfully");
        }
      }
    );
  });
};

// Self-registration only creates students, so lecturer/moderator accounts
// have no signup path yet - seed one of each with known credentials so the
// role-gated dashboards are demoable without a manual DB insert.
const seedDemoRoleAccounts = () => {
  const demoAccounts = [
    { username: "demo.lecturer", email: "demo.lecturer@smartstudent.dev", role: "lecturer" },
    { username: "demo.moderator", email: "demo.moderator@smartstudent.dev", role: "moderator" },
  ];

  demoAccounts.forEach(async ({ username, email, role }) => {
    db.query("SELECT id FROM users WHERE username = ?", [username], async (checkErr, rows) => {
      if (checkErr) {
        console.error(`⚠️ Demo account check error for ${username}:`, checkErr.message);
        return;
      }
      if (rows.length > 0) return;

      const hashedPassword = await bcrypt.hash("Demo@12345", 10);
      db.query(
        "INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, 1)",
        [username, email, hashedPassword, role],
        (insertErr) => {
          if (insertErr) {
            console.error(`❌ Failed to seed demo ${role}:`, insertErr.message);
          } else {
            console.log(`✅ Seeded demo ${role} account: ${username} / Demo@12345`);
          }
        }
      );
    });
  });
};

// ✅ Configure CORS for the frontend app
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

// Seed resources/demo accounts after a short delay to ensure DB is ready
setTimeout(() => {
  seedResources();
  seedDemoRoleAccounts();
}, 1000);

app.use(express.json());
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

// 🔓 expose images folder
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/images", express.static("images"));
app.use("/lesson-files", express.static("lesson-files"));

// ROUTES (ALWAYS BEFORE listen)
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
});