import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiUrl } from "../utils/api";
import { getCourse, getCourseLessons } from "../services/courseService.js";
import { trackAccess } from "../services/learningProgressService.js";
import { trackEvent } from "../services/analyticsService.js";
import "../styles/Resources.css";

function buildLearningPlan(course) {
  const subject = course.subject || "this subject";
  const title = course.title || "Course";

  return [
    {
      title: "Module 1: Foundation",
      summary: `Understand the core concepts and vocabulary used in ${subject}.`,
      tasks: [
        `Read the course overview and map key terms for ${title}.`,
        "Create short notes for each core concept.",
      ],
    },
    {
      title: "Module 2: Guided Practice",
      summary: "Apply concepts through examples and small practical tasks.",
      tasks: [
        "Solve 3 beginner-level exercises.",
        "Review one solved example and explain each step in your own words.",
      ],
    },
    {
      title: "Module 3: Build and Reflect",
      summary: "Build a small mini-project and evaluate your understanding.",
      tasks: [
        `Create one mini project using ideas from ${title}.`,
        "Write what was difficult and what you can improve in the next attempt.",
      ],
    },
  ];
}

function CourseLearningPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setError("");
      try {
        const [courseData, lessonData] = await Promise.all([
          getCourse(id),
          getCourseLessons(id),
        ]);
        setCourse(courseData);
        setLessons(Array.isArray(lessonData) ? lessonData : []);

        // Track course access for continue learning + popularity
        const token = localStorage.getItem("token");
        if (token) {
          // Track in user learning progress
          trackAccess(Number(id)).catch(() => {
            // Silently ignore tracking errors
          });

          // Track as analytics event for popularity ranking
          trackEvent({
            eventType: "course_access",
            courseId: Number(id),
            metadata: { courseTitle: courseData?.title },
          }).catch(() => {
            // Silently ignore tracking errors
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const learningPlan = useMemo(() => {
    if (!course) return [];
    return buildLearningPlan(course);
  }, [course]);

  const resolveImageUrl = (image) => {
    if (!image) return "https://via.placeholder.com/800x300?text=Course";
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${getApiUrl()}/images/${image}`;
  };

  const resolveResourceUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${getApiUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const trackResourceOpen = (lesson) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    trackEvent({
      eventType: "resource_open",
      courseId: Number(id),
      lessonId: lesson.id,
      resourceType: lesson.resource_type,
      metadata: {
        lessonTitle: lesson.lesson_title,
      },
    }).catch(() => {
      // Do not block resource opening if analytics fails.
    });
  };

  if (loading) {
    return (
      <div className="resources-page">
        <p style={{ textAlign: "center" }}>Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="resources-page">
        <p style={{ color: "#f87171", textAlign: "center", marginBottom: "16px" }}>
          {error || "Course not found"}
        </p>
        <div style={{ textAlign: "center" }}>
          <Link to="/resources" className="learn-back-link">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="resources-page">
      <div className="learn-header-card">
        <Link to="/resources" className="learn-back-link">
          Back to courses
        </Link>

        <div className="learn-hero">
          <img
            src={resolveImageUrl(course.image)}
            alt={course.title}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/800x300?text=Course";
            }}
          />

          <div className="learn-hero-content">
            <h1>{course.title}</h1>
            <p>{course.description}</p>

            <div className="learn-meta-row">
              <span className="badge">{course.level || "Beginner"}</span>
              <span>{course.subject || "General"}</span>
              <span>{course.duration || "Self-paced"}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="learning-plan-section">
        <h2>What You Will Learn</h2>
        <div className="learning-steps-grid">
          {learningPlan.map((step) => (
            <article className="learning-step-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.summary}</p>
              <ul>
                {step.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="learning-plan-section">
        <h2>Approved Learning Resources</h2>
        {lessons.length === 0 ? (
          <div className="learning-step-card">
            <p>No approved resources yet for this course.</p>
          </div>
        ) : (
          <div className="learning-steps-grid">
            {lessons.map((lesson) => (
              <article className="learning-step-card" key={lesson.id}>
                <h3>{lesson.lesson_order}. {lesson.lesson_title}</h3>
                <p>{lesson.lesson_description}</p>
                <p><strong>Type:</strong> {lesson.resource_type}</p>
                <a
                  href={resolveResourceUrl(lesson.resource_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-open-btn"
                  onClick={() => trackResourceOpen(lesson)}
                >
                  Open {lesson.resource_type}
                </a>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="learning-plan-section">
        <h2>Start Learning Checklist</h2>
        <div className="learning-step-card">
          <ul>
            <li>Spend 20-30 minutes per day on one module task.</li>
            <li>Practice after each topic instead of only reading theory.</li>
            <li>Track progress weekly and revisit weak areas.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default CourseLearningPage;
