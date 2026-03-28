import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Track course/lesson access 
router.post("/track-access", authMiddleware, (req, res) => {
  const { courseId, lessonId } = req.body;
  const userId = req.user.id;

  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" });
  }

  // Insert or update user_learning_progress
  db.query(
    `INSERT INTO user_learning_progress (user_id, course_id, lesson_id, last_accessed_at, created_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
     lesson_id = COALESCE(?, lesson_id),
     last_accessed_at = NOW()`,
    [userId, courseId, lessonId, lessonId],
    (err, result) => {
      if (err) {
        console.error("❌ Track access error:", err);
        return res.status(500).json({ message: "Failed to track access" });
      }
      res.status(200).json({ success: true });
    }
  );
});

// Get continue learning + recent activity for student
router.get("/continue-learning", authMiddleware, (req, res) => {
  const userId = req.user.id;

  // Query 1: Get last accessed course with course details
  db.query(
    `SELECT 
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
    LIMIT 1`,
    [userId],
    (err1, continueLearning) => {
      if (err1) {
        console.error("❌ Continue learning query error:", err1);
        return res.status(500).json({ message: "Failed to fetch learning progress" });
      }

      // Query 2: Get recent activity (last 5 resource opens)
      db.query(
        `SELECT 
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
        LIMIT 5`,
        [userId],
        (err2, recentActivity) => {
          if (err2) {
            console.error("❌ Recent activity query error:", err2);
            return res.status(500).json({ message: "Failed to fetch recent activity" });
          }

          res.status(200).json({
            success: true,
            continueLearning: continueLearning.length > 0 ? continueLearning[0] : null,
            recentActivity: recentActivity || []
          });
        }
      );
    }
  );
});

export default router;
