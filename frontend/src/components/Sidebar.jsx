import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineSquares2X2,
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineTrophy,
  HiOutlineArrowUpTray,
  HiOutlineUserCircle,
  HiOutlineCog6Tooth,
  HiOutlineCpuChip,
  HiOutlineClipboardDocumentList,
  HiOutlineUsers,
  HiOutlinePlusCircle,
  HiOutlineAcademicCap,
  HiOutlineClipboardDocumentCheck,
  HiOutlineDocumentText,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import logo from "../assets/icon.jpg";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/Sidebar.css";

const STUDENT_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: HiOutlineSquares2X2 },
  { to: "/resources", label: "Resources", icon: HiOutlineBookOpen },
  { to: "/study-planner", label: "Study Planner", icon: HiOutlineSparkles },
  { to: "/ai-tools", label: "AI Tools", icon: HiOutlineCpuChip },
  { to: "/achievements", label: "Achievements", icon: HiOutlineTrophy },
  { to: "/upload", label: "Upload", icon: HiOutlineArrowUpTray },
  { to: "/profile", label: "Profile", icon: HiOutlineUserCircle },
  { to: "/settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

const LECTURER_ITEMS = [
  { to: "/lecturer/dashboard", label: "Lecturer Dashboard", icon: HiOutlineSquares2X2 },
  { to: "/resources", label: "Resources", icon: HiOutlineBookOpen },
  { to: "/profile", label: "Profile", icon: HiOutlineUserCircle },
  { to: "/settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

const MODERATOR_ITEMS = [
  { to: "/moderator/dashboard", label: "Review Queue", icon: HiOutlineClipboardDocumentCheck },
  { to: "/resources", label: "Resources", icon: HiOutlineBookOpen },
  { to: "/profile", label: "Profile", icon: HiOutlineUserCircle },
  { to: "/settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

const ADMIN_ITEMS = [
  { to: "/admin/dashboard", label: "Admin Dashboard", icon: HiOutlineSquares2X2 },
  { to: "/resources", label: "Resources", icon: HiOutlineBookOpen },
  { to: "/admin/users", label: "Manage Users", icon: HiOutlineUsers },
  { to: "/admin/requests", label: "Manage Requests", icon: HiOutlineClipboardDocumentList },
  { to: "/admin/add-course", label: "Add Course", icon: HiOutlinePlusCircle },
  { to: "/admin/lessons", label: "Manage Lessons", icon: HiOutlineAcademicCap },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: HiOutlineDocumentText },
];

const itemsForRole = (isAdmin, role) => {
  if (isAdmin) return ADMIN_ITEMS;
  if (role === "lecturer") return LECTURER_ITEMS;
  if (role === "moderator") return MODERATOR_ITEMS;
  return STUDENT_ITEMS;
};

// collapsed/onToggleCollapsed are lifted up to AppShell (rather than local
// state here) because the main content area's left margin has to match the
// sidebar's actual rendered width exactly - two independent pieces of state
// for the same visual concern would drift out of sync the moment one
// updated without the other.
function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, admin, isAdminAuthenticated, logout } = useAuth();

  const isAdmin = isAdminAuthenticated;
  const role = user?.role || "student";
  const displayName = isAdmin ? admin?.name || "Admin" : user?.username || "";
  const items = itemsForRole(isAdmin, role);

  // Mobile's off-canvas drawer is only ever fully-hidden or fully-open with
  // labels - it has no separate mini-rail mode - so an open mobile drawer
  // always ignores a persisted "collapsed" desktop preference.
  const effectiveCollapsed = collapsed && !mobileOpen;

  const handleLogout = async () => {
    await logout();
    onCloseMobile();
    navigate("/");
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`sidebar ${effectiveCollapsed ? "sidebar-collapsed" : ""} ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo-link">
            <img src={logo} alt="Smart Student Logo" className="sidebar-logo-image" />
            {!effectiveCollapsed && <span className="sidebar-logo-text">SmartStudent</span>}
          </Link>
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <HiOutlineXMark />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link" title="Home">
            <HiOutlineHome className="sidebar-link-icon" />
            {!effectiveCollapsed && <span>Home</span>}
          </Link>

          {/* eslint-disable-next-line no-unused-vars -- Icon is used as the JSX tag below; core no-unused-vars doesn't resolve destructured-and-renamed JSX component names */}
          {items.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`sidebar-link ${active ? "active" : ""}`}
                title={label}
              >
                <Icon className="sidebar-link-icon" />
                {!effectiveCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!effectiveCollapsed && (
            <div className={`sidebar-user ${isAdmin ? "sidebar-user-admin" : ""}`}>
              <span className="sidebar-user-badge">{isAdmin ? "👑" : "👤"}</span>
              <span className="sidebar-user-name">{displayName}</span>
            </div>
          )}
          <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout} title="Logout">
            <HiOutlineArrowRightOnRectangle className="sidebar-link-icon" />
            {!effectiveCollapsed && <span>Logout</span>}
          </button>
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <HiOutlineChevronDoubleRight /> : <HiOutlineChevronDoubleLeft />}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
