import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
};

ensureExtendedLearningSchema();

// ✅ Configure CORS to only allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use("/api/admin", adminAuthRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin/requests", adminRequestRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/user", userLearningRoutes);

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

app.use((err, req, res, next) => {
  console.error("❌ API Error:", err);
  res.status(500).json({ message: "Internal server error" });
});




// START SERVER (LAST)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


// 🔥 ADD THIS AT THE VERY BOTTOM
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});