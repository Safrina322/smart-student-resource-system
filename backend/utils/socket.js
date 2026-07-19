// Holds the Socket.io server instance so any module (route handlers,
// services) can emit to a user without importing index.js and creating a
// circular dependency.
let ioInstance = null;

export const setIo = (io) => {
  ioInstance = io;
};

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};
