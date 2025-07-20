import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(token, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      {
        auth: { token },
        transports: ["websocket"],
      }
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("Socket connected");
    });

    socket.on("chat:message", (msg) => {
      if (onMessage) onMessage(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, onMessage]);

  return socketRef;
}
