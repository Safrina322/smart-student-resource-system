import * as adminCourseService from "../services/adminCourseService.js";

export const addCourse = async (req, res) => {
  const imageFile = req.files?.image?.[0] || null;
  const resourceFile = req.files?.resource_file?.[0] || null;

  const { courseId } = await adminCourseService.addCourseWithLesson({
    body: req.body,
    imageFile,
    resourceFile,
    adminId: req.admin?.adminId || null,
  });

  res.json({ message: "Course and lesson added successfully", courseId });
};

export const addLesson = async (req, res) => {
  const lessonId = await adminCourseService.addLessonToCourse({
    courseId: req.params.courseId,
    body: req.body,
    resourceFile: req.file || null,
    adminId: req.admin?.adminId || null,
  });

  res.json({ message: "Lesson added", lessonId });
};

export const getLessons = async (req, res) => {
  const lessons = await adminCourseService.getLessons(req.params.courseId);
  res.json(lessons);
};

export const updateLesson = async (req, res) => {
  await adminCourseService.updateLesson(req.params.lessonId, req.body, req.admin?.adminId || null);
  res.json({ message: "Lesson updated" });
};

export const deleteLesson = async (req, res) => {
  await adminCourseService.deleteLesson(req.params.lessonId, req.admin?.adminId || null);
  res.json({ message: "Lesson deleted" });
};
