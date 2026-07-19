import * as achievementService from "../services/achievementService.js";

export const getAchievements = async (req, res) => {
  const data = await achievementService.getAchievements(req.user.id);
  res.json(data);
};

export const getActivityHistory = async (req, res) => {
  const history = await achievementService.getActivityHistory(req.user.id);
  res.json(history);
};
