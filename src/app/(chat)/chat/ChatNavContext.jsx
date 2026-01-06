"use client";

import { createContext, useContext, useState } from "react";

const ChatNavContext = createContext(null);

export function ChatNavProvider({ children }) {
  const [activeNav, setActiveNav] = useState("chats");
  const [notificationCount, setNotificationCount] = useState(0);

  return (
    <ChatNavContext.Provider
      value={{
        activeNav,
        setActiveNav,
        notificationCount,
        setNotificationCount,
      }}
    >
      {children}
    </ChatNavContext.Provider>
  );
}

export function useChatNav() {
  const context = useContext(ChatNavContext);
  if (!context) {
    throw new Error("useChatNav must be used within ChatNavProvider");
  }
  return context;
}

