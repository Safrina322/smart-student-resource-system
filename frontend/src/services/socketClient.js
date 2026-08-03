import { io } from "socket.io-client";
import { getApiUrl } from "./apiClient.js";

let socket = null;

// The access token is an httpOnly cookie now, invisible to this code - the
// browser attaches it to the handshake request automatically as long as
// withCredentials is set, same as any other same-site request.
export const connectSocket = () => {
  if (socket?.connected) return socket;

  disconnectSocket();
  socket = io(getApiUrl(), { withCredentials: true, transports: ["websocket", "polling"] });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
