import { io } from "socket.io-client";
import { getCurrentUser } from "./auth";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:5001");

let socket;

export const initSocket = () => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL);
  
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    const user = getCurrentUser();
    const userId = user?.id || user?._id;
    if (userId) {
      socket.emit('join_room', userId.toString());
    }
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};
