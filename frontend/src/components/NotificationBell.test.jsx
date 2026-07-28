import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import NotificationsPanel from "./NotificationsPanel.jsx";
import * as notificationService from "../services/notificationService.js";

vi.mock("../services/notificationService.js", () => ({
  listNotifications: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderBell = (client = newClient()) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.resetAllMocks();
});

describe("NotificationBell", () => {
  it("shows the unread count from the notifications query", async () => {
    notificationService.listNotifications.mockResolvedValue({ notifications: [], unreadCount: 3 });
    renderBell();
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("shows no badge when there are no unread notifications", async () => {
    notificationService.listNotifications.mockResolvedValue({ notifications: [], unreadCount: 0 });
    const { container } = renderBell();
    await vi.waitFor(() => expect(notificationService.listNotifications).toHaveBeenCalled());
    expect(container.querySelector(".notification-bell-badge")).toBeNull();
  });
});

describe("NotificationBell + NotificationsPanel query cache sharing", () => {
  it("fetches notifications once and stays in sync when both are mounted together", async () => {
    notificationService.listNotifications.mockResolvedValue({
      notifications: [{ id: 1, title: "Hi", message: "Hello", is_read: 0, created_at: null }],
      unreadCount: 1,
    });

    render(
      <QueryClientProvider client={newClient()}>
        <MemoryRouter>
          <NotificationBell />
          <NotificationsPanel />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Panel rendered the notification and the bell rendered the same count -
    // both driven by one shared query, not two independent fetches.
    expect(await screen.findByText("Hi")).toBeInTheDocument();
    expect(await screen.findByText("1")).toBeInTheDocument();
    expect(notificationService.listNotifications).toHaveBeenCalledTimes(1);
  });
});
