import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/icon.jpg";
import "../styles/Navbar.css";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [adminName, setAdminName] = useState("");

  const buildAdminDisplayName = (name, email) => {
    const cleanedName = (name || "").trim();
    if (cleanedName && cleanedName.toLowerCase() !== "admin user") {
      return cleanedName;
    }

    const mail = (email || "").trim().toLowerCase();
    if (mail.includes("@")) {
      return mail.split("@")[0];
    }

    return cleanedName || "Admin";
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");
    
    if (adminToken) {
      setIsAdmin(true);
      setIsLoggedIn(true);
      const storedAdminName = localStorage.getItem("adminName") || "";
      const storedAdminEmail = localStorage.getItem("adminEmail") || "";
      setAdminName(buildAdminDisplayName(storedAdminName, storedAdminEmail));
    } else if (token) {
      setIsLoggedIn(true);
      setIsAdmin(false);
      setUserName(localStorage.getItem("userName") || "User");
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("user");
    setProfileDropdown(false);
    window.location.href = "/";
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    setProfileDropdown(false);
    window.location.href = "/";
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
                      onClick={handleAdminLogout}
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
