import * as aiService from "../services/aiService.js";

export const summary = async (req, res) => {
  const data = await aiService.summarizeResource(Number(req.params.id));
  res.json(data);
};

export const quiz = async (req, res) => {
  const data = await aiService.generateQuiz(Number(req.params.id), req.query.count);
  res.json(data);
};

export const flashcards = async (req, res) => {
  const data = await aiService.generateFlashcards(Number(req.params.id), req.query.count);
  res.json(data);
};

export const chat = async (req, res) => {
  const data = await aiService.chatWithResource(Number(req.params.id), req.body.message, req.body.history);
  res.json(data);
};

export const studyPlan = async (req, res) => {
  const data = await aiService.generateStudyPlan(req.user.id, req.body);
  res.json(data);
};

export const recommendations = async (req, res) => {
  const data = await aiService.getRecommendations(req.user.id);
  res.json(data);
};

export const searchAssist = async (req, res) => {
  const data = await aiService.searchAssist(req.body.query);
  res.json(data);
};
