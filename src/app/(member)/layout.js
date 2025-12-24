"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { CiFolderOn, CiChat1, CiTrash, CiShare2 } from "react-icons/ci";
import Sidebar from "@/shared/layout/Sidebar";
import useSocket from "@/shared/lib/useSocket";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import axiosClient from "@/shared/lib/axiosClient";
// import ChatLayout from "@/components/client/chat/ChatLayout";
import { useTranslations } from "next-intl";

function getBasePath(pathname) {
  if (!pathname) return "/member";
  if (pathname.startsWith("/member")) return "/member";
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg ? `/${seg}` : "/member";
}

export default function ClientLayout({ children }) {
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

  const basePath = useMemo(() => getBasePath(pathname), [pathname]);

  const navItems = useMemo(
    () => [
      {
        key: "files",
        label: t("sidebar.file_management"),
        icon: <CiFolderOn className="text-2xl" />,
        href: `${basePath}/file-management`,
      },
      {
        key: "shared",
        label: t("sidebar.shared"),
        icon: <CiShare2 className="text-2xl" />,
        href: `${basePath}/shared`,
      },
      {
        key: "trash",
        label: t("sidebar.trash"),
        icon: <CiTrash className="text-2xl" />,
        href: `${basePath}/file-management/trash`,
      },
    ],
    [t, basePath]
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

      {/* <main className="flex-1 overflow-auto">
        {pathname?.includes("/chat") ? (
          <ChatLayout updateUnreadCount={updateUnreadCount} />
        ) : (
          children
        )}
      </main> */}

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
