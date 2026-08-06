import { Link } from "react-router-dom";
import { HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineArrowRight } from "react-icons/hi2";
import "../styles/LoginChoice.css";
import DemoAccountSwitcher from "../components/DemoAccountSwitcher.jsx";

function LoginChoice() {
  return (
    <div className="login-choice-page">
      <div className="login-choice-container">
        <div className="choice-header">
          <h1>Welcome back</h1>
          <p>Choose how you&apos;d like to continue</p>
        </div>

        <div className="choice-options">
          <Link to="/user/login" className="choice-card">
            <div className="card-icon">
              <HiOutlineAcademicCap />
            </div>
            <h3>Login as Student</h3>
            <p>Access your learning dashboard, browse resources, and request courses.</p>
            <span className="choice-btn">
              Continue as Student <HiOutlineArrowRight />
            </span>
          </Link>

          <Link to="/admin/login" className="choice-card">
            <div className="card-icon">
              <HiOutlineShieldCheck />
            </div>
            <h3>Login as Admin</h3>
            <p>Manage courses, approve requests, and oversee platform activity.</p>
            <span className="choice-btn">
              Continue as Admin <HiOutlineArrowRight />
            </span>
          </Link>
        </div>

        <DemoAccountSwitcher />

        <div className="choice-footer">
          <p>
            Don&apos;t have an account? <Link to="/register">Create one here</Link>
          </p>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginChoice;
