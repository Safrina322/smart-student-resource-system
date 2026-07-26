import * as searchRepository from "../repositories/searchRepository.js";

const escapeLikeWildcards = (value) => value.replace(/[%_]/g, (match) => `\\${match}`);

export const search = async (query) => {
  const like = `%${escapeLikeWildcards(query)}%`;

  const [courses, lecturerResources] = await Promise.all([
    searchRepository.searchCourses(like),
    searchRepository.searchLecturerResources(like),
  ]);

  // Best-effort logging for the popular-searches feature; a logging
  // failure should never break search itself.
  searchRepository.logQuery(query).catch((err) => {
    console.error("⚠️ Failed to log search query:", err.message);
  });

  return {
    courses: courses.map((row) => ({ ...row, type: "course" })),
    lecturerResources: lecturerResources.map((row) => ({ ...row, type: "lecturer_resource" })),
  };
};

export const getPopularSearches = (limit) => searchRepository.getPopularQueries(limit);
