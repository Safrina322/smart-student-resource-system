import * as popularResourceRepository from "../repositories/popularResourceRepository.js";

export const getPopularCourses = async () => ({
  success: true,
  popularCourses: await popularResourceRepository.findPopularCourses(),
});

export const getPopularLessons = async (courseId) => ({
  success: true,
  popularLessons: await popularResourceRepository.findPopularLessons(courseId),
});

export const getTrending = async () => ({
  success: true,
  trendingCourses: await popularResourceRepository.findTrending(),
});
