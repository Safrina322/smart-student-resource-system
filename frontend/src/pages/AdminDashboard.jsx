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
    }
  }, []);

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
    navigate("/admin/login");
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