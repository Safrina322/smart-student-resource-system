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
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const name = localStorage.getItem("adminName");

    if (!token) {
      navigate("/admin/login");
    } else {
      setAdminName(name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    navigate("/admin/login");
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">
        👋 Welcome, {adminName}
      </h2>

      <div className="admin-cards">
        <Link to="/admin/add-course" className="admin-card">
          Add Course
        </Link>

        <Link to="/admin/requests" className="admin-card">
          Manage Requests
        </Link>

        <button onClick={handleLogout} className="admin-card logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;