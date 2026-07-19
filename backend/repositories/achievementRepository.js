import { queryAsync } from "../db.js";

export const getStats = async (userId) => {
  const [
    [resourcesViewed],
    [requestsSubmitted],
    [requestsApproved],
    [bookmarks],
    [ratingsGiven],
    [commentsPosted],
  ] = await Promise.all([
    queryAsync(
      "SELECT COUNT(*) AS count FROM analytics_events WHERE user_id = ? AND event_type = 'resource_open'",
      [userId]
    ),
    queryAsync("SELECT COUNT(*) AS count FROM resource_requests WHERE user_id = ?", [userId]),
    queryAsync(
      "SELECT COUNT(*) AS count FROM resource_requests WHERE user_id = ? AND status = 'approved'",
      [userId]
    ),
    queryAsync("SELECT COUNT(*) AS count FROM resource_bookmarks WHERE user_id = ?", [userId]),
    queryAsync("SELECT COUNT(*) AS count FROM resource_ratings WHERE user_id = ?", [userId]),
    queryAsync("SELECT COUNT(*) AS count FROM resource_comments WHERE user_id = ?", [userId]),
  ]);

  return {
    resourcesViewed: resourcesViewed.count,
    requestsSubmitted: requestsSubmitted.count,
    requestsApproved: requestsApproved.count,
    bookmarks: bookmarks.count,
    ratingsGiven: ratingsGiven.count,
    commentsPosted: commentsPosted.count,
  };
};

// Five different tables, normalized to one shape (kind, title, subtitle,
// created_at) via UNION ALL so the timeline can be a single ORDER BY
// instead of merging five separate result sets in JS.
export const getActivityHistory = (userId) =>
  queryAsync(
    `(
      SELECT 'resource_view' AS kind, c.title AS title,
             COALESCE(cl.lesson_title, 'Course opened') AS subtitle, ae.created_at
      FROM analytics_events ae
      JOIN courses c ON c.id = ae.course_id
      LEFT JOIN course_lessons cl ON cl.id = ae.lesson_id
      WHERE ae.user_id = ? AND ae.event_type = 'resource_open'
    )
    UNION ALL
    (
      SELECT 'request_submitted' AS kind, title,
             CONCAT('Status: ', status) AS subtitle, created_at
      FROM resource_requests
      WHERE user_id = ?
    )
    UNION ALL
    (
      SELECT 'comment' AS kind, lr.title AS title,
             LEFT(c.comment_text, 80) AS subtitle, c.created_at
      FROM resource_comments c
      JOIN lecturer_resources lr ON lr.id = c.resource_id
      WHERE c.user_id = ?
    )
    UNION ALL
    (
      SELECT 'rating' AS kind, lr.title AS title,
             CONCAT('Rated ', r.rating, ' / 5') AS subtitle, r.created_at
      FROM resource_ratings r
      JOIN lecturer_resources lr ON lr.id = r.resource_id
      WHERE r.user_id = ?
    )
    UNION ALL
    (
      SELECT 'bookmark' AS kind, lr.title AS title,
             'Bookmarked' AS subtitle, b.created_at
      FROM resource_bookmarks b
      JOIN lecturer_resources lr ON lr.id = b.resource_id
      WHERE b.user_id = ?
    )
    ORDER BY created_at DESC
    LIMIT 50`,
    [userId, userId, userId, userId, userId]
  );
