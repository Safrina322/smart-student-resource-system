import { useEffect, useState } from "react";
import { apiCall, getAuthHeader } from "../utils/api.js";
import { useNavigate } from "react-router-dom";
import "../styles/UploadResource.css";

function RequestResource() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    semester: "",
    level: "Beginner",
    duration: "",
    type: "PDF",
    lesson_title: "",
    lesson_description: "",
    resource_url: "",
    lesson_order: 1,
    message: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleAuthFailure = (message) => {
    if (!message) return false;
    const normalizedMessage = message.toLowerCase();
    const isAuthError =
      normalizedMessage.includes("invalid token") ||
      normalizedMessage.includes("token expired") ||
      normalizedMessage.includes("no token provided") ||
      normalizedMessage.includes("malformed token");

    if (isAuthError) {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      setStatus("❌ Session expired. Please login again.");
      setTimeout(() => navigate("/user/login"), 700);
      return true;
    }

    return false;
  };

  const fetchMyRequests = async () => {
    setTimelineLoading(true);
    try {
      const data = await apiCall("/api/requests/mine", {
        headers: getAuthHeader("token"),
      });
      setMyRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      if (handleAuthFailure(err.message)) {
        setTimelineLoading(false);
        return;
      }
      console.error("Failed to load request timeline", err.message);
    } finally {
      setTimelineLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleString();
  };

  const prettyStatus = (value) => {
    if (!value) return "Unknown";
    const map = {
      submitted: "Submitted",
      pending: "Under Review",
      approved: "Approved",
      rejected: "Rejected",
    };
    return map[value.toLowerCase()] || value;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🚫 prevent duplicate submit
    if (loading) return;

    setLoading(true);
    setStatus("");

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });
      if (imageFile) {
        payload.append("image", imageFile);
      }

      await apiCall("/api/requests", {
        method: "POST",
        headers: getAuthHeader("token"),
        body: payload,
      });

      setStatus("✅ Request sent to admin successfully!");

      // 🔄 clear form after success
      setFormData({
        title: "",
        description: "",
        subject: "",
        semester: "",
        level: "Beginner",
        duration: "",
        type: "PDF",
        lesson_title: "",
        lesson_description: "",
        resource_url: "",
        lesson_order: 1,
        message: "",
      });
      setImageFile(null);
      fetchMyRequests();
    } catch (err) {
      if (handleAuthFailure(err.message)) {
        setLoading(false);
        return;
      }
      setStatus(`❌ ${err.message || "Failed to send request"}`);
    }

    setLoading(false);
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Request a Resource</h2>

        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label>Subject</label>
          <input
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />

          <label>Course Description</label>
          <input
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Short overview of this course"
            required
          />

          <label>Semester</label>
          <input
            type="number"
            min="1"
            max="12"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            placeholder="Eg: 2"
            required
          />

          <label>Level</label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <label>Duration</label>
          <input
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Eg: 6 weeks"
            required
          />

          <label>Course Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
          />

          <label>Lesson Title</label>
          <input
            name="lesson_title"
            value={formData.lesson_title}
            onChange={handleChange}
            placeholder="Eg: Introduction and Setup"
            required
          />

          <label>Lesson Description</label>
          <input
            name="lesson_description"
            value={formData.lesson_description}
            onChange={handleChange}
            placeholder="What learner will complete in this lesson"
            required
          />

          <label>Resource Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option>PDF</option>
            <option>Video</option>
            <option>Link</option>
          </select>

          <label>Resource URL (PDF / Video / Link)</label>
          <input
            name="resource_url"
            value={formData.resource_url}
            placeholder="https://..."
            onChange={handleChange}
            required
          />

          <label>Lesson Order</label>
          <input
            type="number"
            min="1"
            name="lesson_order"
            value={formData.lesson_order}
            onChange={handleChange}
            required
          />

          <label>Message to Admin</label>
          <input
            name="message"
            value={formData.message}
            placeholder="Why should this be added?"
            onChange={handleChange}
          />

          <button disabled={loading}>
            {loading ? "Sending..." : "Send Request"}
          </button>

          {status && (
            <p className="upload-status-message" role="status">
              {status}
            </p>
          )}
        </form>

        <section className="request-timeline-section">
          <h3>Your Request Timeline</h3>
          {timelineLoading ? (
            <p className="timeline-empty">Loading your requests...</p>
          ) : myRequests.length === 0 ? (
            <p className="timeline-empty">No requests yet. Submit one above to start tracking.</p>
          ) : (
            <div className="timeline-request-list">
              {myRequests.map((requestItem) => (
                <article key={requestItem.id} className="timeline-request-card">
                  <div className="timeline-request-header">
                    <h4>{requestItem.title}</h4>
                    <span className={`timeline-status status-${(requestItem.status || "").toLowerCase()}`}>
                      {prettyStatus(requestItem.status)}
                    </span>
                  </div>
                  <p className="timeline-request-meta">
                    {requestItem.subject} • Semester {requestItem.semester} • {requestItem.type}
                  </p>

                  <div className="timeline-steps">
                    {(requestItem.timeline || []).map((step) => (
                      <div key={step.id} className="timeline-step">
                        <span className={`timeline-dot dot-${(step.status || "").toLowerCase()}`} />
                        <div className="timeline-step-content">
                          <strong>{prettyStatus(step.status)}</strong>
                          {step.note ? <p>{step.note}</p> : null}
                          <small>{formatDateTime(step.changed_at)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default RequestResource;
