const STORAGE_KEY = "recentSearches";
const MAX_ENTRIES = 5;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query) {
  const trimmed = query.trim();
  if (!trimmed) return;

  const existing = getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY);
}
