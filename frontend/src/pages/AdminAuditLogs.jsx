import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAuditLogs } from "../services/adminAuditService.js";
import { SkeletonTableRows } from "../components/Skeleton.jsx";
import "../styles/AdminAuditLogs.css";

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // No auth check here - this page is only ever reached via
  // ProtectedAdminRoute, which already guarantees an active admin session.
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  return (
    <div className="audit-page">
      <div className="audit-header">
        <h1>Admin Audit Logs</h1>
        <Link to="/admin/dashboard" className="audit-back-btn">Back to Dashboard</Link>
      </div>

      {error ? <p className="audit-error">{error}</p> : null}

      {!loading && logs.length === 0 ? (
        <p className="audit-empty">No audit logs yet.</p>
      ) : (
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={6} columns={5} />
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.admin_name || log.admin_email || "System"}</td>
                    <td>{log.action_type}</td>
                    <td>{log.target_type} #{log.target_id ?? "-"}</td>
                    <td>{log.details || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAuditLogs;
