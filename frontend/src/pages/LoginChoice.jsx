import { Link } from "react-router-dom";
import "../styles/LoginChoice.css";
import DemoAccountSwitcher from "../components/DemoAccountSwitcher.jsx";

function LoginChoice() {
  return (
    <div className="login-choice-page">
      <div className="login-choice-container">
        {/* Header Section */}
        <div className="choice-header">
          <h1>Welcome Back! 👋</h1>
          <p>Choose how you'd like to continue</p>
        </div>

        {/* Choice Options */}
        <div className="choice-options">
          {/* User Login Option */}
          <Link to="/user/login" className="choice-card user-card">
            <div className="card-icon">👤</div>
            <h3>Login as Student</h3>
            <p>Access your learning dashboard, browse resources, and request courses</p>
            <button className="choice-btn">Continue as Student →</button>
          </Link>

          {/* Admin Login Option */}
          <Link to="/admin/login" className="choice-card admin-card">
            <div className="card-icon">👑</div>
            <h3>Login as Admin</h3>
            <p>Manage courses, approve requests, and oversee platform activities</p>
            <button className="choice-btn">Continue as Admin →</button>
          </Link>
        </div>

        <DemoAccountSwitcher />

        {/* Additional Info */}
        <div className="choice-footer">
          <p>Don't have an account? <Link to="/register">Create one here</Link></p>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginChoice;