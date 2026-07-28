import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineBell } from "react-icons/hi2";
import { listNotifications } from "../services/notificationService.js";
import { getSocket } from "../services/socketClient.js";
import "../styles/NotificationBell.css";

// Shares the ["notifications"] query cache with NotificationsPanel - both
// mounted at once (bell in the navbar, panel on the dashboard) previously
// fired two independent fetches for the same data on every page load.
function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });
  const unreadCount = Number(data?.unreadCount) || 0;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, [queryClient]);

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
