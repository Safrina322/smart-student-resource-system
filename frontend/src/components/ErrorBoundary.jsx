import { Component } from "react";
import "../styles/ErrorBoundary.css";

// Catches render/lifecycle errors in the page tree beneath it so one broken
// page shows a recoverable fallback instead of a blank white screen for the
// whole app (Navbar/Footer, mounted above this boundary in App.jsx, stay usable).
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-page">
          <div className="error-boundary-card">
            <p className="error-boundary-code">Oops</p>
            <h1>Something went wrong</h1>
            <p>
              This page hit an unexpected error. You can try again, or head back to
              the homepage while we sort it out.
            </p>
            <div className="error-boundary-actions">
              <button type="button" className="error-boundary-btn primary" onClick={this.handleReload}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
