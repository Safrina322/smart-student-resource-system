import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBell } from "react-icons/hi2";
import { apiCall, getAuthHeader } from "../utils/api.js";
import { getSocket } from "../services/socketClient.js";
import "../styles/NotificationBell.css";

function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    apiCall("/api/notifications", { headers: getAuthHeader("token") })
      .then((data) => setUnreadCount(Number(data.unreadCount) || 0))
      .catch(() => {});

    const socket = getSocket();
    if (!socket) return;

    const handleNew = () => setUnreadCount((prev) => prev + 1);
    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, []);

  return (
    <button
      className="notification-bell"
      onClick={() => navigate("/dashboard")}
      aria-label="Notifications"
    >
      <HiOutlineBell />
      {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>
  );
}

export default NotificationBell;
