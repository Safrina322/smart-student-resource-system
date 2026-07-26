import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import { useAuth } from "../hooks/useAuth.js";

function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("❌ Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      await adminLogin({ email, password });
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
          <label className="form-label" htmlFor="admin-login-email">Admin Email</label>
          <input
            id="admin-login-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="admin-login-password">Password</label>
          <input
            id="admin-login-password"
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
