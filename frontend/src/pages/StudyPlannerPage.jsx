import { useState } from "react";
import { HiOutlineSparkles, HiOutlineCalendarDays } from "react-icons/hi2";
import { generateStudyPlan } from "../services/aiService.js";
import "../styles/StudyPlanner.css";

function StudyPlannerPage() {
  const [goal, setGoal] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(6);
  const [targetWeeks, setTargetWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError("");
    setPlan(null);
    setCompletedTasks({});

    try {
      const data = await generateStudyPlan({ goal: goal.trim(), hoursPerWeek, targetWeeks });
      setPlan(data);
    } catch (err) {
      setError(err.message || "Could not generate a study plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (weekNumber, taskIndex) => {
    const key = `${weekNumber}-${taskIndex}`;
    setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="study-planner-page">
      <div className="study-planner-hero">
        <p className="hero-kicker">AI Study Tools</p>
        <h1>
          <HiOutlineCalendarDays /> Study Planner
        </h1>
        <p>Tell us your goal and available time, and AI will build a week-by-week plan tailored to you.</p>
      </div>

      <form className="study-planner-form" onSubmit={handleSubmit}>
        <label>
          What are you studying for?
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Pass my data structures final exam, or catch up on missed calculus lectures"
            rows={3}
            required
          />
        </label>

        <div className="study-planner-form-row">
          <label>
            Hours per week
            <input
              type="number"
              min={1}
              max={60}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Duration (weeks)
            <input
              type="number"
              min={1}
              max={26}
              value={targetWeeks}
              onChange={(e) => setTargetWeeks(Number(e.target.value))}
              required
            />
          </label>
        </div>

        <button type="submit" className="ai-action-btn" disabled={loading || !goal.trim()}>
          <HiOutlineSparkles /> {loading ? "Building your plan..." : "Generate Study Plan"}
        </button>
      </form>

      {error && <p className="study-planner-error">{error}</p>}

      {plan && (
        <div className="study-plan-result">
          <p className="study-plan-overview">{plan.overview}</p>

          <div className="study-plan-weeks">
            {plan.weeks.map((week) => (
              <div key={week.weekNumber} className="study-plan-week-card">
                <div className="study-plan-week-header">
                  <span className="study-plan-week-badge">Week {week.weekNumber}</span>
                  <h3>{week.focus}</h3>
                </div>
                <ul className="study-plan-tasks">
                  {week.tasks.map((task, i) => {
                    const key = `${week.weekNumber}-${i}`;
                    return (
                      <li key={i} className={completedTasks[key] ? "done" : ""}>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!completedTasks[key]}
                            onChange={() => toggleTask(week.weekNumber, i)}
                          />
                          <span>{task}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyPlannerPage;
