import { useState } from "react";
import { addCourse } from "../services/adminLessonService.js";
import { notify } from "../utils/notify.js";
import "../styles/UploadResource.css";

function AdminAddCourse() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "Beginner",
    duration: "",
    lesson_title: "",
    lesson_description: "",
    resource_type: "PDF",
    resource_url: "",
    lesson_order: 1,
  });

  const [image, setImage] = useState(null);
  const [resourceFile, setResourceFile] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) =>
      data.append(key, formData[key])
    );
    data.append("image", image);
    if (resourceFile) {
      data.append("resource_file", resourceFile);
    }

    try {
      await addCourse(data);

      notify.success("Course added successfully");

      // Optional: reset form
      setFormData({
        title: "",
        description: "",
        subject: "",
        level: "Beginner",
        duration: "",
        lesson_title: "",
        lesson_description: "",
        resource_type: "PDF",
        resource_url: "",
        lesson_order: 1,
      });
      setImage(null);
      setResourceFile(null);
    } catch (err) {
      notify.error(err.message || "Failed to add course");
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Add New Course</h2>

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
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

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

          <h3 style={{ marginTop: "22px", marginBottom: "8px" }}>First Lesson Resource</h3>

          <label>Lesson Title</label>
          <input
            name="lesson_title"
            value={formData.lesson_title}
            onChange={handleChange}
            placeholder="Eg: Introduction"
            required
          />

          <label>Lesson Description</label>
          <input
            name="lesson_description"
            value={formData.lesson_description}
            onChange={handleChange}
            placeholder="What students learn in this lesson"
            required
          />

          <label>Resource Type</label>
          <select
            name="resource_type"
            value={formData.resource_type}
            onChange={handleChange}
          >
            <option value="PDF">PDF</option>
            <option value="Video">Video</option>
            <option value="Link">Link</option>
          </select>

          <label>Resource URL (Optional if file chosen)</label>
          <input
            name="resource_url"
            value={formData.resource_url}
            onChange={handleChange}
            placeholder="https://..."
          />

          <label>Or Upload Resource File</label>
          <input
            type="file"
            accept=".pdf,.mp4,.mov,.avi,.mkv,.doc,.docx,.ppt,.pptx,.txt"
            onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
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

          <button type="submit">Add Course</button>
        </form>
      </div>
    </div>
  );
}

export default AdminAddCourse;
