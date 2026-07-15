import { useState } from "react";
import { apiCall } from "../utils/api.js";
import "../styles/LoginPage.css";
import { Link, useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("❌ Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const data = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // ✅ Clear any old admin session
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminName");

      // ✅ save token
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user?.username || "User");
      window.dispatchEvent(new Event("auth-changed"));

      navigate("/dashboard");
    } catch (err) {
      setError(`❌ ${err.message || "Login failed. Check credentials."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>

        {error && <p className="password-error">{error}</p>}

        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="switch-auth">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
