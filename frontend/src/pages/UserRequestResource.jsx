import { useState } from "react";
import { apiCall, getApiUrl } from "../utils/api.js";
import "../styles/UploadResource.css";

function RequestResource() {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    semester: "",
    type: "PDF",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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
      const data = await apiCall("/api/requests", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setStatus("✅ Request sent to admin successfully!");

      // 🔄 clear form after success
      setFormData({
        title: "",
        subject: "",
        semester: "",
        type: "PDF",
        message: "",
      });
    } catch (err) {
      setStatus(`❌ ${err.message || "Failed to send request"}`);
    }

    setLoading(false);
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Request a Resource</h2>

        {status && (
          <p style={{ textAlign: "center", marginBottom: "10px" }}>
            {status}
          </p>
        )}

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

          <label>Semester</label>
          <input
            name="semester"
            value={formData.semester}
            onChange={handleChange}
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
        </form>
      </div>
    </div>
  );
}

export default RequestResource;
