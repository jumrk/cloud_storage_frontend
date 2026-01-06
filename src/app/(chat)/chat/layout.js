"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChatNavProvider, useChatNav } from "@/app/(chat)/chat/ChatNavContext";
import {
  FiMessageSquare,
  FiBell,
  FiSettings,
  FiPhoneCall,
} from "react-icons/fi";

function ChatRouteLayoutContent({ children }) {
  const router = useRouter();
  const { activeNav, setActiveNav, notificationCount } = useChatNav();

  // Custom navigation for chat (using onClick instead of href)
  const customNavSections = useMemo(
    () => [
      {
        key: "chats",
        label: "Tin nhắn",
        icon: <FiMessageSquare className="text-2xl" />,
        onClick: () => setActiveNav("chats"),
        activeKey: activeNav,
      },
      {
        key: "calls",
        label: "Cuộc gọi",
        icon: <FiPhoneCall className="text-2xl" />,
        onClick: () => setActiveNav("calls"),
        activeKey: activeNav,
      },
      {
        key: "notifications",
        label: "Thông báo",
        icon: <FiBell className="text-2xl" />,
        onClick: () => setActiveNav("notifications"),
        activeKey: activeNav,
        badge:
          notificationCount > 0
            ? notificationCount > 9
              ? "9+"
              : notificationCount
            : null,
      },
      {
        key: "settings",
        label: "Cài đặt",
        icon: <FiSettings className="text-2xl" />,
        onClick: () => setActiveNav("settings"),
        activeKey: activeNav,
      },
    ],
    [activeNav, setActiveNav, notificationCount]
  );

  return (
    <div className="w-full h-screen overflow-hidden">
      <div className="w-full h-screen overflow-hidden">{children}</div>
    </div>
  );
}

export default function ChatRouteLayout({ children }) {
  return (
    <ChatNavProvider>
      <ChatRouteLayoutContent>{children}</ChatRouteLayoutContent>
    </ChatNavProvider>
  );
}
