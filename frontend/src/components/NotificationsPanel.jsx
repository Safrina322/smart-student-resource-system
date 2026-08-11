import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBell,
} from "react-icons/hi2";
import {
  listNotifications,
  markRead as markReadRequest,
  markAllRead as markAllReadRequest,
} from "../services/notificationService.js";
import { getSocket } from "../services/socketClient.js";
import "../styles/NotificationsPanel.css";

// The border-stripe color encodes real severity (approved/rejected/reply),
// not arbitrary per-item decoration - anything else falls back to the
// neutral "info" treatment.
const TYPE_META = {
  request_approved: { className: "type-success", icon: HiOutlineCheckCircle },
  request_rejected: { className: "type-danger", icon: HiOutlineXCircle },
  comment_reply: { className: "type-accent", icon: HiOutlineChatBubbleLeftRight },
};
const DEFAULT_META = { className: "type-info", icon: HiOutlineBell };

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
          {notifications.map((item) => {
            const meta = TYPE_META[item.type] || DEFAULT_META;
            const Icon = meta.icon;
            return (
              <article
                key={item.id}
                className={`notification-item ${meta.className} ${item.is_read ? "is-read" : "is-unread"}`}
              >
                <Icon className="notification-icon" />
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
            );
          })}
        </div>
      )}
    </section>
  );
}

export default NotificationsPanel;
