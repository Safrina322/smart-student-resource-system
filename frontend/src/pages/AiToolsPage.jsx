import { useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineSparkles, HiOutlineCalendarDays, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { listResources } from "../services/resourceHubService.js";
import ResourceAIPanel from "../components/ResourceAIPanel.jsx";
import { notify } from "../utils/notify.js";
import "../styles/AiToolsPage.css";

function AiToolsPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) return;

    setSearching(true);
    try {
      const data = await listResources({ search: query });
      setResults(data);
    } catch (err) {
      notify.error(err.message || "Could not search resources");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="ai-tools-page">
      <div className="ai-tools-hero">
        <p className="hero-kicker">AI Study Tools</p>
        <h1>
          <HiOutlineSparkles /> Everything AI, in one place
        </h1>
        <p>
          Build a study plan, or find a resource below to summarize it, quiz yourself, make
          flashcards, or chat about it.
        </p>
      </div>

      <Link to="/study-planner" className="ai-tools-card ai-tools-planner-card">
        <HiOutlineCalendarDays className="ai-tools-card-icon" />
        <div>
          <h2>Study Planner</h2>
          <p>Tell us your goal and available time - AI builds a week-by-week plan.</p>
        </div>
      </Link>

      <section className="ai-tools-card">
        <h2>
          <HiOutlineMagnifyingGlass /> Find a resource for AI tools
        </h2>
        <form className="ai-tools-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by title, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" disabled={searching || !search.trim()}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {results.length > 0 && (
          <div className="ai-tools-results">
            {results.map((resource) => (
              <button
                key={resource.id}
                type="button"
                className={`ai-tools-result ${selected?.id === resource.id ? "active" : ""}`}
                onClick={() => setSelected({ id: resource.id, title: resource.title })}
              >
                {resource.title}
              </button>
            ))}
          </div>
        )}

        {!searching && search.trim() && results.length === 0 && (
          <p className="ai-tools-empty">No resources match that search.</p>
        )}
      </section>

      {selected && (
        <section className="ai-tools-selected">
          <p className="ai-tools-selected-label">
            AI tools for: <strong>{selected.title}</strong>
          </p>
          <ResourceAIPanel resourceId={selected.id} />
        </section>
      )}
    </div>
  );
}

export default AiToolsPage;
