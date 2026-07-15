import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/icon.jpg";
import "../styles/Navbar.css";
import { useAuth } from "../hooks/useAuth.js";

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

          {/* User Logged In */}
          {isLoggedIn && !isAdmin && (
            <>
              <Link to="/resources" className="nav-link" onClick={closeMobileMenu}>
                Resources
              </Link>
              <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
                Dashboard
              </Link>
              <Link to="/upload" className="nav-link" onClick={closeMobileMenu}>
                Upload
              </Link>

              <span className="nav-link profile-btn">👤 {userName}</span>
              <button className="nav-link profile-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
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
              <Link to="/admin/requests" className="nav-link admin" onClick={closeMobileMenu}>
                Manage Requests
              </Link>
              <Link to="/admin/add-course" className="nav-link admin" onClick={closeMobileMenu}>
                Add Course
              </Link>
              <Link to="/admin/lessons" className="nav-link admin" onClick={closeMobileMenu}>
                Manage Lessons
              </Link>

              {/* Admin Profile Dropdown */}
              <div className="nav-dropdown">
                <button 
                  className="nav-link profile-btn admin-profile"
                  onClick={() => setProfileDropdown(!profileDropdown)}
                >
                  👑 {adminName} ▼
                </button>
                {profileDropdown && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
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
