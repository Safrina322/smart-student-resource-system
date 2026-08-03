import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

const mockUseAuth = vi.fn();
vi.mock("../hooks/useAuth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

const noop = () => {};

const renderSidebar = (props = {}) =>
  render(
    <MemoryRouter>
      <Sidebar collapsed={false} onToggleCollapsed={noop} mobileOpen={false} onCloseMobile={noop} {...props} />
    </MemoryRouter>
  );

describe("Sidebar", () => {
  it("shows student-only nav items for a logged-in student", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "safrina", role: "student" },
      admin: null,
      isAdminAuthenticated: false,
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Study Planner")).toBeInTheDocument();
    expect(screen.getByText("AI Tools")).toBeInTheDocument();
    expect(screen.queryByText("Manage Users")).toBeNull();
  });

  it("shows lecturer nav items (not student-only ones) for a logged-in lecturer", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "lecturer1", role: "lecturer" },
      admin: null,
      isAdminAuthenticated: false,
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Lecturer Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Study Planner")).toBeNull();
    expect(screen.queryByText("AI Tools")).toBeNull();
  });

  it("shows admin nav items, including Audit Logs, for an admin session", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      admin: { name: "Admin User", adminRole: "sysadmin" },
      isAdminAuthenticated: true,
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manage Users")).toBeInTheDocument();
    expect(screen.getByText("Audit Logs")).toBeInTheDocument();
  });

  it("hides link text when collapsed but keeps each link's accessible title", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "safrina", role: "student" },
      admin: null,
      isAdminAuthenticated: false,
      logout: vi.fn(),
    });

    renderSidebar({ collapsed: true });

    expect(screen.queryByText("Dashboard")).toBeNull();
    expect(screen.getByTitle("Dashboard")).toBeInTheDocument();
  });

  it("always shows full labels on the mobile drawer, even if desktop-collapsed is persisted true", () => {
    mockUseAuth.mockReturnValue({
      user: { username: "safrina", role: "student" },
      admin: null,
      isAdminAuthenticated: false,
      logout: vi.fn(),
    });

    renderSidebar({ collapsed: true, mobileOpen: true });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("calls logout when the Logout button is clicked", () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { username: "safrina", role: "student" },
      admin: null,
      isAdminAuthenticated: false,
      logout,
    });

    renderSidebar();
    fireEvent.click(screen.getByText("Logout"));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
