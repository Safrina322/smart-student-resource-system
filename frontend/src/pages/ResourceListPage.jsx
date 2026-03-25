import { useEffect, useState } from "react";
import { apiCall } from "../utils/api.js";
import "../styles/Resources.css";

function ResourceListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiCall("/api/courses");
      setCourses(data || []);
    } catch (err) {
      setError(`Failed to load courses: ${err.message}`);
    }
    setLoading(false);
  };

  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
  };

  return (
    <div className="resources-page">
      <h1>Available Courses</h1>

      {error && <p style={{ color: "red", textAlign: "center", margin: "20px 0" }}>{error}</p>}

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading courses...</p>
      ) : courses.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No courses available yet</p>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <div className="course-card" key={course.id}>
              <img
                src={`${apiCall.baseURL || "http://localhost:5000"}/images/${course.image}`}
                alt={course.title}
                onError={handleImageError}
              />

              <div className="course-content">
                <h3>{course.title}</h3>
                <p>{course.description}</p>

                <span className="badge">{course.level}</span>

                <p className="meta">
                  {course.subject} • {course.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResourceListPage;
