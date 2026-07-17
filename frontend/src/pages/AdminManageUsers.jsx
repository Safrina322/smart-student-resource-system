import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { listUsers, changeUserRole, changeUserStatus } from "../services/adminUserService.js";
import { SkeletonTableRows } from "../components/Skeleton.jsx";
import "../styles/AdminManageUsers.css";

const ROLE_OPTIONS = ["student", "lecturer", "moderator"];

function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300); // debounce the search filter
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers({ role: roleFilter, status: statusFilter, search });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return;
    setPendingUserId(user.id);
    setFeedback("");
    try {
      const { user: updated } = await changeUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setFeedback(`${user.username} is now ${newRole}.`);
    } catch (err) {
      setFeedback(err.message || "Failed to update role");
    } finally {
      setPendingUserId(null);
    }
  };

  const handleStatusToggle = async (user) => {
    setPendingUserId(user.id);
    setFeedback("");
    try {
      const nextActive = !user.is_active;
      const { user: updated } = await changeUserStatus(user.id, nextActive);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setFeedback(`${user.username} ${nextActive ? "activated" : "deactivated"}.`);
    } catch (err) {
      setFeedback(err.message || "Failed to update status");
    } finally {
      setPendingUserId(null);
    }
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

  return (
    <div className="manage-users-page">
      <div className="manage-users-header">
        <div>
          <h1>Manage Users</h1>
          <p>View and manage every student, lecturer, and moderator account.</p>
        </div>
        <Link to="/admin/dashboard" className="manage-users-back">
          <HiOutlineArrowLeft /> Back to Dashboard
        </Link>
      </div>

      <div className="manage-users-filters">
        <div className="manage-users-search">
          <HiOutlineMagnifyingGlass />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role[0].toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <p className="manage-users-error">{error}</p>}
      {feedback && <p className="manage-users-feedback">{feedback}</p>}

      <div className="manage-users-table-wrap">
        <table className="manage-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={6} columns={6} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="manage-users-empty">
                  No users match these filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? "active" : "inactive"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td className="manage-users-actions">
                    <select
                      value={user.role}
                      disabled={pendingUserId === user.id}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role[0].toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      className={user.is_active ? "deactivate-btn" : "activate-btn"}
                      disabled={pendingUserId === user.id}
                      onClick={() => handleStatusToggle(user)}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminManageUsers;
