import { useEffect, useState } from "react";
import { listCourses } from "../services/courseService.js";
import {
  getCourseLessons,
  addLesson as addLessonRequest,
  updateLesson,
  deleteLesson,
} from "../services/adminLessonService.js";
import { notify } from "../utils/notify.js";
import "../styles/AdminManageLessons.css";

function AdminManageLessons() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [newLessonFile, setNewLessonFile] = useState(null);
  const [newLesson, setNewLesson] = useState({
    lesson_title: "",
    lesson_description: "",
    resource_type: "PDF",
    resource_url: "",
    lesson_order: 1,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const data = await listCourses();
        setCourses(data || []);
        if (data?.length) {
          setSelectedCourseId(String(data[0].id));
        }
      } catch (err) {
        setLoadError(`Failed to load courses: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoadError("");

    const fetchLessons = async () => {
      try {
        const data = await getCourseLessons(selectedCourseId);
        setLessons(data || []);
      } catch (err) {
        setLoadError(`Failed to load lessons: ${err.message}`);
      }
    };

    fetchLessons();
  }, [selectedCourseId]);

  const handleFieldChange = (lessonId, key, value) => {
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, [key]: value } : lesson))
    );
  };

  const handleSave = async (lesson) => {
    try {
      await updateLesson(lesson.id, {
        lesson_title: lesson.lesson_title,
        lesson_description: lesson.lesson_description,
        resource_type: lesson.resource_type,
        resource_url: lesson.resource_url,
        lesson_order: lesson.lesson_order,
      });
      notify.success("Lesson updated successfully");
    } catch (err) {
      notify.error(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (lessonId) => {
    try {
      await deleteLesson(lessonId);
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
      notify.success("Lesson deleted");
    } catch (err) {
      notify.error(`Delete failed: ${err.message}`);
    }
  };

  const handleAddLesson = async () => {
    if (!selectedCourseId) return;

    try {
      const payload = new FormData();
      payload.append("lesson_title", newLesson.lesson_title);
      payload.append("lesson_description", newLesson.lesson_description);
      payload.append("resource_type", newLesson.resource_type);
      payload.append("resource_url", newLesson.resource_url);
      payload.append("lesson_order", newLesson.lesson_order);
      if (newLessonFile) {
        payload.append("resource_file", newLessonFile);
      }

      await addLessonRequest(selectedCourseId, payload);

      const refreshed = await getCourseLessons(selectedCourseId);

      setLessons(refreshed || []);
      setNewLesson({
        lesson_title: "",
        lesson_description: "",
        resource_type: "PDF",
        resource_url: "",
        lesson_order: 1,
      });
      setNewLessonFile(null);
      notify.success("Lesson added successfully");
    } catch (err) {
      notify.error(`Add lesson failed: ${err.message}`);
    }
  };

  return (
    <div className="admin-lessons-page">
      <div className="admin-lessons-card">
        <h2>Manage Course Lessons</h2>

        {loadError && <p className="admin-lessons-status">{loadError}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <label>Select Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <div className="lesson-item add-new-lesson">
              <h3>Add New Lesson</h3>

              <label>Lesson Title</label>
              <input
                value={newLesson.lesson_title}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, lesson_title: e.target.value }))}
              />

              <label>Lesson Description</label>
              <input
                value={newLesson.lesson_description}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, lesson_description: e.target.value }))}
              />

              <label>Resource Type</label>
              <select
                value={newLesson.resource_type}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, resource_type: e.target.value }))}
              >
                <option value="PDF">PDF</option>
                <option value="Video">Video</option>
                <option value="Link">Link</option>
              </select>

              <label>Resource URL (Optional if file chosen)</label>
              <input
                value={newLesson.resource_url}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, resource_url: e.target.value }))}
                placeholder="https://..."
              />

              <label>Or Upload Resource File</label>
              <input
                type="file"
                accept=".pdf,.mp4,.mov,.avi,.mkv,.doc,.docx,.ppt,.pptx,.txt"
                onChange={(e) => setNewLessonFile(e.target.files?.[0] || null)}
              />

              <label>Lesson Order</label>
              <input
                type="number"
                min="1"
                value={newLesson.lesson_order}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, lesson_order: e.target.value }))}
              />

              <div className="lesson-actions">
                <button onClick={handleAddLesson}>Add Lesson</button>
              </div>
            </div>

            {!lessons.length ? (
              <p className="empty-note">No lessons for this course yet.</p>
            ) : (
              <div className="lessons-list">
                {lessons.map((lesson) => (
                  <div className="lesson-item" key={lesson.id}>
                    <label>Lesson Title</label>
                    <input
                      value={lesson.lesson_title || ""}
                      onChange={(e) => handleFieldChange(lesson.id, "lesson_title", e.target.value)}
                    />

                    <label>Lesson Description</label>
                    <input
                      value={lesson.lesson_description || ""}
                      onChange={(e) => handleFieldChange(lesson.id, "lesson_description", e.target.value)}
                    />

                    <label>Resource Type</label>
                    <select
                      value={lesson.resource_type || "Link"}
                      onChange={(e) => handleFieldChange(lesson.id, "resource_type", e.target.value)}
                    >
                      <option value="PDF">PDF</option>
                      <option value="Video">Video</option>
                      <option value="Link">Link</option>
                    </select>

                    <label>Resource URL</label>
                    <input
                      value={lesson.resource_url || ""}
                      onChange={(e) => handleFieldChange(lesson.id, "resource_url", e.target.value)}
                    />

                    <label>Lesson Order</label>
                    <input
                      type="number"
                      min="1"
                      value={lesson.lesson_order || 1}
                      onChange={(e) => handleFieldChange(lesson.id, "lesson_order", e.target.value)}
                    />

                    <div className="lesson-actions">
                      <button onClick={() => handleSave(lesson)}>Save</button>
                      <button className="danger" onClick={() => handleDelete(lesson.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminManageLessons;
