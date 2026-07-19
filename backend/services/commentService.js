import { AppError } from "../utils/AppError.js";
import * as commentRepository from "../repositories/commentRepository.js";
import * as publicResourceRepository from "../repositories/publicResourceRepository.js";
import { notifyUser } from "./notificationService.js";

// Flat rows -> a tree, nesting replies under their parent by
// parent_comment_id. Top-level comments (parent_comment_id === null) keep
// insertion order (oldest first); replies attach to their parent wherever
// it appears, however deep.
const buildCommentTree = (rows) => {
  const byId = new Map(rows.map((row) => [row.id, { ...row, replies: [] }]));
  const roots = [];

  byId.forEach((comment) => {
    if (comment.parent_comment_id && byId.has(comment.parent_comment_id)) {
      byId.get(comment.parent_comment_id).replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
};

export const listForResource = async (resourceId) => {
  const rows = await commentRepository.findByResource(resourceId);
  return buildCommentTree(rows);
};

export const addComment = async ({ resourceId, userId, parentCommentId, commentText }) => {
  const resource = await publicResourceRepository.findApprovedById(resourceId);
  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  let parent = null;
  if (parentCommentId) {
    parent = await commentRepository.findById(parentCommentId);
    if (!parent || parent.resource_id !== Number(resourceId)) {
      throw new AppError("Parent comment not found on this resource", 400);
    }
  }

  const id = await commentRepository.create({ resourceId, userId, parentCommentId, commentText });
  const comment = await commentRepository.findById(id);

  if (parent && parent.user_id !== userId) {
    notifyUser({
      userId: parent.user_id,
      type: "comment_reply",
      title: "New reply to your comment",
      message: `${comment.username || "Someone"} replied on "${resource.title}"`,
      meta: JSON.stringify({ resourceId: Number(resourceId), commentId: id }),
    });
  }

  return comment;
};

export const deleteComment = async (commentId, requester) => {
  const comment = await commentRepository.findById(commentId);
  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  const isOwner = comment.user_id === requester.id;
  const isModerator = requester.role === "moderator";
  if (!isOwner && !isModerator) {
    throw new AppError("You can only delete your own comments", 403);
  }

  await commentRepository.remove(commentId);
};
