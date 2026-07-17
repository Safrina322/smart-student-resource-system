import * as lecturerResourceService from "../services/lecturerResourceService.js";

export const upload = async (req, res) => {
  const resource = await lecturerResourceService.upload(req.user.id, req.body);
  res.status(201).json({ message: "Resource uploaded and pending moderation.", resource });
};

export const listMine = async (req, res) => {
  const resources = await lecturerResourceService.listMine(req.user.id);
  res.json(resources);
};

export const update = async (req, res) => {
  const resource = await lecturerResourceService.update(req.params.id, req.user.id, req.body);
  res.json({ message: "Resource updated and resubmitted for moderation.", resource });
};

export const remove = async (req, res) => {
  await lecturerResourceService.remove(req.params.id, req.user.id);
  res.json({ message: "Resource deleted." });
};

export const analytics = async (req, res) => {
  const summary = await lecturerResourceService.analytics(req.user.id);
  res.json(summary);
};
