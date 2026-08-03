import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getApiUrl } from "../utils/api.js";
import "../styles/AdminDashboard.css";
import ActivityTrendChart from "../components/charts/ActivityTrendChart.jsx";
import TopSubjectsChart from "../components/charts/TopSubjectsChart.jsx";
import {
  getSummary,
  getTrends,
  getReportHistory,
  getSchedule,
  saveSchedule,
  deleteSchedule,
  downloadReport,
} from "../services/adminAnalyticsService.js";
import { notify } from "../utils/notify.js";
import { useAuth } from "../hooks/useAuth.js";

function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [heroImageError, setHeroImageError] = useState(false);
  const [reportDays, setReportDays] = useState("30");
  const [reportLoading, setReportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
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

  // No auth check here - this page is only ever reached via
  // ProtectedAdminRoute, which already guarantees an active admin session.
  useEffect(() => {
    getSummary()
      .then((data) => {
        setSummary(data || {});
      })
      .catch(() => {
        // Keep fallback stats if summary fails.
      });

    getTrends()
      .then((data) => {
        setTrends(data || {});
      })
      .catch(() => {
        // Keep fallback chart state if trend call fails.
      });

    loadReportHistory();
    loadReportSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReportHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getReportHistory(12);
      setReportHistory(Array.isArray(data) ? data : []);
    } catch {
      setReportHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadReportSchedule = async () => {
    try {
      const data = await getSchedule();

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
      notify.error("Could not load report schedule.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);

    try {
      const response = await downloadReport(reportDays);
      const downloadUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `admin-report-${reportDays}d.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      loadReportHistory();
    } catch (err) {
      notify.error(err.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleScheduleSave = async () => {
    setScheduleLoading(true);

    try {
      await saveSchedule({
        frequency: scheduleForm.frequency,
        timeOfDay: scheduleForm.timeOfDay,
        rangeDays: Number(scheduleForm.rangeDays),
        recipientEmail: scheduleForm.recipientEmail,
        isActive: Boolean(scheduleForm.isActive),
      });

      notify.success("Schedule saved");
      await loadReportSchedule();
    } catch (err) {
      notify.error(err.message || "Failed to save schedule");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleScheduleDelete = async () => {
    if (!scheduleForm.scheduleId) return;

    setScheduleLoading(true);

    try {
      await deleteSchedule(scheduleForm.scheduleId);

      notify.success("Schedule deleted");
      setScheduleForm({
        frequency: "daily",
        timeOfDay: "09:00",
        rangeDays: "30",
        recipientEmail: "",
        isActive: true,
        scheduleId: null,
      });
    } catch (err) {
      notify.error(err.message || "Failed to delete schedule");
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
          <h2 className="admin-title">Welcome, {admin?.name || "Admin"}</h2>
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

          {(trends.labels || []).length === 0 ? (
            <p className="chart-empty">No activity data yet.</p>
          ) : (
            <ActivityTrendChart
              labels={trends.labels || []}
              approvalsByDay={trends.approvalsByDay || []}
              resourceOpensByDay={trends.resourceOpensByDay || []}
            />
          )}
        </article>

        <article className="admin-chart-card">
          <h3>Top Subjects</h3>
          <p>Current distribution across published courses.</p>

          {(trends.topSubjects || []).length === 0 ? (
            <p className="chart-empty">No subject data yet.</p>
          ) : (
            <TopSubjectsChart subjects={trends.topSubjects || []} />
          )}
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

        <Link to="/admin/users" className="admin-action-card">
          <h3>Manage Users</h3>
          <p>Search, change roles, and activate or deactivate student, lecturer, and moderator accounts.</p>
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