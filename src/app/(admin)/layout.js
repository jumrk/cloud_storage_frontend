"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa";
import {
  FiHome,
  FiBarChart2,
  FiUsers,
  FiLayers,
  FiCreditCard,
  FiMessageCircle,
  FiFolder,
  FiSettings,
} from "react-icons/fi";
import SidebarAdmin from "@/shared/layout/SidebarAdmin";
import useSocket from "@/shared/lib/useSocket";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myId, setMyId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setIsLoadingUser(false);
      router.replace("/login");
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    const userInfo = decodeTokenGetUser(token);
    setMyId(userInfo?.id || userInfo?._id || null);
    setUser(userInfo);

    // Check if user is admin
    try {
      const userData = token ? JSON.parse(token) : null;
      if (!userData || userData.role !== "admin") {
        router.replace("/");
        toast.error("Bạn không có quyền truy cập trang admin!");
      }
    } catch {
      // If token is not JSON, check from decoded token
      if (!userInfo || userInfo.role !== "admin") {
        router.replace("/");
        toast.error("Bạn không có quyền truy cập trang admin!");
      }
    }

    // Fetch full user data from API
    axiosClient
      .get("/api/user")
      .then((res) => {
        if (res?.data) {
          setUser((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        setIsLoadingUser(false);
      });
  }, [router]);

  const updateUnreadCount = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/message/conversations");
      const count =
        res?.data?.conversations?.reduce(
          (sum, c) => sum + (c.unread ? 1 : 0),
          0
        ) ?? 0;
      setUnreadCount(count);
    } catch {}
  }, []);

  useSocket(
    typeof window !== "undefined" ? localStorage.getItem("token") : "",
    (msg) => {
      if (msg && msg.to && myId && msg.to === myId && msg.from !== myId) {
        updateUnreadCount();
      }
    }
  );

  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  const navItems = useMemo(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <FiHome className="text-2xl" />,
        href: "/admin",
      },
      {
        key: "users",
        label: "Quản lý user",
        icon: <FiUsers className="text-2xl" />,
        href: "/admin/users",
      },
      {
        key: "google-accounts",
        label: "Tài khoản Google",
        icon: <FiLayers className="text-2xl" />,
        href: "/admin/google-accounts",
      },
      {
        key: "plans",
        label: "Quản lý gói dịch vụ",
        icon: <FiBarChart2 className="text-2xl" />,
        href: "/admin/plans",
      },
      {
        key: "payments",
        label: "Quản lý thanh toán",
        icon: <FiCreditCard className="text-2xl" />,
        href: "/admin/payments",
      },
      {
        key: "projects",
        label: "Quản lý dự án",
        icon: <FiFolder className="text-2xl" />,
        href: "/admin/projects",
      },
      {
        key: "chat",
        label: "Nhắn tin",
        icon: <FiMessageCircle className="text-2xl" />,
        href: "/admin/chat",
        badge: unreadCount,
        playSound: true,
      },
      {
        key: "settings",
        label: "Cài đặt",
        icon: <FiSettings className="text-2xl" />,
        href: "/admin/settings",
      },
    ],
    [unreadCount]
  );

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="flex h-screen">
      <div className="hidden md:block w-60 h-full bg-white border-r border-[var(--color-border)] z-10">
        <SidebarAdmin
          navItems={navItems}
          onLogout={handleLogout}
          logoutLabel="Đăng xuất"
          logoSrc="/images/Logo_2.png"
          user={user}
          router={router}
          t={(key) => key}
          isLoadingUser={isLoadingUser}
        />
      </div>
      <SidebarAdmin
        isMobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navItems}
        onLogout={handleLogout}
        logoutLabel="Đăng xuất"
        logoSrc="/images/Logo_2.png"
        user={user}
        router={router}
        t={(key) => key}
        isLoadingUser={isLoadingUser}
      />
      {!sidebarOpen && (
        <button
          className="fixed left-4 top-4 z-50 rounded-full border border-[var(--color-border)] bg-white p-2 shadow md:hidden hover:bg-[var(--color-surface-50)]"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <FaBars className="text-xl text-[var(--color-text-muted)]" />
        </button>
      )}
      <main className="flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
