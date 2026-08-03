import { useState } from "react";
import { useLocation } from "react-router-dom";
import { HiOutlineBars3 } from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth.js";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import Sidebar from "./Sidebar.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import NotificationBell from "./NotificationBell.jsx";
import "../styles/AppShell.css";

// Homepage always keeps the marketing Navbar, logged in or not. Every other
// page uses the Navbar too until the visitor actually logs in (a Sidebar
// with role-based nav items makes no sense for a logged-out visitor) - once
// logged in, every other page (including public ones like a course preview)
// gets the Sidebar app shell instead.
function AppShell({ children }) {
  const { isAuthenticated, isAdminAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Owned here (not inside Sidebar) so the content area's left margin can
  // match the sidebar's actual rendered width exactly - see Sidebar.jsx's
  // comment on the same prop.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true"
  );

  const isLoggedIn = isAuthenticated || isAdminAuthenticated;
  const useSidebarShell = isLoggedIn && location.pathname !== "/";

  if (!useSidebarShell) {
    return (
      <>
        <Navbar />
        <div className="app-container">
          <div className="main-content">{children}</div>
        </div>
        <Footer />
      </>
    );
  }

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`app-shell-main ${collapsed ? "app-shell-main-collapsed" : ""}`}>
        <header className="app-topbar">
          <button
            type="button"
            className="app-topbar-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <HiOutlineBars3 />
          </button>
          <GlobalSearch />
          {/* Notifications are only ever addressed to the users table, so
              only student-side sessions (not admin) get a bell. */}
          {isAuthenticated && <NotificationBell />}
        </header>
        <main className="app-shell-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
