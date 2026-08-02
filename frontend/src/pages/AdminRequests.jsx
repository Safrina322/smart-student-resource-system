import { useEffect, useState } from "react";
import { listRequests, approveRequest, rejectRequest } from "../services/adminRequestService.js";
import "../styles/AdminRequests.css";

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const data = await listRequests(page);
      // Tolerates a backend still on the old bare-array response shape (e.g.
      // a rolling deploy where the frontend updates before the backend does)
      // instead of crashing the whole page when `pagination` isn't there.
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setRequests(items);
      setPagination(
        data?.pagination || { page: 1, pageSize: items.length, total: items.length, totalPages: 1 }
      );
    } catch (err) {
      setError(`❌ Failed to load requests: ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests(1);
  }, []);

  const handleApprove = async (id) => {
    setActionError("");
    try {
      await approveRequest(id);
      fetchRequests(pagination.page);
    } catch (err) {
      setActionError(`Failed to approve: ${err.message}`);
    }
  };

  const handleReject = async (id) => {
    setActionError("");
    try {
      await rejectRequest(id);
      fetchRequests(pagination.page);
    } catch (err) {
      setActionError(`Failed to reject: ${err.message}`);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Pending Resource Requests{pagination.total > 0 ? ` (${pagination.total})` : ""}</h2>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        {actionError && <p style={{ color: "red", textAlign: "center" }}>{actionError}</p>}

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>✅ No pending requests</p>
        ) : (
          requests.map(req => (
            <div key={req.id} className="request-box">
              <p><b>Title:</b> {req.title}</p>
              <p><b>Description:</b> {req.description}</p>
              <p><b>Subject:</b> {req.subject}</p>
              <p><b>Semester:</b> {req.semester}</p>
              <p><b>Level:</b> {req.level}</p>
              <p><b>Duration:</b> {req.duration}</p>
              <p><b>Type:</b> {req.type}</p>
              <p><b>Lesson Title:</b> {req.lesson_title}</p>
              <p><b>Lesson Description:</b> {req.lesson_description}</p>
              <p><b>Lesson Order:</b> {req.lesson_order}</p>
              <p><b>Image:</b> {req.image}</p>
              <p><b>Resource URL:</b> <a href={req.resource_url} target="_blank" rel="noreferrer">Open resource</a></p>
              <p><b>Message:</b> {req.message}</p>

              <button onClick={() => handleApprove(req.id)}>✅ Approve</button>
              <button className="reject" onClick={() => handleReject(req.id)}>❌ Reject</button>
            </div>
          ))
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="admin-requests-pagination">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchRequests(pagination.page - 1)}
            >
              ← Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchRequests(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRequests;
