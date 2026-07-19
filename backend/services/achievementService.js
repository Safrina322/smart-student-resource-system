import * as achievementRepository from "../repositories/achievementRepository.js";

// Every badge is derived from real counts in getStats() - nothing here is
// hardcoded as "unlocked"; a badge only shows unlocked if the user's actual
// activity crosses its target.
const BADGE_CATALOG = [
  {
    key: "first_steps",
    title: "First Steps",
    description: "Joined SmartStudent",
    icon: "🎉",
    statKey: null,
    target: 1,
  },
  {
    key: "explorer",
    title: "Explorer",
    description: "View 5 courses or lessons",
    icon: "🧭",
    statKey: "resourcesViewed",
    target: 5,
  },
  {
    key: "contributor",
    title: "Contributor",
    description: "Submit your first resource request",
    icon: "📤",
    statKey: "requestsSubmitted",
    target: 1,
  },
  {
    key: "approved",
    title: "Approved!",
    description: "Get a resource request approved",
    icon: "✅",
    statKey: "requestsApproved",
    target: 1,
  },
  {
    key: "bookworm",
    title: "Bookworm",
    description: "Bookmark 5 resources",
    icon: "🔖",
    statKey: "bookmarks",
    target: 5,
  },
  {
    key: "reviewer",
    title: "Reviewer",
    description: "Rate 3 resources",
    icon: "⭐",
    statKey: "ratingsGiven",
    target: 3,
  },
  {
    key: "conversationalist",
    title: "Conversationalist",
    description: "Post 5 comments",
    icon: "💬",
    statKey: "commentsPosted",
    target: 5,
  },
];

export const getAchievements = async (userId) => {
  const stats = await achievementRepository.getStats(userId);

  const achievements = BADGE_CATALOG.map((badge) => {
    const progress = badge.statKey === null ? 1 : stats[badge.statKey] || 0;
    return {
      key: badge.key,
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      target: badge.target,
      progress: Math.min(progress, badge.target),
      unlocked: progress >= badge.target,
    };
  });

  return { stats, achievements };
};

export const getActivityHistory = (userId) => achievementRepository.getActivityHistory(userId);
