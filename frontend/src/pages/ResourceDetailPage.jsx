import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineArrowDownTray,
  HiOutlineArrowLeft,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth.js";
import { parseJwtPayload } from "../utils/jwt.js";
import StarRating from "../components/StarRating.jsx";
import {
  getResource,
  recordDownload,
  listComments,
  addComment,
  deleteComment,
  getRatingSummary,
  rateResource,
  toggleBookmark,
  listMyBookmarks,
} from "../services/resourceHubService.js";
import "../styles/ResourceDetail.css";

function CommentThread({ comment, onReply, onDelete, canDelete, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReply(comment.id, replyText.trim());
    setReplyText("");
    setReplying(false);
  };

  return (
    <div className="comment-thread" style={{ marginLeft: depth ? 28 : 0 }}>
      <div className="comment-card">
        <div className="comment-header">
          <strong>{comment.username}</strong>
          <span>{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        <p>{comment.comment_text}</p>
        <div className="comment-actions">
          <button onClick={() => setReplying((prev) => !prev)}>Reply</button>
          {canDelete(comment) && (
            <button className="comment-delete" onClick={() => onDelete(comment.id)}>
              Delete
            </button>
          )}
        </div>

        {replying && (
          <form className="comment-reply-form" onSubmit={submitReply}>
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <button type="submit">Post</button>
          </form>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <CommentThread
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onDelete={onDelete}
          canDelete={canDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function ResourceDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState({ average: 0, count: 0, myRating: null });
  const [bookmarked, setBookmarked] = useState(false);
  const [feedback, setFeedback] = useState("");

  const currentUserId = (() => {
    const token = localStorage.getItem("token");
    return token ? parseJwtPayload(token)?.id : null;
  })();

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [resourceData, commentsData, ratingData] = await Promise.all([
        getResource(id),
        listComments(id),
        getRatingSummary(id),
      ]);
      setResource(resourceData);
      setComments(commentsData);
      setRating(ratingData);

      if (isAuthenticated) {
        const myBookmarks = await listMyBookmarks().catch(() => []);
        setBookmarked(myBookmarks.some((b) => String(b.id) === String(id)));
      }
    } catch (err) {
      setError(err.message || "Resource not found");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleDownload = async () => {
    try {
      const { resourceLink } = await recordDownload(id);
      window.open(resourceLink, "_blank", "noreferrer");
      setResource((prev) => (prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : prev));
    } catch (err) {
      setFeedback(err.message || "Could not open this resource");
    }
  };

  const handleBookmark = async () => {
    try {
      const { bookmarked: nowBookmarked } = await toggleBookmark(id);
      setBookmarked(nowBookmarked);
    } catch (err) {
      setFeedback(err.message || "Could not update bookmark");
    }
  };

  const handleRate = async (stars) => {
    try {
      const summary = await rateResource(id, stars);
      setRating({ ...summary, myRating: stars });
    } catch (err) {
      setFeedback(err.message || "Could not save rating");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment(id, { commentText: newComment.trim() });
      setNewComment("");
      const updated = await listComments(id);
      setComments(updated);
    } catch (err) {
      setFeedback(err.message || "Could not post comment");
    }
  };

  const handleReply = async (parentCommentId, text) => {
    try {
      await addComment(id, { commentText: text, parentCommentId });
      const updated = await listComments(id);
      setComments(updated);
    } catch (err) {
      setFeedback(err.message || "Could not post reply");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      const updated = await listComments(id);
      setComments(updated);
    } catch (err) {
      setFeedback(err.message || "Could not delete comment");
    }
  };

  const canDelete = (comment) =>
    isAuthenticated && (comment.user_id === currentUserId || user?.role === "moderator");

  if (loading) {
    return <div className="resource-detail-page"><p className="resource-detail-status">Loading...</p></div>;
  }

  if (error || !resource) {
    return (
      <div className="resource-detail-page">
        <p className="resource-detail-status">{error || "Resource not found"}</p>
        <Link to="/resources" className="resource-detail-back"><HiOutlineArrowLeft /> Back to Resources</Link>
      </div>
    );
  }

  const tags = (resource.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="resource-detail-page">
      <Link to="/resources" className="resource-detail-back"><HiOutlineArrowLeft /> Back to Resources</Link>

      <div className="resource-detail-card">
        <div className="resource-detail-top">
          <span className="resource-type-badge">{resource.resource_type}</span>
          {isAuthenticated && (
            <button className="bookmark-toggle" onClick={handleBookmark} aria-label="Toggle bookmark">
              {bookmarked ? <HiBookmark /> : <HiOutlineBookmark />}
            </button>
          )}
        </div>

        <h1>{resource.title}</h1>
        <p className="resource-detail-uploader">By {resource.uploader_name}</p>
        <p className="resource-detail-description">{resource.description}</p>

        {tags.length > 0 && (
          <div className="resource-detail-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">#{tag}</span>
            ))}
          </div>
        )}

        <div className="resource-detail-meta">
          {resource.subject && <span>{resource.subject}</span>}
          {resource.department && <span>{resource.department}</span>}
          {resource.semester && <span>Semester {resource.semester}</span>}
          <span>{resource.views} views</span>
          <span>{resource.downloads} downloads</span>
        </div>

        <div className="resource-detail-rating-row">
          <StarRating value={Number(rating.average) || 0} />
          <span className="rating-count">
            {Number(rating.average || 0).toFixed(1)} ({rating.count} rating{rating.count === 1 ? "" : "s"})
          </span>
        </div>

        {isAuthenticated && (
          <div className="resource-detail-your-rating">
            <span>Your rating:</span>
            <StarRating value={rating.myRating || 0} onRate={handleRate} size="1.4rem" />
          </div>
        )}

        {feedback && <p className="resource-detail-feedback">{feedback}</p>}

        <button className="resource-download-btn" onClick={handleDownload}>
          <HiOutlineArrowDownTray /> Open / Download Resource
        </button>
      </div>

      <section className="resource-comments-section">
        <h2><HiOutlineChatBubbleLeftRight /> Discussion ({comments.length})</h2>

        {isAuthenticated ? (
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              type="text"
              placeholder="Share your thoughts on this resource..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        ) : (
          <p className="comment-login-hint">
            <Link to="/login">Log in</Link> to join the discussion.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="resource-detail-status">No comments yet — be the first to share your thoughts.</p>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDeleteComment}
              canDelete={canDelete}
            />
          ))
        )}
      </section>
    </div>
  );
}

export default ResourceDetailPage;
