import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineSparkles } from "react-icons/hi2";
import { getApiUrl } from "../utils/api.js";
import SearchBar from "../components/Searchbar.jsx";
import Filter from "../components/Filter.jsx";
import StarRating from "../components/StarRating.jsx";
import { listResources as listHubResources } from "../services/resourceHubService.js";
import { listCourses } from "../services/courseService.js";
import { searchAssist } from "../services/aiService.js";
import { notify } from "../utils/notify.js";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/Resources.css";
import "../styles/ResourceAIPanel.css";

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

function ResourceListPage() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseError, setCourseError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [hubResources, setHubResources] = useState([]);
  const [hubLoading, setHubLoading] = useState(true);
  const [aiAssist, setAiAssist] = useState({ loading: false, answer: null });

  const onlineResources = [
    {
      id: "mdn-html",
      title: "MDN Web Docs - HTML",
      description: "Official HTML guide and reference from Mozilla.",
      type: "Link",
      subject: "Web Development",
      level: "Beginner",
      url: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML",
    },
    {
      id: "freecodecamp-js",
      title: "freeCodeCamp - JavaScript Basics",
      description: "Free interactive lessons to learn JavaScript fundamentals.",
      type: "Video",
      subject: "Programming",
      level: "Beginner",
      url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
    },
    {
      id: "khan-math",
      title: "Khan Academy - Algebra 1",
      description: "Step-by-step algebra lessons, practice, and quizzes.",
      type: "Link",
      subject: "Mathematics",
      level: "Beginner",
      url: "https://www.khanacademy.org/math/algebra",
    },
    {
      id: "google-ds",
      title: "Google Digital Garage",
      description: "Free online courses in digital skills, career growth, and productivity tools.",
      type: "Link",
      subject: "Career Skills",
      level: "Intermediate",
      url: "https://grow.google/intl/en_in/",
    },
    {
      id: "coursera-ai",
      title: "Coursera - AI for Everyone",
      description: "Beginner-friendly introduction to artificial intelligence concepts.",
      type: "Link",
      subject: "Artificial Intelligence",
      level: "Intermediate",
      url: "https://www.coursera.org/learn/ai-for-everyone",
    },
  ];

  // A previous AI answer no longer matches once the query changes.
  useEffect(() => {
    setAiAssist({ loading: false, answer: null });
  }, [searchTerm]);

  const handleAskAI = async () => {
    const query = searchTerm.trim();
    if (!query || aiAssist.loading) return;

    setAiAssist({ loading: true, answer: null });
    try {
      const data = await searchAssist(query);
      setAiAssist({ loading: false, answer: data.answer });
    } catch (err) {
      setAiAssist({ loading: false, answer: null });
      notify.error(err.message || "Could not get an AI answer");
    }
  };

  const isAuthError = (message) => {
    const normalizedMessage = (message || "").toLowerCase();
    return (
      normalizedMessage.includes("token expired") ||
      normalizedMessage.includes("invalid token") ||
      normalizedMessage.includes("no token provided") ||
      normalizedMessage.includes("unauthorized") ||
      normalizedMessage.includes("forbidden")
    );
  };

  const getErrorMessage = (error, fallbackMessage) => {
    return error?.response?.data?.message || error?.message || fallbackMessage;
  };

  const fetchAllData = async () => {
    setLoading(true);
    setCourseError("");
    try {
      const data = await listCourses();
      setCourses(data || []);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load courses");
      if (isAuthError(message)) {
        const loginPath = isAdminAuthenticated ? "/admin/login" : "/login";
        await logout();
        navigate(loginPath);
        return;
      }

      setCourses([]);
      setCourseError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    listHubResources()
      .then((data) => setHubResources(Array.isArray(data) ? data : []))
      .catch(() => setHubResources([]))
      .finally(() => setHubLoading(false));
  }, []);

  const handleImageError = (e) => {
    e.target.src = FALLBACK_IMAGE;
  };

  const resolveImageUrl = (image) => {
    if (!image) return FALLBACK_IMAGE;
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${getApiUrl()}/images/${image}`;
  };

  const subjectOptions = useMemo(() => {
    return Array.from(
      new Set(courses.map((course) => course.subject).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const levelOptions = useMemo(() => {
    return Array.from(
      new Set(courses.map((course) => course.level).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const title = (course.title || "").toLowerCase();
      const subject = (course.subject || "").toLowerCase();
      const description = (course.description || "").toLowerCase();
      const level = (course.level || "").toLowerCase();

      const matchesKeyword =
        !keyword ||
        title.includes(keyword) ||
        subject.includes(keyword) ||
        description.includes(keyword) ||
        level.includes(keyword);

      const matchesSubject = !subjectFilter || course.subject === subjectFilter;
      const matchesLevel = !levelFilter || course.level === levelFilter;

      return matchesKeyword && matchesSubject && matchesLevel;
    });
  }, [courses, levelFilter, searchTerm, subjectFilter]);

  const filteredOnlineResources = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return onlineResources.filter((resource) => {
      const title = (resource.title || "").toLowerCase();
      const subject = (resource.subject || "").toLowerCase();
      const description = (resource.description || "").toLowerCase();
      const level = (resource.level || "").toLowerCase();

      const matchesKeyword =
        !keyword ||
        title.includes(keyword) ||
        subject.includes(keyword) ||
        description.includes(keyword) ||
        level.includes(keyword) ||
        (resource.type || "").toLowerCase().includes(keyword);

      return matchesKeyword;
    });
  }, [onlineResources, searchTerm]);

  const filteredHubResources = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return hubResources.filter((resource) => {
      const title = (resource.title || "").toLowerCase();
      const subject = (resource.subject || "").toLowerCase();
      const description = (resource.description || "").toLowerCase();
      const tags = (resource.tags || "").toLowerCase();

      const matchesKeyword =
        !keyword ||
        title.includes(keyword) ||
        subject.includes(keyword) ||
        description.includes(keyword) ||
        tags.includes(keyword);

      const matchesSubject = !subjectFilter || resource.subject === subjectFilter;

      return matchesKeyword && matchesSubject;
    });
  }, [hubResources, searchTerm, subjectFilter]);

  const statusMessages = [courseError].filter(Boolean);
  const totalVisibleResources = filteredOnlineResources.length;

  return (
    <div className="resources-page">
      <section className="resources-hero">
        <div className="resources-hero-copy">
          <p className="hero-kicker">Learning hub</p>
          <h1>Available Courses</h1>
          <p>
            Browse curated links, saved resources, and course cards in one place.
            Filter by subject or level to narrow the list quickly.
          </p>
        </div>

        <div className="resources-hero-stats">
          <div className="stat-card">
            <span className="stat-label">Courses</span>
            <strong>{courses.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Visible now</span>
            <strong>{totalVisibleResources}</strong>
          </div>
        </div>
      </section>

      <div className="resources-controls resources-controls-card">
        <div className="resources-search-wrap">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by title, subject, level..."
            className="resources-search-input"
          />
        </div>
        <Filter
          value={subjectFilter}
          onChange={setSubjectFilter}
          options={subjectOptions}
          placeholder="All subjects"
          className="resources-filter-select"
        />
        <Filter
          value={levelFilter}
          onChange={setLevelFilter}
          options={levelOptions}
          placeholder="All levels"
          className="resources-filter-select"
        />
      </div>

      {searchTerm.trim().length >= 2 && (
        <div className="ai-search-assist">
          <button className="ai-action-btn secondary" onClick={handleAskAI} disabled={aiAssist.loading}>
            <HiOutlineSparkles /> {aiAssist.loading ? "Thinking..." : `Ask AI about "${searchTerm.trim()}"`}
          </button>
          {aiAssist.answer && (
            <div className="ai-search-answer">
              <HiOutlineSparkles />
              <p>{aiAssist.answer}</p>
            </div>
          )}
        </div>
      )}

      {statusMessages.length > 0 && (
        <div className="resources-alert" role="alert">
          <strong>Some data could not be loaded.</strong>
          <p>{statusMessages.join(" ")}</p>
        </div>
      )}

      <section className="online-resources-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Recommended</p>
            <h2>Online Resources with Direct Links</h2>
          </div>
          <p className="section-note">
            These are public learning links you can open right away for extra study support.
          </p>
        </div>

        <div className="online-resources-grid">
          {filteredOnlineResources.map((resource) => (
            <article key={resource.id} className="online-resource-card">
              <div className="online-resource-top">
                <span className="badge">{resource.type}</span>
                <span className="meta-pill">{resource.level}</span>
              </div>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <div className="online-resource-footer">
                <span>{resource.subject}</span>
                <a href={resource.url} target="_blank" rel="noreferrer" className="resource-link-btn">
                  Open Link
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="online-resources-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Community</p>
            <h2>Lecturer-Contributed Resources</h2>
          </div>
          <p className="section-note">
            Verified uploads from lecturers — rate, bookmark, and discuss with other students.
          </p>
        </div>

        {hubLoading ? (
          <div className="online-resources-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredHubResources.length === 0 ? (
          <p className="empty-saved-resources">No community resources match your search yet.</p>
        ) : (
          <div className="online-resources-grid">
            {filteredHubResources.map((resource) => (
              <Link
                key={resource.id}
                to={`/resource-hub/${resource.id}`}
                className="online-resource-card"
              >
                <div className="online-resource-top">
                  <span className="badge">{resource.resource_type}</span>
                  <span className="meta-pill">{resource.subject || "General"}</span>
                </div>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <div className="online-resource-footer">
                  <StarRating value={Number(resource.average_rating) || 0} size="0.85rem" />
                  <span>by {resource.uploader_name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="course-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="resources-empty-state">
          <p>{courses.length === 0 ? "No courses available yet" : "No matching resources found"}</p>
        </div>
      ) : (
        <div className="course-grid">
          {filteredCourses.map((course) => (
            <Link
              className="course-card"
              key={course.id}
              to={`/resources/${course.id}`}
              aria-label={`Open ${course.title} learning page`}
            >
              <img
                src={resolveImageUrl(course.image || course.image_url || course.imagePath)}
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
