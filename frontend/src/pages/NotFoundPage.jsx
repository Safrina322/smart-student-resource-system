import { Link } from "react-router-dom";
import "../styles/NotFoundPage.css";

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code">404</p>
        <h1>Page Not Found</h1>
        <p>
          The page you requested does not exist or may have been moved.
          Return to the homepage to continue browsing SmartStudent.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="not-found-btn primary">Go Home</Link>
          <Link to="/login" className="not-found-btn secondary">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
