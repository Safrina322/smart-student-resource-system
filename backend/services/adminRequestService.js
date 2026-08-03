import { AppError } from "../utils/AppError.js";
import * as adminRequestRepository from "../repositories/adminRequestRepository.js";
import { sendRequestStatusEmail } from "../utils/mailer.js";
import { notifyUser } from "./notificationService.js";
import { logAdminAction } from "../utils/auditLogger.js";
import { buildPaginationMeta } from "../utils/pagination.js";
import logger from "../utils/logger.js";

export const listPending = async ({ page, pageSize }) => {
  const { rows, total } = await adminRequestRepository.findPending({ page, pageSize });
  return { items: rows, pagination: buildPaginationMeta(page, pageSize, total) };
};

const resolveOrCreateCourse = async (request) => {
  const existing = await adminRequestRepository.findCourseByTitleAndSubject(
    request.title,
    request.subject
  );
  if (existing) return existing.id;

  const courseImage = request.image?.trim() ? request.image.trim() : "default.jpg";
  const courseDescription = request.description?.trim()
    ? request.description.trim()
    : request.message || "Course created from approved request";
  const courseLevel = request.level?.trim() ? request.level.trim() : "Beginner";
  const courseDuration = request.duration?.trim() ? request.duration.trim() : "Self-paced";

  try {
    return await adminRequestRepository.createCourse({
      title: request.title,
      description: courseDescription,
      subject: request.subject,
      level: courseLevel,
      duration: courseDuration,
      image: courseImage,
    });
  } catch (err) {
    // Race: another request for the same title/subject was approved between
    // our lookup and this insert. Reuse the course it created instead of
    // failing the whole approval.
    if (err.code === "ER_DUP_ENTRY") {
      const dup = await adminRequestRepository.findCourseByTitle(request.title);
      if (dup) return dup.id;
    }
    throw new AppError(`DB error: ${err.message}`, 500);
  }
};

export const approve = async (id, { comment, adminId }) => {
  const request = await adminRequestRepository.findWithUserById(id);
  if (!request) {
    throw new AppError("Request not found", 404);
  }

  const adminComment = comment || "Request approved by admin";
  const normalizedType = ["PDF", "Video", "Link"].includes(request.type) ? request.type : "Link";
  const courseId = await resolveOrCreateCourse(request);

  const resolvedLessonTitle = (request.lesson_title || request.title || "New Lesson").trim();
  const resolvedLessonDescription = request.lesson_description || request.message || "";
  const resolvedResourceUrl = (request.resource_url || "").trim();

  const finishApproval = async (adminEmailComment, message) => {
    await adminRequestRepository.markApproved(id, courseId);

    adminRequestRepository.addHistoryEntry({
      requestId: Number(id),
      status: "approved",
      note: adminComment,
      adminId,
    });

    if (request.user_email_notifications_enabled !== 0) {
      sendRequestStatusEmail({
        to: request.user_email,
        studentName: request.username,
        courseTitle: request.title,
        status: "approved",
        resourceType: normalizedType,
        adminComment: adminEmailComment,
      }).catch((err) => logger.error({ err }, "Email send failed (approve)"));
    }

    notifyUser({
      userId: request.user_id,
      type: "request_approved",
      title: "Request Approved",
      message: `Your request for "${request.title}" has been ${message.notify}.`,
      meta: JSON.stringify({ requestId: Number(id), courseId }),
    });

    logAdminAction({
      adminId,
      actionType: "request_approved",
      targetType: "resource_request",
      targetId: Number(id),
      details: message.audit,
    });

    return { message: message.response, courseId };
  };

  // Legacy requests may not have a URL - approve the course and let admin
  // add the lesson later, rather than blocking approval on it.
  if (!resolvedResourceUrl) {
    return finishApproval("Approved. Please contact admin to publish lesson URL/file.", {
      notify: "approved",
      audit: `Approved request ${id} for course ${courseId} (legacy URL missing)`,
      response: "Request approved. No lesson URL found, so lesson was not published.",
    });
  }

  try {
    await adminRequestRepository.createLesson({
      courseId,
      lessonTitle: resolvedLessonTitle,
      lessonDescription: resolvedLessonDescription,
      resourceType: normalizedType,
      resourceUrl: resolvedResourceUrl,
      lessonOrder: Number(request.lesson_order) || 1,
    });
  } catch (err) {
    throw new AppError(`Lesson publish failed: ${err.message}`, 500);
  }

  return finishApproval(adminComment, {
    notify: "approved and published",
    audit: `Approved request ${id}; lesson published in course ${courseId}`,
    response: "Request approved and lesson published",
  });
};

export const reject = async (id, { comment, adminId }) => {
  const request = await adminRequestRepository.findWithUserById(id);
  if (!request) {
    throw new AppError("Request not found", 404);
  }

  const adminComment = comment || "Request rejected by admin";
  await adminRequestRepository.markRejected(id);

  adminRequestRepository.addHistoryEntry({
    requestId: Number(id),
    status: "rejected",
    note: adminComment,
    adminId,
  });

  if (request.user_email_notifications_enabled !== 0) {
    sendRequestStatusEmail({
      to: request.user_email,
      studentName: request.username,
      courseTitle: request.title,
      status: "rejected",
      resourceType: request.type,
      adminComment,
    }).catch((err) => logger.error({ err }, "Email send failed (reject)"));
  }

  notifyUser({
    userId: request.user_id,
    type: "request_rejected",
    title: "Request Rejected",
    message: `Your request for "${request.title}" was rejected.`,
    meta: JSON.stringify({ requestId: Number(id) }),
  });

  logAdminAction({
    adminId,
    actionType: "request_rejected",
    targetType: "resource_request",
    targetId: Number(id),
    details: `Rejected request ${id}`,
  });
};
