import { useState } from "react";
import { apiCall } from "../utils/api.js";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const buildAdminDisplayName = (name, emailValue) => {
    const cleanedName = (name || "").trim();
    if (cleanedName && cleanedName.toLowerCase() !== "admin user") {
      return cleanedName;
    }

    const mail = (emailValue || "").trim().toLowerCase();
    if (mail.includes("@")) {
      return mail.split("@")[0];
    }

    return cleanedName || "Admin";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("❌ Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const data = await apiCall("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // ✅ Clear any old student session
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      localStorage.removeItem("user");

      // ✅ Save admin token and info
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.admin?.email || email);
      localStorage.setItem(
        "adminName",
        buildAdminDisplayName(data.admin?.name, data.admin?.email || email)
      );
      window.dispatchEvent(new Event("auth-changed"));

      navigate("/admin/dashboard");
    } catch (err) {
      setError(`❌ ${err.message || "Admin login failed. Check credentials."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Admin Login</h2>

        {error && <p className="password-error">{error}</p>}

        <div className="mb-3">
          <label className="form-label">Admin Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Login as Admin"}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
