import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMagnifyingGlass, HiOutlineClock, HiOutlineFire, HiXMark } from "react-icons/hi2";
import { useDebounce } from "../hooks/useDebounce.js";
import { searchAll, getPopularSearches } from "../services/searchService.js";
import { getRecentSearches, addRecentSearch } from "../utils/recentSearches.js";
import "../styles/GlobalSearch.css";

const SECTION_LABELS = {
  courses: "Courses",
  resources: "Resources",
  lecturerResources: "Lecturer Resources",
};

function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    searchAll(debouncedQuery.trim())
      .then((data) => setResults(data))
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleFocus = () => {
    setOpen(true);
    setRecent(getRecentSearches());
    if (popular.length === 0) {
      getPopularSearches()
        .then((data) => setPopular(Array.isArray(data) ? data : []))
        .catch(() => setPopular([]));
    }
  };

  const runSearch = (term) => {
    setQuery(term);
    addRecentSearch(term);
    setRecent(getRecentSearches());
  };

  const handleResultClick = (item) => {
    addRecentSearch(query);
    setOpen(false);
    if (item.type === "course") {
      navigate(`/course/${item.id}`);
    } else if (item.link) {
      window.open(item.link, "_blank", "noreferrer");
    }
  };

  const showSuggestions = open && !query.trim();
  const showResults = open && query.trim().length > 0;
  const hasAnyResults =
    results &&
    (results.courses?.length || results.resources?.length || results.lecturerResources?.length);

  return (
    <div className="global-search" ref={containerRef}>
      <div className="global-search-input-wrap">
        <HiOutlineMagnifyingGlass className="global-search-icon" />
        <input
          type="text"
          placeholder="Search courses, resources..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
        />
        {query && (
          <button className="global-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
            <HiXMark />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="global-search-dropdown">
          {recent.length > 0 && (
            <div className="global-search-section">
              <h4><HiOutlineClock /> Recent Searches</h4>
              {recent.map((term) => (
                <button key={term} className="global-search-chip" onClick={() => runSearch(term)}>
                  {term}
                </button>
              ))}
            </div>
          )}
          {popular.length > 0 && (
            <div className="global-search-section">
              <h4><HiOutlineFire /> Popular Searches</h4>
              {popular.map((item) => (
                <button
                  key={item.query}
                  className="global-search-chip"
                  onClick={() => runSearch(item.query)}
                >
                  {item.query}
                </button>
              ))}
            </div>
          )}
          {recent.length === 0 && popular.length === 0 && (
            <p className="global-search-empty">Start typing to search the platform.</p>
          )}
        </div>
      )}

      {showResults && (
        <div className="global-search-dropdown">
          {loading && <p className="global-search-empty">Searching...</p>}
          {!loading && !hasAnyResults && <p className="global-search-empty">No results for "{query}".</p>}
          {!loading &&
            results &&
            Object.entries(SECTION_LABELS).map(([key, label]) => {
              const items = results[key] || [];
              if (items.length === 0) return null;
              return (
                <div className="global-search-section" key={key}>
                  <h4>{label}</h4>
                  {items.map((item) => (
                    <button
                      key={`${key}-${item.id}`}
                      className="global-search-result"
                      onClick={() => handleResultClick(item)}
                    >
                      <span className="global-search-result-title">{item.title}</span>
                      {item.subtitle && (
                        <span className="global-search-result-subtitle">{item.subtitle}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
