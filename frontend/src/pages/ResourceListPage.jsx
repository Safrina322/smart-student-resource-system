import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall, getApiUrl } from "../utils/api.js";
import SearchBar from "../components/Searchbar.jsx";
import Filter from "../components/Filter.jsx";
import "../styles/Resources.css";

function ResourceListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

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

  return (
    <div className="resources-page">
      <h1>Available Courses</h1>

      <div className="resources-controls">
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

      {error && <p style={{ color: "red", textAlign: "center", margin: "20px 0" }}>{error}</p>}

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading courses...</p>
      ) : filteredCourses.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          {courses.length === 0 ? "No courses available yet" : "No matching resources found"}
        </p>
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
