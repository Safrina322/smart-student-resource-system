import * as courseService from "../services/courseService.js";

export const list = async (req, res) => {
  const result = await courseService.listAll(req.query);
  res.json(result);
};

export const getOne = async (req, res) => {
  const course = await courseService.getById(req.params.id);
  res.json(course);
};

export const getLessons = async (req, res) => {
  const lessons = await courseService.getLessons(req.params.id);
  res.json(lessons);
};
