import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "./SettingsPage.jsx";
import { getMySettings, updateMySettings } from "../services/authService.js";
import { notify } from "../utils/notify.js";

vi.mock("../services/authService.js", () => ({
  getMySettings: vi.fn(),
  updateMySettings: vi.fn(),
}));
vi.mock("../utils/notify.js", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("SettingsPage", () => {
  it("loads and reflects the current email-notification preference", async () => {
    getMySettings.mockResolvedValue({ emailNotificationsEnabled: true });
    render(<SettingsPage />);

    const toggle = await screen.findByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("toggles optimistically and persists the change", async () => {
    getMySettings.mockResolvedValue({ emailNotificationsEnabled: true });
    updateMySettings.mockResolvedValue({ emailNotificationsEnabled: false });
    render(<SettingsPage />);

    const toggle = await screen.findByRole("switch");
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    await waitFor(() =>
      expect(updateMySettings).toHaveBeenCalledWith({ emailNotificationsEnabled: false })
    );
    expect(notify.success).toHaveBeenCalled();
  });

  it("reverts the toggle and shows a toast error if saving fails", async () => {
    getMySettings.mockResolvedValue({ emailNotificationsEnabled: true });
    updateMySettings.mockRejectedValue(new Error("Network error"));
    render(<SettingsPage />);

    const toggle = await screen.findByRole("switch");
    fireEvent.click(toggle);

    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
    expect(notify.error).toHaveBeenCalled();
  });
});
