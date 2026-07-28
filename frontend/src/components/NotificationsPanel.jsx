import { useEffect, useState } from "react";
import { listNotifications, markRead as markReadRequest, markAllRead as markAllReadRequest } from "../services/notificationService.js";
import { getSocket } from "../services/socketClient.js";
import "../styles/NotificationsPanel.css";

function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (!socket) return;

    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await listNotifications();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markReadRequest(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: 1, read_at: new Date().toISOString() } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification", err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllReadRequest();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1, read_at: item.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications", err.message);
    }
  };

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
            <button type="button" onClick={markAllRead} className="mark-all-btn">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
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
                  onClick={() => markAsRead(item.id)}
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
