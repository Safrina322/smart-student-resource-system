import * as learningProgressService from "../services/learningProgressService.js";

export const trackAccess = async (req, res) => {
  await learningProgressService.trackAccess(req.user.id, req.body);
  res.status(200).json({ success: true });
};

export const continueLearning = async (req, res) => {
  const data = await learningProgressService.getContinueLearning(req.user.id);
  res.status(200).json(data);
};
