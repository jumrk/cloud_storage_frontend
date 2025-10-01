"use client";

import Sidebar from "@/components/ui/Sidebar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaBars } from "react-icons/fa";
import useSocket from "@/lib/useSocket";
import { decodeTokenGetUser } from "@/lib/jwt";
import axiosClient from "@/lib/axiosClient";
import { usePathname } from "next/navigation";
import ChatLayout from "@/components/client/chat/ChatLayout";
import { useTranslations } from "next-intl";

export default function ClientLayout({ children }) {
  const router = useRouter();
  const t = useTranslations();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myId, setMyId] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const pathname = usePathname();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error(t("auth.not_logged_in"));
      router.push("/Login");
      return;
    }
    setIsAuthChecked(true);
    // Lấy role từ token (decode)
    const user = decodeTokenGetUser(token);
    setRole(user?.role || null);
    setMyId(user?.id || user?._id || null);
  }, [router, t]);
  // Hàm cập nhật unreadCount từ API
  const updateUnreadCount = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/message/conversations");
      if (res.data && res.data.conversations) {
        const count = res.data.conversations.reduce(
          (sum, c) => sum + (c.unread ? 1 : 0),
          0
        );
        setUnreadCount(count);
      }
    } catch {}
  }, []);
  // Lắng nghe socket để realtime unreadCount
  useSocket(
    typeof window !== "undefined" ? localStorage.getItem("token") : "",
    (msg) => {
      if (msg && msg.to && myId && msg.to === myId && msg.from !== myId) {
        updateUnreadCount();
      }
    }
  );
  // Lấy số thông báo chưa đọc khi load
  useEffect(() => {
    async function fetchUnreadNotifications() {
      try {
        const res = await axiosClient.get("/api/notification");
        if (res.data && res.data.notifications) {
          const count = res.data.notifications.filter((n) => !n.isRead).length;
          setUnreadNotificationCount(count);
        }
      } catch {}
    }
    fetchUnreadNotifications();
  }, []);
  // Lắng nghe socket notification mới để cập nhật badge realtime
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useSocket(token);
  useEffect(() => {
    if (!socketRef.current) return;
    const handleNew = (noti) => {
      setUnreadNotificationCount((prev) => prev + 1);
    };
    socketRef.current.on("notification:new", handleNew);
    return () => {
      socketRef.current.off("notification:new", handleNew);
    };
  }, [socketRef.current]);
  if (!isAuthChecked) return null;
  return (
    <div className="flex h-screen ">
      {/* Sidebar desktop */}
      <div className="hidden md:block w-60 h-full bg-white shadow-lg z-10">
        <Sidebar
          role={role}
          unreadCount={unreadCount}
          unreadNotificationCount={unreadNotificationCount}
        />
      </div>
      {/* Sidebar mobile (ẩn/hiện qua prop) */}
      <Sidebar
        isMobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        unreadCount={unreadCount}
        unreadNotificationCount={unreadNotificationCount}
      />
      {/* Nút menu mobile */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 bg-white shadow rounded-full border border-gray-200 hover:bg-gray-100 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars className="text-xl text-gray-700" />
        </button>
      )}

      <main className="flex-1 overflow-auto">
        {pathname.includes("/chat") ? (
          <ChatLayout updateUnreadCount={updateUnreadCount} />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
