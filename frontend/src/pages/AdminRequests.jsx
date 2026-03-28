import { useEffect, useState } from "react";
import { apiCall, getAuthHeader } from "../utils/api.js";
import "../styles/AdminRequests.css";

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiCall("/api/admin/requests", {
        headers: getAuthHeader("adminToken"),
      });
      setRequests(data || []);
    } catch (err) {
      setError(`❌ Failed to load requests: ${err.message}`);
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    setActionError("");
    try {
      const data = await apiCall(`/api/admin/requests/${id}/approve`, {
        method: "PUT",
        headers: getAuthHeader("adminToken"),
      });

      setRequests(requests.filter(req => req.id !== id));
    } catch (err) {
      setActionError(`Failed to approve: ${err.message}`);
    }
  };

  const handleReject = async (id) => {
    setActionError("");
    try {
      const data = await apiCall(`/api/admin/requests/${id}/reject`, {
        method: "PUT",
        headers: getAuthHeader("adminToken"),
      });

      setRequests(requests.filter(req => req.id !== id));
    } catch (err) {
      setActionError(`Failed to reject: ${err.message}`);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Pending Resource Requests</h2>

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
      </div>
    </div>
  );
}

export default AdminRequests;
