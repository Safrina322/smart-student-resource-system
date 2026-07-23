import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/icon.jpg";
import "../styles/Navbar.css";
import { useAuth } from "../hooks/useAuth.js";
import GlobalSearch from "./GlobalSearch.jsx";
import NotificationBell from "./NotificationBell.jsx";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, admin, isAuthenticated, isAdminAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  const isLoggedIn = isAuthenticated || isAdminAuthenticated;
  const isAdmin = isAdminAuthenticated;
  const userName = user?.username || "";
  const adminName = admin?.name || "";
  const role = user?.role || "student";

  useEffect(() => {
    setProfileDropdown(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setProfileDropdown(false);
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo Section */}
        <div className="nav-logo">
          <Link to="/" className="logo-link">
            <img src={logo} alt="Smart Student Logo" className="logo-image" />
            <span className="logo-text">SmartStudent</span>
          </Link>
        </div>

        <GlobalSearch />

        {/* Hamburger Menu Icon */}
        <div className="hamburger" onClick={toggleMobileMenu}>
          <span className={mobileMenuOpen ? "active" : ""}></span>
          <span className={mobileMenuOpen ? "active" : ""}></span>
          <span className={mobileMenuOpen ? "active" : ""}></span>
        </div>

        {/* Navigation Links */}
        <div className={`nav-menu ${mobileMenuOpen ? "active" : ""}`}>
          {/* Common Links */}
          <Link to="/" className="nav-link" onClick={closeMobileMenu}>
            Home
          </Link>
          <Link to="/about" className="nav-link" onClick={closeMobileMenu}>
            About
          </Link>

        {/* Not Logged In - Show Login */}
          {!isLoggedIn && (
            <Link to="/login" className="nav-link login-btn" onClick={closeMobileMenu}>
              🔐 Login
            </Link>
          )}

          {/* User Logged In (student / lecturer / moderator) */}
          {isLoggedIn && !isAdmin && (
            <>
              <Link to="/resources" className="nav-link" onClick={closeMobileMenu}>
                Resources
              </Link>

              {role === "lecturer" && (
                <Link to="/lecturer/dashboard" className="nav-link" onClick={closeMobileMenu}>
                  Lecturer Dashboard
                </Link>
              )}

              {role === "moderator" && (
                <Link to="/moderator/dashboard" className="nav-link" onClick={closeMobileMenu}>
                  Review Queue
                </Link>
              )}

              {role === "student" && (
                <>
                  <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
                    Dashboard
                  </Link>
                  <Link to="/study-planner" className="nav-link" onClick={closeMobileMenu}>
                    ✨ Study Planner
                  </Link>
                </>
              )}

              <NotificationBell />

              {/* Profile Dropdown - secondary links live here so the
                  top-level row stays short at every screen width */}
              <div className="nav-dropdown">
                <button
                  className="nav-link profile-btn"
                  onClick={() => setProfileDropdown(!profileDropdown)}
                >
                  👤 {userName} ▼
                </button>
                {profileDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item" onClick={closeMobileMenu}>
                      My Profile
                    </Link>
                    {role === "student" && (
                      <>
                        <Link to="/upload" className="dropdown-item" onClick={closeMobileMenu}>
                          Upload
                        </Link>
                        <Link to="/achievements" className="dropdown-item" onClick={closeMobileMenu}>
                          Achievements
                        </Link>
                      </>
                    )}
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Admin Logged In */}
          {isLoggedIn && isAdmin && (
            <>
              <Link to="/resources" className="nav-link" onClick={closeMobileMenu}>
                Resources
              </Link>
              <Link to="/admin/dashboard" className="nav-link admin" onClick={closeMobileMenu}>
                Admin Dashboard
              </Link>

              {/* Admin Profile Dropdown - management links live here so the
                  top-level row stays short at every screen width */}
              <div className="nav-dropdown">
                <button
                  className="nav-link profile-btn admin-profile"
                  onClick={() => setProfileDropdown(!profileDropdown)}
                >
                  👑 {adminName} ▼
                </button>
                {profileDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/admin/users" className="dropdown-item" onClick={closeMobileMenu}>
                      Manage Users
                    </Link>
                    <Link to="/admin/requests" className="dropdown-item" onClick={closeMobileMenu}>
                      Manage Requests
                    </Link>
                    <Link to="/admin/add-course" className="dropdown-item" onClick={closeMobileMenu}>
                      Add Course
                    </Link>
                    <Link to="/admin/lessons" className="dropdown-item" onClick={closeMobileMenu}>
                      Manage Lessons
                    </Link>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      🚪 Admin Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
