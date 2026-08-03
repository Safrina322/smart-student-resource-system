import { useEffect, useState } from "react";
import { getMySettings, updateMySettings } from "../services/authService.js";
import { notify } from "../utils/notify.js";
import "../styles/SettingsPage.css";

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  useEffect(() => {
    getMySettings()
      .then((data) => setEmailNotificationsEnabled(data.emailNotificationsEnabled))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    const next = !emailNotificationsEnabled;
    setEmailNotificationsEnabled(next);
    setSaving(true);
    try {
      await updateMySettings({ emailNotificationsEnabled: next });
      notify.success(next ? "Email notifications turned on" : "Email notifications turned off");
    } catch (err) {
      setEmailNotificationsEnabled(!next);
      notify.error(err.message || "Could not update setting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <p className="settings-loading">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <section className="settings-card">
        <h2>Notifications</h2>

        <div className="settings-row">
          <div>
            <p className="settings-row-title">Email notifications</p>
            <p className="settings-row-desc">
              Get emailed when a resource request you submitted is approved or rejected.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailNotificationsEnabled}
            className={`settings-toggle ${emailNotificationsEnabled ? "on" : ""}`}
            onClick={handleToggle}
            disabled={saving}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
