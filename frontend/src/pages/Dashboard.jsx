import { useEffect, useState } from "react";
import { apiCall, getAuthHeader } from "../utils/api.js";
import "../styles/Dashboard.css";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCourses();
  }, [token, navigate]);

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiCall("/api/courses");
      setCourses(data || []);
    } catch (err) {
      setError(`Failed to load courses: ${err.message}`);
      setCourses([]);
    }
    setLoading(false);
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <h2>Smart Student</h2>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/upload">Upload</Link></li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <h1>Welcome 👋</h1>

        {error && <p style={{ color: "red" }}>⚠️ {error}</p>}

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="card">
            <h3>Total Courses</h3>
            <p className="card-number">{courses.length}</p>
          </div>
          <div className="card">
            <h3>Available Resources</h3>
            <p className="card-number">{courses.length + 10}</p>
          </div>
          <div className="card">
            <h3>Active Courses</h3>
            <p className="card-number">{Math.max(1, Math.floor(courses.length / 2))}</p>
          </div>
        </div>

        {/* Recent Courses */}
        <section className="recent-section">
          <h2>Recent Courses</h2>

          {loading ? (
            <p style={{ textAlign: "center" }}>Loading courses...</p>
          ) : courses.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666" }}>No courses available yet</p>
          ) : (
            <table className="resources-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Level</th>
                  <th>Duration</th>
                </tr>
              </thead>

              <tbody>
                {courses.slice(0, 5).map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.subject}</td>
                    <td>{course.level}</td>
                    <td>{course.duration}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
