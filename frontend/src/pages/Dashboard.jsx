import { useEffect, useState } from "react";
import { apiCall, getAuthHeader, getApiUrl } from "../utils/api.js";
import "../styles/Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import PopularResources from "../components/PopularResources.jsx";
import NotificationsPanel from "../components/NotificationsPanel.jsx";

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [continueLearning, setContinueLearning] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCourses();
    fetchLearningProgress();
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

  const fetchLearningProgress = async () => {
    try {
      const data = await apiCall("/api/user/continue-learning", {
        method: "GET",
        headers: getAuthHeader("token"),
      });
      if (data.continueLearning) {
        setContinueLearning(data.continueLearning);
      }
      if (data.recentActivity) {
        setRecentActivity(data.recentActivity);
      }
    } catch (err) {
      // Silently ignore errors for optional feature
      console.log("Could not load learning progress");
    }
  };

  const resolveImageUrl = (image) => {
    if (!image) return "https://via.placeholder.com/300x200?text=Course";
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${getApiUrl()}/images/${image}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
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

        <NotificationsPanel />

        {/* Popular Resources Section */}
        <PopularResources />

        {/* Continue Learning Section */}
        {continueLearning && (
          <section className="continue-learning-section">
            <h2>📚 Continue Learning</h2>
            <div className="continue-learning-card">
              <img 
                src={resolveImageUrl(continueLearning.image)} 
                alt={continueLearning.course_title}
                className="continue-learning-image"
              />
              <div className="continue-learning-content">
                <h3>{continueLearning.course_title}</h3>
                <p className="continue-subject">{continueLearning.subject}</p>
                {continueLearning.lesson_title && (
                  <p className="continue-lesson">Last lesson: {continueLearning.lesson_title}</p>
                )}
                <p className="continue-time">
                  Last accessed: {formatDate(continueLearning.last_accessed_at)}
                </p>
                <Link 
                  to={`/resources/${continueLearning.course_id}`}
                  className="continue-btn"
                >
                  Continue Course →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Recent Activity Section */}
        {recentActivity.length > 0 && (
          <section className="recent-activity-section">
            <h2>⚡ Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">📖</div>
                  <div className="activity-content">
                    <h4>{activity.course_title}</h4>
                    {activity.lesson_title && (
                      <p className="activity-lesson">{activity.lesson_title}</p>
                    )}
                    <span className="activity-type">{activity.resource_type}</span>
                    <span className="activity-time">{formatDate(activity.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {courses.slice(0, 5).map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.subject}</td>
                    <td>{course.level}</td>
                    <td>{course.duration}</td>
                    <td>
                      <Link 
                        to={`/resources/${course.id}`}
                        className="view-course-link"
                      >
                        View
                      </Link>
                    </td>
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
