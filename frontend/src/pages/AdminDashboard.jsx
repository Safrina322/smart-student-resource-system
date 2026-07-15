// import { useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import "../styles/AdminDashboard.css";

// function AdminDashboard() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const token = localStorage.getItem("adminToken");
//     if (!token) {
//       navigate("/admin/login");
//     }
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     navigate("/admin/login");
//   };

//   return (
//     <div className="admin-container">
//       <h2 className="admin-title">Admin Dashboard</h2>

//       <div className="admin-cards">
//         <Link to="/admin/add-course" className="admin-card">
//           Add Course
//         </Link>

//         <Link to="/admin/requests" className="admin-card">
//           Manage Requests
//         </Link>

//         <button onClick={handleLogout} className="admin-card logout-btn">
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiCall, getApiUrl, getAuthHeader } from "../utils/api";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [heroImageError, setHeroImageError] = useState(false);
  const [reportDays, setReportDays] = useState("30");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    frequency: "daily",
    timeOfDay: "09:00",
    rangeDays: "30",
    recipientEmail: "",
    isActive: true,
    scheduleId: null,
  });
  const [summary, setSummary] = useState({
    pendingRequests: 0,
    approvals7d: 0,
    resourceOpens7d: 0,
    topSubject: "N/A",
    topResourceType: "N/A",
  });
  const [trends, setTrends] = useState({
    labels: [],
    approvalsByDay: [],
    resourceOpensByDay: [],
    topSubjects: [],
  });

  const buildAdminDisplayName = (name, email) => {
    const cleanedName = (name || "").trim();
    if (cleanedName && cleanedName.toLowerCase() !== "admin user") {
      return cleanedName;
    }

    const mail = (email || "").trim().toLowerCase();
    if (mail.includes("@")) {
      return mail.split("@")[0];
    }

    return cleanedName || "Admin";
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const name = localStorage.getItem("adminName");
    const adminEmail = localStorage.getItem("adminEmail");

    if (!token) {
      navigate("/admin/login");
    } else {
      setAdminName(buildAdminDisplayName(name, adminEmail));

      apiCall("/api/admin/analytics/summary", {
        headers: getAuthHeader("adminToken"),
      })
        .then((data) => {
          setSummary(data || {});
        })
        .catch(() => {
          // Keep fallback stats if summary fails.
        });

      apiCall("/api/admin/analytics/trends", {
        headers: getAuthHeader("adminToken"),
      })
        .then((data) => {
          setTrends(data || {});
        })
        .catch(() => {
          // Keep fallback chart state if trend call fails.
        });

      loadReportHistory();
      loadReportSchedule();
    }
  }, []);

  const loadReportHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiCall("/api/admin/analytics/report/history?limit=12", {
        headers: getAuthHeader("adminToken"),
      });
      setReportHistory(Array.isArray(data) ? data : []);
    } catch {
      setReportHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadReportSchedule = async () => {
    setScheduleError("");
    try {
      const data = await apiCall("/api/admin/analytics/report/schedules", {
        headers: getAuthHeader("adminToken"),
      });

      if (Array.isArray(data) && data.length > 0) {
        const schedule = data[0];
        setScheduleForm({
          frequency: schedule.frequency || "daily",
          timeOfDay: schedule.time_of_day || "09:00",
          rangeDays: String(schedule.range_days || 30),
          recipientEmail: schedule.recipient_email || "",
          isActive: Boolean(schedule.is_active),
          scheduleId: schedule.id,
        });
      }
    } catch {
      setScheduleError("Could not load schedule.");
    }
  };

  const maxActivity = Math.max(
    1,
    ...(trends.approvalsByDay || []),
    ...(trends.resourceOpensByDay || [])
  );

  const maxSubjectCount = Math.max(
    1,
    ...((trends.topSubjects || []).map((item) => item.count || 0))
  );

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError("");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      const response = await fetch(
        `${getApiUrl()}/api/admin/analytics/report?days=${encodeURIComponent(reportDays)}&format=csv`,
        {
          headers: {
            ...getAuthHeader("adminToken"),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `admin-report-${reportDays}d.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      loadReportHistory();
    } catch (err) {
      setReportError(err.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleScheduleSave = async () => {
    setScheduleLoading(true);
    setScheduleError("");

    try {
      await apiCall("/api/admin/analytics/report/schedules", {
        method: "POST",
        headers: getAuthHeader("adminToken"),
        body: JSON.stringify({
          frequency: scheduleForm.frequency,
          timeOfDay: scheduleForm.timeOfDay,
          rangeDays: Number(scheduleForm.rangeDays),
          recipientEmail: scheduleForm.recipientEmail,
          isActive: Boolean(scheduleForm.isActive),
        }),
      });

      await loadReportSchedule();
    } catch (err) {
      setScheduleError(err.message || "Failed to save schedule");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleScheduleDelete = async () => {
    if (!scheduleForm.scheduleId) return;

    setScheduleLoading(true);
    setScheduleError("");

    try {
      await apiCall(`/api/admin/analytics/report/schedules/${scheduleForm.scheduleId}`, {
        method: "DELETE",
        headers: getAuthHeader("adminToken"),
      });

      setScheduleForm({
        frequency: "daily",
        timeOfDay: "09:00",
        rangeDays: "30",
        recipientEmail: "",
        isActive: true,
        scheduleId: null,
      });
    } catch (err) {
      setScheduleError(err.message || "Failed to delete schedule");
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <section className="admin-hero">
        {!heroImageError && (
          <img
            src={`${getApiUrl()}/images/admin.jpg`}
            alt="Admin dashboard"
            className="admin-hero-image"
            onError={() => setHeroImageError(true)}
          />
        )}
        <div className="admin-hero-overlay" />

        <div className="admin-hero-content">
          <p className="admin-eyebrow">Control Center</p>
          <h2 className="admin-title">Welcome, {adminName}</h2>
          <p className="admin-subtitle">
            Review requests, publish courses, and keep your learning platform active.
          </p>

          <div className="admin-stats">
            <div className="admin-stat-card">
              <span>Pending Requests</span>
              <strong>{summary.pendingRequests ?? 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span>Approvals (7d)</span>
              <strong>{summary.approvals7d ?? 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span>Resource Opens (7d)</span>
              <strong>{summary.resourceOpens7d ?? 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span>Top Subject</span>
              <strong>{summary.topSubject || "N/A"}</strong>
            </div>
            <div className="admin-stat-card">
              <span>Top Resource Type</span>
              <strong>{summary.topResourceType || "N/A"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-charts-grid">
        <article className="admin-chart-card">
          <h3>7-Day Activity</h3>
          <p>Approvals and resource opens over the last week.</p>

          <div className="activity-chart">
            {(trends.labels || []).map((label, idx) => {
              const approvals = trends.approvalsByDay?.[idx] || 0;
              const opens = trends.resourceOpensByDay?.[idx] || 0;

              return (
                <div className="activity-col" key={`${label}-${idx}`}>
                  <div className="activity-bars">
                    <span
                      className="bar approvals"
                      style={{ height: `${Math.max(6, (approvals / maxActivity) * 100)}%` }}
                      title={`Approvals: ${approvals}`}
                    />
                    <span
                      className="bar opens"
                      style={{ height: `${Math.max(6, (opens / maxActivity) * 100)}%` }}
                      title={`Opens: ${opens}`}
                    />
                  </div>
                  <small>{label}</small>
                </div>
              );
            })}
          </div>

          <div className="chart-legend">
            <span><i className="dot approvals"></i>Approvals</span>
            <span><i className="dot opens"></i>Resource Opens</span>
          </div>
        </article>

        <article className="admin-chart-card">
          <h3>Top Subjects</h3>
          <p>Current distribution across published courses.</p>

          <div className="subject-bars">
            {(trends.topSubjects || []).length === 0 ? (
              <p className="chart-empty">No subject data yet.</p>
            ) : (
              (trends.topSubjects || []).map((item) => (
                <div className="subject-row" key={item.subject}>
                  <div className="subject-labels">
                    <span>{item.subject}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="subject-track">
                    <span
                      className="subject-fill"
                      style={{ width: `${(item.count / maxSubjectCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="admin-actions-grid">
        <article className="admin-action-card admin-report-card">
          <h3>Generate Report</h3>
          <p>Download a CSV report with summary stats, top categories, and day-wise activity.</p>
          <div className="admin-report-controls">
            <label htmlFor="report-window">Range</label>
            <select
              id="report-window"
              value={reportDays}
              onChange={(e) => setReportDays(e.target.value)}
              disabled={reportLoading}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              type="button"
              className="report-download-btn"
              onClick={handleGenerateReport}
              disabled={reportLoading}
            >
              {reportLoading ? "Generating..." : "Download CSV"}
            </button>
          </div>
          {reportError ? <p className="report-error">{reportError}</p> : null}
        </article>

        <article className="admin-action-card admin-report-card">
          <h3>Scheduled Report Email</h3>
          <p>Auto-send CSV reports to your email daily or weekly.</p>

          <div className="admin-report-controls">
            <label htmlFor="schedule-frequency">Frequency</label>
            <select
              id="schedule-frequency"
              value={scheduleForm.frequency}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, frequency: e.target.value }))}
              disabled={scheduleLoading}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>

            <label htmlFor="schedule-time">Time (24h)</label>
            <input
              id="schedule-time"
              type="time"
              value={scheduleForm.timeOfDay}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, timeOfDay: e.target.value }))}
              disabled={scheduleLoading}
            />

            <label htmlFor="schedule-days">Range</label>
            <select
              id="schedule-days"
              value={scheduleForm.rangeDays}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, rangeDays: e.target.value }))}
              disabled={scheduleLoading}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <label htmlFor="schedule-email">Recipient Email</label>
            <input
              id="schedule-email"
              type="email"
              placeholder="Leave empty to use admin email"
              value={scheduleForm.recipientEmail}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
              disabled={scheduleLoading}
            />

            <label className="schedule-toggle">
              <input
                type="checkbox"
                checked={Boolean(scheduleForm.isActive)}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                disabled={scheduleLoading}
              />
              Active
            </label>

            <div className="report-btn-row">
              <button
                type="button"
                className="report-download-btn"
                onClick={handleScheduleSave}
                disabled={scheduleLoading}
              >
                {scheduleLoading ? "Saving..." : "Save Schedule"}
              </button>
              {scheduleForm.scheduleId ? (
                <button
                  type="button"
                  className="report-secondary-btn"
                  onClick={handleScheduleDelete}
                  disabled={scheduleLoading}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>

          {scheduleError ? <p className="report-error">{scheduleError}</p> : null}
        </article>

        <article className="admin-action-card admin-report-card admin-history-card">
          <h3>Report History</h3>
          <p>Recent manual and scheduled report generation activity.</p>

          {historyLoading ? (
            <p className="chart-empty">Loading history...</p>
          ) : reportHistory.length === 0 ? (
            <p className="chart-empty">No report history yet.</p>
          ) : (
            <div className="report-history-list">
              {reportHistory.map((item) => (
                <div className="history-row" key={item.id}>
                  <div>
                    <strong>{item.report_type}</strong>
                    <span>{item.range_days}d • {item.format?.toUpperCase?.() || "CSV"}</span>
                  </div>
                  <div>
                    <span className={`history-status ${item.status}`}>{item.status}</span>
                    <small>{new Date(item.created_at).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <Link to="/admin/add-course" className="admin-action-card">
          <h3>Add Course</h3>
          <p>Create a new course with image, first lesson, and resource links/files.</p>
        </Link>

        <Link to="/admin/requests" className="admin-action-card">
          <h3>Manage Requests</h3>
          <p>Approve or reject pending student requests and trigger notification emails.</p>
        </Link>

        <Link to="/admin/lessons" className="admin-action-card">
          <h3>Manage Lessons</h3>
          <p>Edit lesson order, update URLs/files, and clean up old course resources.</p>
        </Link>

        <Link to="/admin/audit-logs" className="admin-action-card">
          <h3>Audit Logs</h3>
          <p>Track admin approvals, course changes, and lesson updates.</p>
        </Link>

        <button onClick={handleLogout} className="admin-action-card admin-logout-card">
          <h3>Logout</h3>
          <p>Exit admin session securely.</p>
        </button>
      </section>
    </div>
  );
}

export default AdminDashboard;