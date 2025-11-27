"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { CiBellOn } from "react-icons/ci";
import Sidebar from "@/shared/layout/Sidebar";
import useSocket from "@/shared/lib/useSocket";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";

function getBasePath(pathname) {
  if (!pathname) return "";
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg ? `/${seg}` : "";
}

export default function NotificationLayout({ children }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const user = decodeTokenGetUser(token);
    setMyId(user?.id || user?._id || null);
  }, []);

  const updateUnreadCount = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/notification/unread-count");
      const count = res?.data?.count ?? 0;
      setUnreadCount(count);
    } catch {}
  }, []);

  useSocket(
    typeof window !== "undefined" ? localStorage.getItem("token") : "",
    (msg) => {
      if (msg && msg.type === "notification:new") {
        updateUnreadCount();
      }
    }
  );

  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  const basePath = useMemo(() => getBasePath(pathname), [pathname]);

  const navItems = useMemo(
    () => [
      {
        key: "notification",
        label: t("sidebar.notification"),
        icon: <CiBellOn className="text-2xl" />,
        href: `${basePath}/notification`,
        badge: unreadCount,
      },
    ],
    [t, basePath, unreadCount]
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
        <Sidebar
          navItems={navItems}
          onLogout={handleLogout}
          logoutLabel={t("sidebar.logout")}
          logoSrc="/images/Logo_2.png"
        />
      </div>

      <Sidebar
        isMobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navItems}
        onLogout={handleLogout}
        logoutLabel={t("sidebar.logout")}
        logoSrc="/images/Logo_2.png"
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

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

