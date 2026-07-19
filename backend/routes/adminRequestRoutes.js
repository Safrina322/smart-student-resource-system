import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import db from "../db.js";
import { sendRequestStatusEmail } from "../utils/mailer.js";
import { notifyUser } from "../services/notificationService.js";
import { logAdminAction } from "../utils/auditLogger.js";

const router = express.Router();

const addRequestHistoryEntry = ({ requestId, status, note = null, adminId = null }) => {
  db.query(
    `INSERT INTO request_status_history (request_id, status, note, changed_by_admin_id)
     VALUES (?, ?, ?, ?)`,
    [requestId, status, note, adminId],
    (historyErr) => {
      if (historyErr) {
        console.error("⚠️ Request history write warning:", historyErr.message);
      }
    }
  );
};

// GET all pending requests
router.get("/", adminAuth, (req, res) => {
  const sql = "SELECT * FROM resource_requests WHERE status='pending'";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ message: "DB error", error: err.message });
    }

    console.log("✅ Requests fetched:", results?.length || 0);
    res.json(results);
  });
});

/* APPROVE REQUEST */
router.put("/:id/approve", adminAuth, (req, res) => {
  const { id } = req.params;
  const adminId = req.admin?.adminId || null;
  const adminComment = req.body?.comment || "Request approved by admin";

  // First, get the request details
  db.query(
    `SELECT rr.*, u.email AS user_email, u.username AS username
     FROM resource_requests rr
     LEFT JOIN users u ON rr.user_id = u.id
     WHERE rr.id=?`,
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (results.length === 0) return res.status(404).json({ message: "Request not found" });

      const request = results[0];
      const courseImage = request.image && request.image.trim() ? request.image.trim() : "default.jpg";
      const courseDescription = request.description && request.description.trim()
        ? request.description.trim()
        : request.message || "Course created from approved request";
      const courseLevel = request.level && request.level.trim()
        ? request.level.trim()
        : "Beginner";
      const courseDuration = request.duration && request.duration.trim()
        ? request.duration.trim()
        : "Self-paced";
      const normalizedType = ["PDF", "Video", "Link"].includes(request.type)
        ? request.type
        : "Link";

      db.query(
        "SELECT id FROM courses WHERE title = ? AND subject = ? LIMIT 1",
        [request.title, request.subject],
        (findErr, existingCourse) => {
          if (findErr) return res.status(500).json({ message: "DB error" });

          const approveAndStoreLesson = (courseId) => {
            const resolvedLessonTitle = (request.lesson_title || request.title || "New Lesson").trim();
            const resolvedLessonDescription = request.lesson_description || request.message || "";
            const resolvedResourceUrl = (request.resource_url || "").trim();

            // Legacy requests may not have a URL. Approve course and let admin add lesson later.
            if (!resolvedResourceUrl) {
              db.query(
                "UPDATE resource_requests SET status='approved', course_id=? WHERE id=?",
                [courseId, id],
                (updateErr) => {
                  if (updateErr) return res.status(500).json({ message: "DB error" });

                      addRequestHistoryEntry({
                        requestId: Number(id),
                        status: "approved",
                        note: adminComment,
                        adminId,
                      });

                  sendRequestStatusEmail({
                    to: request.user_email,
                    studentName: request.username,
                    courseTitle: request.title,
                    status: "approved",
                    resourceType: normalizedType,
                    adminComment: "Approved. Please contact admin to publish lesson URL/file.",
                  }).catch((mailErr) => {
                    console.error("❌ Email send failed (approve):", mailErr.message);
                  });

                  notifyUser({
                    userId: request.user_id,
                    type: "request_approved",
                    title: "Request Approved",
                    message: `Your request for \"${request.title}\" has been approved.`,
                    meta: JSON.stringify({ requestId: Number(id), courseId }),
                  });

                  logAdminAction({
                    adminId,
                    actionType: "request_approved",
                    targetType: "resource_request",
                    targetId: Number(id),
                    details: `Approved request ${id} for course ${courseId} (legacy URL missing)`,
                  });

                  return res.json({
                    message: "Request approved. No lesson URL found, so lesson was not published.",
                    courseId,
                  });
                }
              );
              return;
            }

            db.query(
              `INSERT INTO course_lessons
              (course_id, lesson_title, lesson_description, resource_type, resource_url, lesson_order)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                courseId,
                resolvedLessonTitle,
                resolvedLessonDescription,
                normalizedType,
                resolvedResourceUrl,
                Number(request.lesson_order) || 1,
              ],
              (lessonErr) => {
                if (lessonErr) {
                  console.error("❌ Lesson insert error:", lessonErr.message);
                  return res.status(500).json({ message: `Lesson publish failed: ${lessonErr.message}` });
                }

                db.query(
                  "UPDATE resource_requests SET status='approved', course_id=? WHERE id=?",
                  [courseId, id],
                  (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: "DB error" });

                    addRequestHistoryEntry({
                      requestId: Number(id),
                      status: "approved",
                      note: adminComment,
                      adminId,
                    });

                    sendRequestStatusEmail({
                      to: request.user_email,
                      studentName: request.username,
                      courseTitle: request.title,
                      status: "approved",
                      resourceType: normalizedType,
                      adminComment,
                    }).catch((mailErr) => {
                      console.error("❌ Email send failed (approve):", mailErr.message);
                    });

                    notifyUser({
                      userId: request.user_id,
                      type: "request_approved",
                      title: "Request Approved",
                      message: `Your request for \"${request.title}\" has been approved and published.`,
                      meta: JSON.stringify({ requestId: Number(id), courseId }),
                    });

                    logAdminAction({
                      adminId,
                      actionType: "request_approved",
                      targetType: "resource_request",
                      targetId: Number(id),
                      details: `Approved request ${id}; lesson published in course ${courseId}`,
                    });

                    res.json({ message: "Request approved and lesson published", courseId });
                  }
                );
              }
            );
          };

          if (existingCourse.length > 0) {
            return approveAndStoreLesson(existingCourse[0].id);
          }

          db.query(
            "INSERT INTO courses (title, description, subject, level, duration, image) VALUES (?, ?, ?, ?, ?, ?)",
            [request.title, courseDescription, request.subject, courseLevel, courseDuration, courseImage],
            (insertErr, insertResult) => {
              if (insertErr) {
                // If title already exists due to unique constraint, reuse existing course by title.
                if (insertErr.code === "ER_DUP_ENTRY") {
                  return db.query(
                    "SELECT id FROM courses WHERE title = ? LIMIT 1",
                    [request.title],
                    (dupFindErr, dupRows) => {
                      if (dupFindErr || !dupRows.length) {
                        return res.status(500).json({ message: "DB error" });
                      }
                      approveAndStoreLesson(dupRows[0].id);
                    }
                  );
                }

                return res.status(500).json({ message: `DB error: ${insertErr.message}` });
              }

              approveAndStoreLesson(insertResult.insertId);
            }
          );
        }
      );
    }
  );
});

/* REJECT REQUEST */
router.put("/:id/reject", adminAuth, (req, res) => {
  const { id } = req.params;
  const adminId = req.admin?.adminId || null;
  const adminComment = req.body?.comment || "Request rejected by admin";

  db.query(
    `SELECT rr.*, u.email AS user_email, u.username AS username
     FROM resource_requests rr
     LEFT JOIN users u ON rr.user_id = u.id
     WHERE rr.id=?`,
    [id],
    (findErr, results) => {
      if (findErr) return res.status(500).json({ message: "DB error" });
      if (!results.length) return res.status(404).json({ message: "Request not found" });

      const request = results[0];

      db.query(
        "UPDATE resource_requests SET status='rejected' WHERE id=?",
        [id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "DB error" });

          addRequestHistoryEntry({
            requestId: Number(id),
            status: "rejected",
            note: adminComment,
            adminId,
          });

          sendRequestStatusEmail({
            to: request.user_email,
            studentName: request.username,
            courseTitle: request.title,
            status: "rejected",
            resourceType: request.type,
            adminComment,
          }).catch((mailErr) => {
            console.error("❌ Email send failed (reject):", mailErr.message);
          });

          notifyUser({
            userId: request.user_id,
            type: "request_rejected",
            title: "Request Rejected",
            message: `Your request for \"${request.title}\" was rejected.`,
            meta: JSON.stringify({ requestId: Number(id) }),
          });

          logAdminAction({
            adminId,
            actionType: "request_rejected",
            targetType: "resource_request",
            targetId: Number(id),
            details: `Rejected request ${id}`,
          });

          res.json({ message: "Request rejected" });
        }
      );
    }
  );
});

export default router;
