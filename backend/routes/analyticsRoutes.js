import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/events", authMiddleware, (req, res) => {
  const { id: userId } = req.user;
  const {
    eventType,
    courseId,
    lessonId,
    resourceType,
    metadata,
  } = req.body;

  if (!eventType) {
    return res.status(400).json({ message: "eventType is required" });
  }

  db.query(
    `INSERT INTO analytics_events
    (user_id, event_type, course_id, lesson_id, resource_type, metadata)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId || null,
      eventType,
      courseId || null,
      lessonId || null,
      resourceType || null,
      metadata ? JSON.stringify(metadata) : null,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({ message: "DB error" });
      }

      res.json({ message: "Event tracked" });
    }
  );
});

export default router;
