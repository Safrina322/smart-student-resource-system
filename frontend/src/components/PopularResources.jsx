import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall, getApiUrl } from "../utils/api";
import "../styles/PopularResources.css";

function PopularResources() {
  const [popular, setPopular] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPopularAndTrending();
  }, []);

  const fetchPopularAndTrending = async () => {
    setLoading(true);
    setError("");
    try {
      const [popularData, trendingData] = await Promise.all([
        apiCall("/api/popular/popular-courses"),
        apiCall("/api/popular/trending"),
      ]);
      setPopular(popularData.popularCourses || []);
      setTrending(trendingData.trendingCourses || []);
    } catch (err) {
      setError(`Failed to load resources: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resolveImageUrl = (image) => {
    if (!image) return "https://via.placeholder.com/250x180?text=Course";
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${getApiUrl()}/images/${image}`;
  };

  if (loading) {
    return <div className="popular-resources-container"><p>Loading popular resources...</p></div>;
  }

  return (
    <div className="popular-resources-container">
      {error && <p className="error-message">⚠️ {error}</p>}

      {/* Popular Courses Section */}
      {popular.length > 0 && (
        <section className="popular-section">
          <h2>⭐ Most Popular Courses</h2>
          <p className="section-subtitle">Based on views and user engagement</p>
          <div className="popular-grid">
            {popular.slice(0, 5).map((course) => (
              <div key={course.id} className="popular-card">
                <img 
                  src={resolveImageUrl(course.image)} 
                  alt={course.title}
                  className="popular-image"
                />
                <div className="popular-badge">
                  <span className="badge-icon">👁️</span>
                  <span className="badge-text">{course.total_views || 0} views</span>
                </div>
                <div className="popular-content">
                  <h3>{course.title}</h3>
                  <p className="course-subject">{course.subject}</p>
                  <p className="course-level">Level: {course.level}</p>
                  <div className="popularity-bar">
                    <div className="popularity-fill" style={{width: `${Math.min(100, (course.popularity_score || 0) / 50)}%`}}></div>
                  </div>
                  <p className="unique-users">👥 {course.unique_users} learners</p>
                  <Link to={`/course/${course.id}`} className="view-course-btn">
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Section */}
      {trending.length > 0 && (
        <section className="trending-section">
          <h2>🔥 Trending This Week</h2>
          <p className="section-subtitle">Most accessed in the last 7 days</p>
          <div className="trending-grid">
            {trending.map((course) => (
              <div key={course.id} className="trending-card">
                <div className="trending-image-wrapper">
                  <img 
                    src={resolveImageUrl(course.image)} 
                    alt={course.title}
                    className="trending-image"
                  />
                  <div className="trending-badge">🔥</div>
                </div>
                <div className="trending-content">
                  <h4>{course.title}</h4>
                  <p className="trending-subject">{course.subject}</p>
                  <div className="trending-stats">
                    <span>👁️ {course.recent_views} views</span>
                    <span>👥 {course.unique_users} learners</span>
                  </div>
                  <Link to={`/course/${course.id}`} className="trending-btn">
                    Explore →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {popular.length === 0 && trending.length === 0 && (
        <p className="empty-state">No popular resources yet. Start exploring courses!</p>
      )}
    </div>
  );
}

export default PopularResources;
