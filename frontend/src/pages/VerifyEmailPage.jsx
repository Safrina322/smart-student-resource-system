import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/LoginPage.css";
import { useAuth } from "../hooks/useAuth.js";

function VerifyEmailPage() {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");
  // The token is single-use server-side, so the request itself must only
  // ever fire once per token — React StrictMode intentionally double-invokes
  // effects in dev, which would otherwise burn the token on a throwaway
  // second request and show a false "invalid link" error.
  const requestedTokenRef = useRef(null);

  useEffect(() => {
    if (requestedTokenRef.current === token) return;
    requestedTokenRef.current = token;

    verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "This verification link is invalid or has expired.");
      });
  }, [token, verifyEmail]);

  return (
    <div className="login-page">
      <div className="login-form" style={{ textAlign: "center" }}>
        <h2>Email Verification</h2>

        {status === "verifying" && <p style={{ color: "#aaa" }}>Verifying your email...</p>}
        {status === "success" && <p style={{ color: "#7dd3fc" }}>{message}</p>}
        {status === "error" && <p className="password-error">{message}</p>}

        <p className="switch-auth">
          <Link to="/user/login">Go to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
