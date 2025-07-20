"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import toast from "react-hot-toast";
import { decodeTokenGetUser } from "@/lib/jwt";
import axiosClient from "@/lib/axiosClient";
import ChatLayout from "@/components/client/chat/ChatLayout";
import { usePathname } from "next/navigation";
import useSocket from "@/lib/useSocket";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Lấy số tin nhắn chưa đọc từ localStorage hoặc state nếu có
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    async function fetchUnread() {
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
    }
    fetchUnread();
  }, []);

  useEffect(() => {
    // Lấy user từ localStorage
    const userStr =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!userStr) {
      router.replace("/");
      toast.error("Vui lòng đăng nhập!");
      return;
    }
    let user = decodeTokenGetUser(userStr);
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {}
    if (!user || user.role !== "admin") {
      router.replace("/");
      toast.error("Bạn không có quyền truy cập trang admin!");
    }
  }, [router]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const [myId, setMyId] = useState(null);
  useEffect(() => {
    if (token) {
      const info = decodeTokenGetUser(token);
      setMyId(info?.id || info?._id || null);
    }
  }, [token]);

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
  useSocket(token, (msg) => {
    if (msg && msg.to && myId && msg.to === myId && msg.from !== myId) {
      updateUnreadCount();
    }
  });

  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Sidebar cố định */}
      <div
        className="
          fixed top-0 left-0 z-30 h-screen w-20 md:w-64
          bg-white border-r border-gray-200
        "
      >
        <AdminSidebar unreadCount={unreadCount} />
      </div>
      {/* Main content, KHÔNG margin-left để tránh đè lên sidebar */}
      <main
        className="
          md:ml-64
          min-h-screen
          overflow-auto
          bg-white
          shadow-md
        "
        style={{ minHeight: "100vh" }}
      >
        {/* Nếu là trang chat thì truyền updateUnreadCount vào ChatLayout */}
        {pathname.includes("/chat") ? (
          <ChatLayout isAdmin={true} updateUnreadCount={updateUnreadCount} />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
