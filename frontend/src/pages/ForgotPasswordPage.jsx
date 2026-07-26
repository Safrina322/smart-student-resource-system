import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import "../styles/LoginPage.css";
import { useAuth } from "../hooks/useAuth.js";

function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    setMessage("");
    try {
      const data = await requestPasswordReset(email);
      setMessage(data.message);
    } catch (err) {
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
        <h2>Forgot Password</h2>
        <p style={{ color: "#aaa", marginBottom: 20, fontSize: "0.95rem" }}>
          Enter your account email and we'll send you a link to reset your password.
        </p>

        {message && <p className="password-error" style={{ color: "#7dd3fc" }}>{message}</p>}

        <div className="mb-3">
          <label className="form-label" htmlFor="forgot-password-email">Email</label>
          <input
            id="forgot-password-email"
            type="email"
            className="form-control"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && <p className="password-error">{errors.email.message}</p>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="switch-auth">
          Remembered your password? <Link to="/user/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
