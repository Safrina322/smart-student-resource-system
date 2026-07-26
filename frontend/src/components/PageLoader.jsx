import "../styles/PageLoader.css";

// Suspense fallback shown while a lazy-loaded route chunk downloads.
function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" />
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}

export default PageLoader;
