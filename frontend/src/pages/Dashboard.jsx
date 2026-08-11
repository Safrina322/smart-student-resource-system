import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBookOpen,
  HiOutlineBookmark,
  HiOutlineSparkles,
  HiOutlineArrowUpTray,
  HiOutlineCpuChip,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import { getApiUrl } from "../utils/api.js";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/Dashboard.css";
import PopularResources from "../components/PopularResources.jsx";
import NotificationsPanel from "../components/NotificationsPanel.jsx";
import { SkeletonTableRows } from "../components/Skeleton.jsx";
import { listMyBookmarks } from "../services/resourceHubService.js";
import { listCourses } from "../services/courseService.js";
import { getRecommendations } from "../services/aiService.js";
import { getContinueLearning } from "../services/learningProgressService.js";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360">
      <rect width="600" height="360" fill="#171a21"/>
      <rect x="1" y="1" width="598" height="358" fill="none" stroke="#2a2f3a" stroke-width="2"/>
      <g opacity="0.55">
        <rect x="250" y="130" width="100" height="76" rx="8" fill="none" stroke="#14b8a6" stroke-width="3"/>
        <circle cx="272" cy="152" r="7" fill="#14b8a6"/>
        <path d="M258,196 L288,166 L306,184 L322,168 L342,196 Z" fill="#14b8a6"/>
      </g>
      <text x="300" y="240" fill="#9ca3af" font-family="Arial, sans-serif" font-size="15" font-weight="600" text-anchor="middle">No preview available</text>
    </svg>
  `);

const QUICK_ACTIONS = [
  {
    to: "/upload",
    label: "Request a Resource",
    desc: "Ask for a course or resource to be added",
    icon: HiOutlineArrowUpTray,
  },
  {
    to: "/resources",
    label: "Browse Resources",
    desc: "Explore courses and study materials",
    icon: HiOutlineBookOpen,
  },
  {
    to: "/ai-tools",
    label: "AI Study Assistant",
    desc: "Summaries, quizzes, and flashcards",
    icon: HiOutlineCpuChip,
  },
  {
    to: "/study-planner",
    label: "Study Planner",
    desc: "Build a week-by-week study plan",
    icon: HiOutlineCalendarDays,
  },
];

function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [continueLearning, setContinueLearning] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCourses();
      setCourses(data || []);
    } catch (err) {
      setError(`Failed to load courses: ${err.message}`);
      setCourses([]);
    }
    setLoading(false);
  };

  const fetchLearningProgress = async () => {
    try {
      const data = await getContinueLearning();
      if (data.continueLearning) {
        setContinueLearning(data.continueLearning);
      }
      if (data.recentActivity) {
        setRecentActivity(data.recentActivity);
      }
    } catch {
      // Silently ignore errors for optional feature
    }
  };

  // No auth check here - this page is only ever reached via ProtectedRoute,
  // which already guarantees a logged-in session before rendering children.
  useEffect(() => {
    fetchCourses();
    fetchLearningProgress();
    listMyBookmarks()
      .then((data) => setBookmarks(Array.isArray(data) ? data : []))
      .catch(() => setBookmarks([]));
    getRecommendations()
      .then((data) => setRecommendations(data.recommendations || []))
      .catch(() => setRecommendations([]))
      .finally(() => setRecsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveImageUrl = (image) => {
    if (!image) return FALLBACK_IMAGE;
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
      <section className="dashboard-welcome">
        <h1>Welcome back, {user?.username || "there"}</h1>
        <p>Your learning journey continues - keep exploring, keep growing.</p>
      </section>

      {error && <p className="dashboard-error">{error}</p>}

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <HiOutlineBookOpen />
          </div>
          <div>
            <p className="stat-value">{courses.length}</p>
            <p className="stat-label">Total Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <HiOutlineBookmark />
          </div>
          <div>
            <p className="stat-value">{bookmarks.length}</p>
            <p className="stat-label">Bookmarked</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <HiOutlineSparkles />
          </div>
          <div>
            <p className="stat-value">{recommendations.length}</p>
            <p className="stat-label">AI Recommendations</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <NotificationsPanel />

        <section className="quick-actions-panel">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {/* eslint-disable-next-line no-unused-vars -- Icon is used as the JSX tag below; core no-unused-vars doesn't resolve destructured-and-renamed JSX component names */}
            {QUICK_ACTIONS.map(({ to, label, desc, icon: Icon }) => (
              <Link to={to} className="quick-action-card" key={to}>
                <div className="quick-action-icon">
                  <Icon />
                </div>
                <div className="quick-action-text">
                  <p className="quick-action-label">{label}</p>
                  <p className="quick-action-desc">{desc}</p>
                </div>
                <HiOutlineArrowRight className="quick-action-arrow" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <PopularResources />

      {continueLearning && (
        <section className="continue-learning-section">
          <h2>
            <HiOutlineClock /> Continue Learning
          </h2>
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
              <Link to={`/resources/${continueLearning.course_id}`} className="continue-btn">
                Continue Course <HiOutlineArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {recentActivity.length > 0 && (
        <section className="recent-activity-section">
          <h2>
            <HiOutlineClock /> Recent Activity
          </h2>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <HiOutlineBookOpen />
                </div>
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

      {!recsLoading && recommendations.length > 0 && (
        <section className="recent-activity-section">
          <h2>
            <HiOutlineSparkles /> Recommended for You
          </h2>
          <div className="activity-list">
            {recommendations.map((rec) => (
              <Link key={rec.id} to={`/resource-hub/${rec.id}`} className="activity-item">
                <div className="activity-icon">
                  <HiOutlineSparkles />
                </div>
                <div className="activity-content">
                  <h4>{rec.title}</h4>
                  <p className="activity-lesson">{rec.reason}</p>
                  <span className="activity-type">{rec.subject || "General"}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bookmarks.length > 0 && (
        <section className="recent-activity-section">
          <h2>
            <HiOutlineBookmark /> Bookmarked Resources
          </h2>
          <div className="activity-list">
            {bookmarks.map((bookmark) => (
              <Link key={bookmark.id} to={`/resource-hub/${bookmark.id}`} className="activity-item">
                <div className="activity-icon">
                  <HiOutlineBookmark />
                </div>
                <div className="activity-content">
                  <h4>{bookmark.title}</h4>
                  <p className="activity-lesson">{bookmark.subject}</p>
                  <span className="activity-type">{bookmark.resource_type}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="recent-section">
        <h2>Recent Courses</h2>

        {!loading && courses.length === 0 ? (
          <p className="recent-empty">No courses available yet</p>
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
              {loading ? (
                <SkeletonTableRows rows={5} columns={5} />
              ) : (
                courses.slice(0, 5).map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.subject}</td>
                    <td>{course.level}</td>
                    <td>{course.duration}</td>
                    <td>
                      <Link to={`/resources/${course.id}`} className="view-course-link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
