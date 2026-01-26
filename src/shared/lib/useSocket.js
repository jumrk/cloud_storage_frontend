import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let globalSocket = null;

export default function useSocket(token, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    // ✅ Create socket connection - cookie will be sent automatically
    // Token param kept for backward compatibility but not used
    if (!globalSocket) {
      globalSocket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
        {
          withCredentials: true, // ✅ Send cookies with socket connection
          transports: ["websocket"],
        }
      );
      globalSocket.on("connect", () => {
        console.log("[SOCKET] Connected!", globalSocket.id);
      });
      globalSocket.on("disconnect", () => {
        console.log("[SOCKET] Disconnected!");
      });
    }
    socketRef.current = globalSocket;

    if (onMessage) {
      globalSocket.on("chat:message", onMessage);
    }

    return () => {
      if (onMessage) {
        globalSocket.off("chat:message", onMessage);
      }
    };
  }, [onMessage]); // ✅ Removed token from deps

  return socketRef;
}
