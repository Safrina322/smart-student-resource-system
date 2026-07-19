import * as notificationService from "../services/notificationService.js";

export const list = async (req, res) => {
  const data = await notificationService.listForUser(req.user.id);
  res.json(data);
};

export const markRead = async (req, res) => {
  await notificationService.markRead(req.params.id, req.user.id);
  res.json({ message: "Notification marked as read" });
};

export const markAllRead = async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.json({ message: "All notifications marked as read" });
};
