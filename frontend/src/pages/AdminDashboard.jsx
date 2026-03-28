// import { useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import "../styles/AdminDashboard.css";

// function AdminDashboard() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const token = localStorage.getItem("adminToken");
//     if (!token) {
//       navigate("/admin/login");
//     }
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     navigate("/admin/login");
//   };

//   return (
//     <div className="admin-container">
//       <h2 className="admin-title">Admin Dashboard</h2>

//       <div className="admin-cards">
//         <Link to="/admin/add-course" className="admin-card">
//           Add Course
//         </Link>

//         <Link to="/admin/requests" className="admin-card">
//           Manage Requests
//         </Link>

//         <button onClick={handleLogout} className="admin-card logout-btn">
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getApiUrl } from "../utils/api";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [heroImageError, setHeroImageError] = useState(false);

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
    const token = localStorage.getItem("adminToken");
    const name = localStorage.getItem("adminName");
    const adminEmail = localStorage.getItem("adminEmail");

    if (!token) {
      navigate("/admin/login");
    } else {
      setAdminName(buildAdminDisplayName(name, adminEmail));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    navigate("/admin/login");
  };

  return (
    <div className="admin-container">
      <section className="admin-hero">
        {!heroImageError && (
          <img
            src={`${getApiUrl()}/images/admin.jpg`}
            alt="Admin dashboard"
            className="admin-hero-image"
            onError={() => setHeroImageError(true)}
          />
        )}
        <div className="admin-hero-overlay" />

        <div className="admin-hero-content">
          <p className="admin-eyebrow">Control Center</p>
          <h2 className="admin-title">Welcome, {adminName}</h2>
          <p className="admin-subtitle">
            Review requests, publish courses, and keep your learning platform active.
          </p>

          <div className="admin-stats">
            <div className="admin-stat-card">
              <span>Role</span>
              <strong>Administrator</strong>
            </div>
            <div className="admin-stat-card">
              <span>Access</span>
              <strong>Full Control</strong>
            </div>
            <div className="admin-stat-card">
              <span>Status</span>
              <strong>Online</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-actions-grid">
        <Link to="/admin/add-course" className="admin-action-card">
          <h3>Add Course</h3>
          <p>Create a new course with image, first lesson, and resource links/files.</p>
        </Link>

        <Link to="/admin/requests" className="admin-action-card">
          <h3>Manage Requests</h3>
          <p>Approve or reject pending student requests and trigger notification emails.</p>
        </Link>

        <Link to="/admin/lessons" className="admin-action-card">
          <h3>Manage Lessons</h3>
          <p>Edit lesson order, update URLs/files, and clean up old course resources.</p>
        </Link>

        <button onClick={handleLogout} className="admin-action-card admin-logout-card">
          <h3>Logout</h3>
          <p>Exit admin session securely.</p>
        </button>
      </section>
    </div>
  );
}

export default AdminDashboard;