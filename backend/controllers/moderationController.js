import * as moderationService from "../services/moderationService.js";

export const listQueue = async (req, res) => {
  const resources = await moderationService.listQueue(req.query.status || "pending");
  res.json(resources);
};

export const approve = async (req, res) => {
  const resource = await moderationService.approve(req.params.id, req.user.id, req.body.comment);
  res.json({ message: "Resource approved.", resource });
};

export const reject = async (req, res) => {
  const resource = await moderationService.reject(req.params.id, req.user.id, req.body.comment);
  res.json({ message: "Resource rejected.", resource });
};

export const flag = async (req, res) => {
  const resource = await moderationService.flag(req.params.id, req.user.id, req.body.comment);
  res.json({ message: "Resource flagged.", resource });
};
