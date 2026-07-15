import { queryAsync } from "../db.js";

export const findRecent = (limit = 20) =>
  queryAsync(
    `SELECT
       id,
       title,
       COALESCE(description, '') AS description,
       COALESCE(category, 'General') AS category,
       COALESCE(image_url, '') AS image_url,
       COALESCE(resource_link, '') AS resource_link,
       created_at
     FROM resources
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );
