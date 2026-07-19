import * as popularResourceService from "../services/popularResourceService.js";

export const popularCourses = async (req, res) => {
  res.json(await popularResourceService.getPopularCourses());
};

export const popularLessons = async (req, res) => {
  res.json(await popularResourceService.getPopularLessons(req.params.courseId));
};

export const trending = async (req, res) => {
  res.json(await popularResourceService.getTrending());
};
