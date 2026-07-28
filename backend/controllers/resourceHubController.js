import * as publicResourceService from "../services/publicResourceService.js";
import * as commentService from "../services/commentService.js";
import * as ratingService from "../services/ratingService.js";
import * as bookmarkService from "../services/bookmarkService.js";

export const list = async (req, res) => {
  const result = await publicResourceService.listApproved(req.query);
  res.json(result);
};

export const detail = async (req, res) => {
  const resource = await publicResourceService.getDetail(req.params.id);
  res.json(resource);
};

export const download = async (req, res) => {
  const result = await publicResourceService.recordDownload(req.params.id);
  res.json(result);
};

export const listComments = async (req, res) => {
  const comments = await commentService.listForResource(req.params.id);
  res.json(comments);
};

export const addComment = async (req, res) => {
  const comment = await commentService.addComment({
    resourceId: req.params.id,
    userId: req.user.id,
    parentCommentId: req.body.parentCommentId,
    commentText: req.body.commentText,
  });
  res.json({ message: "Comment added", comment });
};

export const deleteComment = async (req, res) => {
  await commentService.deleteComment(req.params.commentId, req.user);
  res.json({ message: "Comment deleted" });
};

export const rate = async (req, res) => {
  const summary = await ratingService.rate(req.params.id, req.user.id, req.body.rating);
  res.json({ message: "Rating saved", ...summary });
};

export const ratingSummary = async (req, res) => {
  const summary = await ratingService.getSummary(req.params.id, req.user?.id);
  res.json(summary);
};

export const toggleBookmark = async (req, res) => {
  const result = await bookmarkService.toggle(req.params.id, req.user.id);
  res.json(result);
};

export const myBookmarks = async (req, res) => {
  const bookmarks = await bookmarkService.listMine(req.user.id);
  res.json(bookmarks);
};
