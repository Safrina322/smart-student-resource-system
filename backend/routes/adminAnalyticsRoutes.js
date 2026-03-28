import express from "express";
import db from "../db.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const buildLastDays = (days = 7) => {
  const result = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    result.push({ key, label });
  }

  return result;
};

router.get("/summary", adminAuth, (req, res) => {
  const summary = {
    pendingRequests: 0,
    approvals7d: 0,
    resourceOpens7d: 0,
    topSubject: "N/A",
    topResourceType: "N/A",
  };

  db.query(
    "SELECT COUNT(*) AS count FROM resource_requests WHERE status='pending'",
    (pendingErr, pendingRows) => {
      if (pendingErr) return res.status(500).json({ message: "DB error" });
      summary.pendingRequests = pendingRows[0]?.count || 0;

      db.query(
        "SELECT COUNT(*) AS count FROM resource_requests WHERE status='approved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        (approveErr, approveRows) => {
          if (approveErr) return res.status(500).json({ message: "DB error" });
          summary.approvals7d = approveRows[0]?.count || 0;

          db.query(
            "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='resource_open' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            (eventErr, eventRows) => {
              if (eventErr) return res.status(500).json({ message: "DB error" });
              summary.resourceOpens7d = eventRows[0]?.count || 0;

              db.query(
                "SELECT subject, COUNT(*) AS count FROM courses WHERE subject IS NOT NULL AND subject != '' GROUP BY subject ORDER BY count DESC LIMIT 1",
                (subjectErr, subjectRows) => {
                  if (subjectErr) return res.status(500).json({ message: "DB error" });
                  summary.topSubject = subjectRows[0]?.subject || "N/A";

                  db.query(
                    "SELECT resource_type, COUNT(*) AS count FROM course_lessons GROUP BY resource_type ORDER BY count DESC LIMIT 1",
                    (typeErr, typeRows) => {
                      if (typeErr) return res.status(500).json({ message: "DB error" });
                      summary.topResourceType = typeRows[0]?.resource_type || "N/A";

                      res.json(summary);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

router.get("/trends", adminAuth, (req, res) => {
  const days = buildLastDays(7);
  const response = {
    labels: days.map((d) => d.label),
    approvalsByDay: days.map(() => 0),
    resourceOpensByDay: days.map(() => 0),
    topSubjects: [],
  };

  db.query(
    `SELECT DATE(updated_at) AS day, COUNT(*) AS count
     FROM resource_requests
     WHERE status='approved' AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(updated_at)
     ORDER BY day ASC`,
    (approvalsErr, approvalsRows) => {
      if (approvalsErr) return res.status(500).json({ message: "DB error" });

      const approvalMap = new Map(
        (approvalsRows || []).map((row) => [
          new Date(row.day).toISOString().slice(0, 10),
          Number(row.count) || 0,
        ])
      );

      response.approvalsByDay = days.map((d) => approvalMap.get(d.key) || 0);

      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM analytics_events
         WHERE event_type='resource_open' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(created_at)
         ORDER BY day ASC`,
        (eventsErr, eventsRows) => {
          if (eventsErr) return res.status(500).json({ message: "DB error" });

          const eventMap = new Map(
            (eventsRows || []).map((row) => [
              new Date(row.day).toISOString().slice(0, 10),
              Number(row.count) || 0,
            ])
          );

          response.resourceOpensByDay = days.map((d) => eventMap.get(d.key) || 0);

          db.query(
            `SELECT subject, COUNT(*) AS count
             FROM courses
             WHERE subject IS NOT NULL AND subject != ''
             GROUP BY subject
             ORDER BY count DESC
             LIMIT 5`,
            (subjectErr, subjectRows) => {
              if (subjectErr) return res.status(500).json({ message: "DB error" });

              response.topSubjects = (subjectRows || []).map((row) => ({
                subject: row.subject,
                count: Number(row.count) || 0,
              }));

              res.json(response);
            }
          );
        }
      );
    }
  );
});

export default router;
