import * as notificationRepository from "../repositories/notificationRepository.js";
import { emitToUser } from "../utils/socket.js";
import logger from "../utils/logger.js";

export const listForUser = async (userId) => {
  const notifications = await notificationRepository.findByUser(userId);
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  return { notifications, unreadCount };
};

// Fire-and-forget by design: a notification failing to send should never
// break the action that triggered it (approving a request, replying to a
// comment, etc.). Writes to the DB first so the notification is never lost
// even if no one is connected to receive the live push.
export const notifyUser = ({ userId, title, message, type = "info", meta = null }) => {
  if (!userId || !title || !message) return;

  notificationRepository
    .create({ userId, title, message, type, meta })
    .then((notification) => {
      emitToUser(userId, "notification:new", notification);
    })
    .catch((err) => {
      logger.warn({ err }, "Notification write warning");
    });
};

export const markRead = (id, userId) => notificationRepository.markRead(id, userId);

export const markAllRead = (userId) => notificationRepository.markAllRead(userId);
