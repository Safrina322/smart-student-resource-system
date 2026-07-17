import * as searchService from "../services/searchService.js";

export const search = async (req, res) => {
  const results = await searchService.search(req.query.q);
  res.json(results);
};

export const popular = async (req, res) => {
  const results = await searchService.getPopularSearches(req.query.limit);
  res.json(results);
};
