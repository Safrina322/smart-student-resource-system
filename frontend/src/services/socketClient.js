import { io } from "socket.io-client";
import { getApiUrl } from "./apiClient.js";

let socket = null;

export const connectSocket = (token) => {
  if (!token) return null;
  if (socket?.connected && socket.auth?.token === token) return socket;

  disconnectSocket();
  socket = io(getApiUrl(), { auth: { token }, transports: ["websocket", "polling"] });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
