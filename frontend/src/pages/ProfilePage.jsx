import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "../styles/ProfilePage.css";
import { useAuth } from "../hooks/useAuth.js";
import { notify } from "../utils/notify.js";

function ProfilePage() {
  const { fetchProfile, updateProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(true);

  const profileForm = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      semester: "",
      courseBranch: "",
    },
  });

  const passwordForm = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        profileForm.reset({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          phone: profile.phone || "",
          semester: profile.semester || "",
          courseBranch: profile.courseBranch || "",
        });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaveProfile = async (values) => {
    try {
      const data = await updateProfile(values);
      notify.success(data.message);
    } catch (err) {
      notify.error(err.message || "Could not update profile.");
    }
  };

  const newPassword = passwordForm.watch("newPassword");

  const onChangePassword = async ({ currentPassword, newPassword }) => {
    try {
      const data = await changePassword({ currentPassword, newPassword });
      notify.success(data.message);
      passwordForm.reset();
    } catch (err) {
      notify.error(err.message || "Could not change password.");
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <p style={{ color: "var(--color-text-muted)", textAlign: "center", paddingTop: 60 }}>
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>Profile Settings</h1>

      <section className="profile-card">
        <h2>Profile Information</h2>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
          <div className="profile-grid">
            <div className="profile-field">
              <label htmlFor="profile-first-name">First Name</label>
              <input id="profile-first-name" type="text" {...profileForm.register("firstName")} />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-last-name">Last Name</label>
              <input id="profile-last-name" type="text" {...profileForm.register("lastName")} />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-phone">Phone</label>
              <input id="profile-phone" type="text" {...profileForm.register("phone")} />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-semester">Semester</label>
              <input id="profile-semester" type="number" min="1" max="12" {...profileForm.register("semester")} />
            </div>
            <div className="profile-field profile-field-wide">
              <label htmlFor="profile-course-branch">Course / Branch</label>
              <input id="profile-course-branch" type="text" {...profileForm.register("courseBranch")} />
            </div>
          </div>

          <button type="submit" className="profile-btn-primary" disabled={profileForm.formState.isSubmitting}>
            {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>

      <section className="profile-card">
        <h2>Change Password</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
          <div className="profile-grid">
            <div className="profile-field profile-field-wide">
              <label htmlFor="profile-current-password">Current Password</label>
              <input
                id="profile-current-password"
                type="password"
                {...passwordForm.register("currentPassword", { required: "Current password is required" })}
              />
              {passwordForm.formState.errors.currentPassword && (
                <span className="profile-error">
                  {passwordForm.formState.errors.currentPassword.message}
                </span>
              )}
            </div>
            <div className="profile-field">
              <label htmlFor="profile-new-password">New Password</label>
              <input
                id="profile-new-password"
                type="password"
                {...passwordForm.register("newPassword", {
                  required: "New password is required",
                  minLength: { value: 6, message: "Must be at least 6 characters" },
                })}
              />
              {passwordForm.formState.errors.newPassword && (
                <span className="profile-error">{passwordForm.formState.errors.newPassword.message}</span>
              )}
            </div>
            <div className="profile-field">
              <label htmlFor="profile-confirm-password">Confirm New Password</label>
              <input
                id="profile-confirm-password"
                type="password"
                {...passwordForm.register("confirmPassword", {
                  required: "Please confirm your new password",
                  validate: (value) => value === newPassword || "Passwords do not match",
                })}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <span className="profile-error">
                  {passwordForm.formState.errors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="profile-btn-primary"
            disabled={passwordForm.formState.isSubmitting}
          >
            {passwordForm.formState.isSubmitting ? "Updating..." : "Change Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
