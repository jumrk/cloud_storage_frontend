import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiMessageSquare,
  FiBell,
  FiSettings,
  FiPhoneCall,
} from "react-icons/fi";

const NAV_ITEMS = [
  { key: "chats", icon: <FiMessageSquare />, label: "Tin nhắn" },
  { key: "calls", icon: <FiPhoneCall />, label: "Cuộc gọi" },
  { key: "notifications", icon: <FiBell />, label: "Thông báo" },
  { key: "settings", icon: <FiSettings />, label: "Cài đặt" },
];

export default function ChatNavRail({
  active = "chats",
  onNavigate,
  notificationCount = 0,
}) {
  return (
    <>
      {/* Desktop: Vertical nav rail on the left */}
      <nav className="hidden lg:flex flex-col items-center py-6 px-3 bg-white border-r border-[var(--color-border)] shadow-sm">
        <Link href="/" className="mb-6">
          <Image
            src="/images/Logo_1.png"
            alt="D2MBox"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
        </Link>
        <div className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.key)}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition ${
                  isActive
                    ? "bg-brand text-white shadow-md"
                    : "text-text-muted hover:bg-[var(--color-surface-50)]"
                }`}
                title={item.label}
              >
                <span className="text-[18px]">{item.icon}</span>
                {/* Badge for notifications */}
                {item.key === "notifications" && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-danger-500)] text-white text-[10px] font-bold flex items-center justify-center">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile: Bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--color-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.key)}
                className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${
                  isActive ? "text-brand" : "text-text-muted"
                }`}
              >
                <span
                  className={`text-[22px] transition ${
                    isActive ? "scale-110" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? "font-semibold" : ""
                  }`}
                >
                  {item.label}
                </span>
                {/* Badge for notifications */}
                {item.key === "notifications" && notificationCount > 0 && (
                  <span className="absolute top-0 right-2 w-5 h-5 rounded-full bg-[var(--color-danger-500)] text-white text-[10px] font-bold flex items-center justify-center">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav to prevent content overlap */}
      <style jsx global>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        @media (max-width: 1023px) {
          .chat-layout-content {
            padding-bottom: 80px;
          }
        }
      `}</style>
    </>
  );
}
