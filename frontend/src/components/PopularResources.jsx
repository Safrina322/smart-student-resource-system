import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiUrl } from "../utils/api";
import { getPopularCourses, getTrending } from "../services/popularResourceService.js";
import "../styles/PopularResources.css";
import { SkeletonCard } from "./Skeleton.jsx";

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

function PopularResources() {
  const {
    data: popular = [],
    isLoading: popularLoading,
    error: popularError,
  } = useQuery({ queryKey: ["popular-courses"], queryFn: getPopularCourses });

  const {
    data: trending = [],
    isLoading: trendingLoading,
    error: trendingError,
  } = useQuery({ queryKey: ["trending-courses"], queryFn: getTrending });

  const loading = popularLoading || trendingLoading;
  const queryError = popularError || trendingError;
  const error = queryError ? `Failed to load resources: ${queryError.message}` : "";

  const resolveImageUrl = (image) => {
    if (!image) return FALLBACK_IMAGE;
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${getApiUrl()}/images/${image}`;
  };

  if (loading) {
    return (
      <div className="popular-resources-container">
        <section className="popular-section">
          <h2>⭐ Most Popular Courses</h2>
          <p className="section-subtitle">Based on views and user engagement</p>
          <div className="popular-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </section>
      </div>
    );
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
                  src={resolveImageUrl(course.image || course.image_url || course.imagePath)} 
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
                  <Link to={`/resources/${course.id}`} className="view-course-btn">
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
                    src={resolveImageUrl(course.image || course.image_url || course.imagePath)} 
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
                  <Link to={`/resources/${course.id}`} className="trending-btn">
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
