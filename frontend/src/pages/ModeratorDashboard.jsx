import { useEffect, useState } from "react";
import "../styles/RoleDashboard.css";
import { getReviewQueue, approveResource, rejectResource, flagResource } from "../services/moderationService.js";

const STATUSES = ["pending", "approved", "rejected", "flagged"];

function ModeratorDashboard() {
  const [status, setStatus] = useState("pending");
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});

  const loadQueue = async (targetStatus) => {
    setLoading(true);
    try {
      const data = await getReviewQueue(targetStatus);
      setQueue(data);
    } catch (err) {
      setMessage(err.message || "Failed to load the review queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleAction = async (id, action) => {
    setMessage("");
    const comment = commentDrafts[id] || "";
    try {
      const data = await action(id, comment);
      setMessage(data.message);
      loadQueue(status);
    } catch (err) {
      setMessage(err.message || "Action failed.");
    }
  };

  return (
    <div className="role-dashboard">
      <h1>Moderator Review Queue</h1>

      <div className="role-tabs">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`role-tab ${status === s ? "active" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {message && <p className="role-message">{message}</p>}

      <section className="role-card">
        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
        ) : queue.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>Nothing in the {status} queue.</p>
        ) : (
          <div className="review-list">
            {queue.map((resource) => (
              <div key={resource.id} className="review-item">
                <div className="review-item-header">
                  <h3>{resource.title}</h3>
                  <span className={`status-badge status-${resource.status}`}>{resource.status}</span>
                </div>
                <p className="review-item-meta">
                  By {resource.uploader_name} · {resource.resource_type}
                  {resource.subject ? ` · ${resource.subject}` : ""}
                </p>
                {resource.description && <p className="review-item-desc">{resource.description}</p>}
                <a href={resource.resource_link} target="_blank" rel="noreferrer" className="review-item-link">
                  View resource →
                </a>

                {resource.review_comment && (
                  <p className="review-item-comment">Previous note: {resource.review_comment}</p>
                )}

                {status === "pending" && (
                  <div className="review-actions">
                    <input
                      type="text"
                      placeholder="Optional note..."
                      value={commentDrafts[resource.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [resource.id]: e.target.value }))
                      }
                    />
                    <button
                      className="role-btn-primary"
                      onClick={() => handleAction(resource.id, approveResource)}
                    >
                      Approve
                    </button>
                    <button
                      className="role-btn-secondary"
                      onClick={() => handleAction(resource.id, rejectResource)}
                    >
                      Reject
                    </button>
                    <button
                      className="role-link-btn role-link-danger"
                      onClick={() => handleAction(resource.id, flagResource)}
                    >
                      Flag
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ModeratorDashboard;
