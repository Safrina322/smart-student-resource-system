import { useState } from "react";
import { apiCall, getAuthHeader } from "../utils/api.js";
import "../styles/UploadResource.css";

function RequestResource() {
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

      const data = await apiCall("/api/requests", {
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
        </form>
      </div>
    </div>
  );
}

export default RequestResource;
