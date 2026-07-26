import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineSparkles } from "react-icons/hi2";
import { apiCall, getApiUrl, getAuthHeader } from "../utils/api.js";
import SearchBar from "../components/Searchbar.jsx";
import Filter from "../components/Filter.jsx";
import StarRating from "../components/StarRating.jsx";
import { listResources as listHubResources } from "../services/resourceHubService.js";
import { searchAssist } from "../services/aiService.js";
import "../styles/Resources.css";
import "../styles/ResourceAIPanel.css";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="600" height="360" rx="24" fill="url(#g)"/>
      <circle cx="420" cy="110" r="54" fill="rgba(255,255,255,0.12)"/>
      <rect x="70" y="86" width="220" height="18" rx="9" fill="rgba(255,255,255,0.7)"/>
      <rect x="70" y="124" width="300" height="14" rx="7" fill="rgba(255,255,255,0.45)"/>
      <rect x="70" y="154" width="260" height="14" rx="7" fill="rgba(255,255,255,0.35)"/>
      <text x="70" y="254" fill="#e0f2fe" font-family="Arial, sans-serif" font-size="28" font-weight="700">Study Resource</text>
    </svg>
  `);

function ResourceListPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseError, setCourseError] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [hubResources, setHubResources] = useState([]);
  const [hubLoading, setHubLoading] = useState(true);
  const [aiAssist, setAiAssist] = useState({ loading: false, answer: null, error: "" });

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
    setAiAssist({ loading: false, answer: null, error: "" });
  }, [searchTerm]);

  const handleAskAI = async () => {
    const query = searchTerm.trim();
    if (!query || aiAssist.loading) return;

    setAiAssist({ loading: true, answer: null, error: "" });
    try {
      const data = await searchAssist(query);
      setAiAssist({ loading: false, answer: data.answer, error: "" });
    } catch (err) {
      setAiAssist({ loading: false, answer: null, error: err.message || "Could not get an AI answer" });
    }
  };

  const getSessionContext = () => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      return {
        tokenType: "adminToken",
        loginPath: "/admin/login",
        clearSession: () => {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminName");
          localStorage.removeItem("adminEmail");
        },
      };
    }

    return {
      tokenType: "token",
      loginPath: "/login",
      clearSession: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("user");
      },
    };
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
    setResourceError("");
    const session = getSessionContext();
    try {
      const [coursesResult, resourcesResult] = await Promise.allSettled([
        apiCall("/api/courses", {
          headers: getAuthHeader(session.tokenType),
        }),
        apiCall("/api/resources", {
          headers: getAuthHeader(session.tokenType),
        }),
      ]);

      if (coursesResult.status === "fulfilled") {
        setCourses(coursesResult.value || []);
      } else {
        const message = getErrorMessage(coursesResult.reason, "Failed to load courses");
        if (isAuthError(message)) {
          session.clearSession();
          navigate(session.loginPath);
          return;
        }

        setCourses([]);
        setCourseError(message);
      }

      if (resourcesResult.status === "fulfilled") {
        setResources(Array.isArray(resourcesResult.value) ? resourcesResult.value : []);
      } else {
        const message = getErrorMessage(resourcesResult.reason, "Failed to load saved resources");
        if (isAuthError(message)) {
          session.clearSession();
          navigate(session.loginPath);
          return;
        }

        setResources([]);
        setResourceError(message);
      }
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load resources");
      if (isAuthError(message)) {
        session.clearSession();
        navigate(session.loginPath);
        return;
      }

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

  const filteredResources = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      const title = (resource.title || "").toLowerCase();
      const category = (resource.category || "").toLowerCase();
      const description = (resource.description || "").toLowerCase();
      const link = (resource.resource_link || "").toLowerCase();

      const matchesKeyword =
        !keyword ||
        title.includes(keyword) ||
        category.includes(keyword) ||
        description.includes(keyword) ||
        link.includes(keyword);

      const matchesSubject = !subjectFilter || resource.category === subjectFilter;
      const matchesLevel = !levelFilter || true;

      return matchesKeyword && matchesSubject && matchesLevel;
    });
  }, [levelFilter, resources, searchTerm, subjectFilter]);

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

  const statusMessages = [courseError, resourceError].filter(Boolean);
  const totalVisibleResources = filteredOnlineResources.length + filteredResources.length;

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
            <span className="stat-label">Saved</span>
            <strong>{resources.length}</strong>
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
          {aiAssist.error && <p className="ai-tab-error">{aiAssist.error}</p>}
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
          <p className="empty-saved-resources">Loading community resources...</p>
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

      <section className="saved-resources-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Saved</p>
            <h2>Stored Resources from the Database</h2>
          </div>
          <p className="section-note">
            These are the actual link resources saved in your backend table and protected by login.
          </p>
        </div>

        {filteredResources.length === 0 ? (
          <p className="empty-saved-resources">No saved resources matched your search yet.</p>
        ) : (
          <div className="saved-resources-grid">
            {filteredResources.map((resource) => (
              <article key={resource.id} className="saved-resource-card">
                <div className="saved-resource-image-wrap">
                  <img
                    src={resource.image_url || resource.image || resource.imagePath || FALLBACK_IMAGE}
                    alt={resource.title}
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="saved-resource-content">
                  <span className="meta-pill">{resource.category || "General"}</span>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <a
                    href={resource.resource_link}
                    target="_blank"
                    rel="noreferrer"
                    className="resource-link-btn"
                  >
                    Open Resource
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="resources-loading">Loading your learning space...</div>
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
