"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa";
import {
  CiText,
  CiVideoOn,
  CiMicrophoneOn,
} from "react-icons/ci";
import Sidebar from "@/shared/layout/Sidebar";
import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";

export default function VideoToolsLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations();

  const navItems = useMemo(
    () => [
      {
        key: "extract-subtitle",
        label: t("video_tools.nav.extract_subtitle"),
        icon: <CiText className="text-2xl" />,
        href: "/video-tools/extract-subtitle",
      },
      {
        key: "hardsub",
        label: t("video_tools.nav.hardsub"),
        icon: <CiVideoOn className="text-2xl" />,
        href: "/video-tools/hardsub",
      },
      {
        key: "voiceover",
        label: t("video_tools.nav.voiceover"),
        icon: <CiMicrophoneOn className="text-2xl" />,
        href: "/video-tools/voiceover",
      },
    ],
    [t]
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

