import { useEffect, useState } from "react";
import {
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiOutlineChatBubbleLeftRight,
  HiOutlineStar,
  HiOutlineBookmark,
  HiOutlineClock,
} from "react-icons/hi2";
import { getAchievements, getActivityHistory } from "../services/achievementService.js";
import { SkeletonCard } from "../components/Skeleton.jsx";
import "../styles/Achievements.css";

const ACTIVITY_ICONS = {
  resource_view: HiOutlineEye,
  request_submitted: HiOutlinePaperAirplane,
  comment: HiOutlineChatBubbleLeftRight,
  rating: HiOutlineStar,
  bookmark: HiOutlineBookmark,
};

const ACTIVITY_LABELS = {
  resource_view: "Viewed",
  request_submitted: "Requested",
  comment: "Commented on",
  rating: "Rated",
  bookmark: "Bookmarked",
};

function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAchievements(), getActivityHistory()])
      .then(([achievementData, historyData]) => {
        setAchievements(achievementData.achievements || []);
        setStats(achievementData.stats || null);
        setHistory(Array.isArray(historyData) ? historyData : []);
      })
      .catch((err) => setError(err.message || "Failed to load achievements"))
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="achievements-page">
      <header className="achievements-header">
        <p className="achievements-kicker">Your Progress</p>
        <h1>Achievements & Activity</h1>
        <p className="achievements-subtitle">
          {loading ? "Loading..." : `${unlockedCount} of ${achievements.length} badges unlocked`}
        </p>
      </header>

      {error && <p className="achievements-error">{error}</p>}

      <section className="achievements-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : achievements.map((badge) => (
              <div
                key={badge.key}
                className={`achievement-badge ${badge.unlocked ? "unlocked" : "locked"}`}
              >
                <span className="achievement-icon">{badge.icon}</span>
                <h3>{badge.title}</h3>
                <p>{badge.description}</p>
                <div className="achievement-progress-track">
                  <span
                    className="achievement-progress-fill"
                    style={{ width: `${Math.min(100, (badge.progress / badge.target) * 100)}%` }}
                  />
                </div>
                <span className="achievement-progress-label">
                  {badge.progress} / {badge.target}
                </span>
              </div>
            ))}
      </section>

      <section className="activity-history-section">
        <h2><HiOutlineClock /> Activity History</h2>

        {!loading && history.length === 0 ? (
          <p className="achievements-empty">No activity yet — start exploring resources.</p>
        ) : (
          <div className="activity-history-list">
            {history.map((item, index) => {
              const Icon = ACTIVITY_ICONS[item.kind] || HiOutlineClock;
              return (
                <div className="activity-history-item" key={`${item.kind}-${index}`}>
                  <span className="activity-history-icon"><Icon /></span>
                  <div className="activity-history-content">
                    <p>
                      <strong>{ACTIVITY_LABELS[item.kind] || item.kind}</strong> {item.title}
                    </p>
                    <span className="activity-history-subtitle">{item.subtitle}</span>
                  </div>
                  <span className="activity-history-time">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default AchievementsPage;
