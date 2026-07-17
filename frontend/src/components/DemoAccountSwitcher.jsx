import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineAcademicCap, HiOutlinePresentationChartLine, HiOutlineShieldCheck, HiOutlineKey } from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/DemoAccountSwitcher.css";

const DEMO_ACCOUNTS = [
  {
    role: "student",
    label: "Student",
    description: "Dashboard, requests, bookmarks",
    icon: HiOutlineAcademicCap,
    kind: "user",
    username: "safrina",
    password: "password123",
    landing: "/dashboard",
  },
  {
    role: "lecturer",
    label: "Lecturer",
    description: "Upload & manage resources",
    icon: HiOutlinePresentationChartLine,
    kind: "user",
    username: "demo.lecturer",
    password: "Demo@12345",
    landing: "/lecturer/dashboard",
  },
  {
    role: "moderator",
    label: "Moderator",
    description: "Approve, reject, flag queue",
    icon: HiOutlineShieldCheck,
    kind: "user",
    username: "demo.moderator",
    password: "Demo@12345",
    landing: "/moderator/dashboard",
  },
  {
    role: "admin",
    label: "Admin",
    description: "Full platform control",
    icon: HiOutlineKey,
    kind: "admin",
    email: "fathimasafrina57@gmail.com",
    password: "admin123",
    landing: "/admin/dashboard",
  },
];

// Lets anyone (an interviewer clicking through, or you testing) jump straight
// into any role's experience without needing to know or type credentials.
function DemoAccountSwitcher() {
  const navigate = useNavigate();
  const { login, adminLogin } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState("");

  const handleDemoLogin = async (account) => {
    setError("");
    setLoadingRole(account.role);
    try {
      if (account.kind === "admin") {
        await adminLogin({ email: account.email, password: account.password });
      } else {
        await login({ username: account.username, password: account.password });
      }
      navigate(account.landing);
    } catch (err) {
      setError(err.message || `Could not sign in as ${account.label}`);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="demo-switcher">
      <div className="demo-switcher-header">
        <span>Just exploring?</span>
        <p>Jump into any role instantly — no credentials needed.</p>
      </div>

      {error && <p className="demo-switcher-error">{error}</p>}

      <div className="demo-switcher-grid">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = account.icon;
          const isLoading = loadingRole === account.role;
          return (
            <button
              key={account.role}
              className={`demo-switcher-card demo-role-${account.role}`}
              onClick={() => handleDemoLogin(account)}
              disabled={loadingRole !== null}
            >
              <Icon className="demo-switcher-icon" />
              <span className="demo-switcher-label">{account.label}</span>
              <span className="demo-switcher-desc">{account.description}</span>
              {isLoading && <span className="demo-switcher-loading">Signing in...</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DemoAccountSwitcher;
