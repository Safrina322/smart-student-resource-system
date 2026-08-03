ALTER TABLE users
  ADD COLUMN email_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1;
