import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markRead as markReadRequest,
  markAllRead as markAllReadRequest,
} from "../services/notificationService.js";
import { getSocket } from "../services/socketClient.js";
import "../styles/NotificationsPanel.css";

// Shares the ["notifications"] query cache with NotificationBell - see that
// component for why. Mutations invalidate the shared cache instead of
// hand-patching local state, so both components always agree with the
// server (and each other) after any action from either.
function NotificationsPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });
  const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
  const unreadCount = Number(data?.unreadCount) || 0;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, [queryClient]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markReadMutation = useMutation({
    mutationFn: markReadRequest,
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllReadRequest,
    onSuccess: invalidate,
  });

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString();
  };

  return (
    <section className="notifications-panel">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <div className="notifications-actions">
          <span className="notifications-count">{unreadCount} unread</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="mark-all-btn"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="notifications-empty">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="notifications-empty">No notifications yet.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((item) => (
            <article
              key={item.id}
              className={`notification-item ${item.is_read ? "is-read" : "is-unread"}`}
            >
              <div className="notification-main">
                <h4>{item.title}</h4>
                <p>{item.message}</p>
                <small>{formatDate(item.created_at)}</small>
              </div>
              {!item.is_read && (
                <button
                  type="button"
                  onClick={() => markReadMutation.mutate(item.id)}
                  disabled={markReadMutation.isPending}
                  className="mark-read-btn"
                >
                  Mark read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default NotificationsPanel;
