"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa";
import {
  CiAlarmOn,
  CiFolderOn,
  CiShoppingTag,
  CiUser,
  CiClock2,
} from "react-icons/ci";
import Sidebar from "@/shared/layout/Sidebar";
import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";

export default function JobManagementLayout({
  children,
  navItems: navItemsProp,
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations();

  const DEFAULT_NAV = useMemo(
    () => [
      {
        key: "workspace",
        label: t("job_management.nav.workspace"),
        icon: <CiFolderOn className="text-2xl" />,
        href: "/job-management/workspace",
      },
      {
        key: "assigned",
        label: t("job_management.nav.assigned"),
        icon: <CiUser className="text-2xl" />,
        href: "/job-management/assigned",
      },
      {
        key: "recent",
        label: t("job_management.nav.recent"),
        icon: <CiAlarmOn className="text-2xl" />,
        href: "/job-management/recent",
      },
      {
        key: "pinned",
        label: t("job_management.nav.pinned"),
        icon: <CiShoppingTag className="text-2xl" />,
        href: "/job-management/pinned",
      },
      {
        key: "time_tracking",
        label: t("job_management.nav.time_tracking"),
        icon: <CiClock2 className="text-2xl" />,
        href: "/job-management/time-tracking",
      },
    ],
    [t]
  );

  const navItems = useMemo(
    () => navItemsProp ?? DEFAULT_NAV,
    [navItemsProp, DEFAULT_NAV]
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
          logoutLabel={t("header.logout")}
          logoSrc="/images/Logo_2.png"
        />
      </div>

      <Sidebar
        isMobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navItems}
        onLogout={handleLogout}
        logoutLabel={t("header.logout")}
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

      <main className="flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
