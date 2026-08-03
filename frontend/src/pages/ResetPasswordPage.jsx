import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/LoginPage.css";
import { useAuth } from "../hooks/useAuth.js";
import { notify } from "../utils/notify.js";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { newPassword: "", confirmPassword: "" } });

  const newPassword = watch("newPassword");

  const onSubmit = async ({ newPassword }) => {
    try {
      await resetPassword({ token, newPassword });
      navigate("/user/login", { state: { justReset: true } });
    } catch (err) {
      notify.error(err.message || "Could not reset password. The link may have expired.");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
        <h2>Reset Password</h2>

        <div className="mb-3">
          <label className="form-label" htmlFor="reset-new-password">New Password</label>
          <input
            id="reset-new-password"
            type="password"
            className="form-control"
            {...register("newPassword", {
              required: "New password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
          />
          {errors.newPassword && <p className="password-error">{errors.newPassword.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password</label>
          <input
            id="reset-confirm-password"
            type="password"
            className="form-control"
            {...register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) => value === newPassword || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && <p className="password-error">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>

        <p className="switch-auth">
          <Link to="/user/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
