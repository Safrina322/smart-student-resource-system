import { useState } from "react";
import "../styles/UploadResource.css";

function AdminAddCourse() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "",
    duration: "",
  });

  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("adminToken");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const data = new FormData();
    Object.keys(formData).forEach((key) =>
      data.append(key, formData[key])
    );
    data.append("image", image);

    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/courses/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.message || "❌ Failed to add course");
        return;
      }

      setMessage("✅ Course added successfully");

      // Optional: reset form
      setFormData({
        title: "",
        description: "",
        subject: "",
        level: "",
        duration: "",
      });
      setImage(null);
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Add New Course</h2>

        {message && <p style={{ textAlign: "center" }}>{message}</p>}

        <form onSubmit={handleSubmit}>
          <label>Course Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter course title"
            required
          />

          <label>Description</label>
          <input
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter course description"
            required
          />

          <label>Subject</label>
          <input
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Eg: Computer Networks"
            required
          />

          <label>Level</label>
          <input
            name="level"
            value={formData.level}
            onChange={handleChange}
            placeholder="Beginner / Intermediate / Advanced"
            required
          />

          <label>Duration</label>
          <input
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Eg: 12 hours"
            required
          />

          <label>Course Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />

          <button type="submit">Add Course</button>
        </form>
      </div>
    </div>
  );
}

export default AdminAddCourse;
