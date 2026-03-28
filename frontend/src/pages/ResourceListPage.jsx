import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall, getApiUrl } from "../utils/api.js";
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

  const resolveImageUrl = (image) => {
    if (!image) return "https://via.placeholder.com/300x200?text=No+Image";
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${getApiUrl()}/images/${image}`;
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
            <Link
              className="course-card"
              key={course.id}
              to={`/resources/${course.id}`}
              aria-label={`Open ${course.title} learning page`}
            >
              <img
                src={resolveImageUrl(course.image)}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResourceListPage;
