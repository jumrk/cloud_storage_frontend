"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CiHome,
  CiFolderOn,
  CiUser,
  CiBellOn,
  CiFileOn,
  CiLogout,
  CiChat1,
  CiViewList,
  CiVideoOn,
} from "react-icons/ci";
import { PiToolboxThin } from "react-icons/pi";
import toast from "react-hot-toast";
import { decodeTokenGetUser } from "@/lib/jwt";
import axiosClient from "@/lib/axiosClient";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { IoCloudDownloadOutline } from "react-icons/io5";

function normalizePath(p = "") {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

function isActivePath(pathname, href) {
  const p = normalizePath(pathname || "");
  const h = normalizePath(href || "");
  return p === h || p.startsWith(h + "/");
}

export default function Sidebar({
  isMobile = false,
  open = false,
  onClose,
  unreadCount = 0,
  unreadNotificationCount = 0,
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  const [slast, setSlast] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const user = decodeTokenGetUser(token);
    setSlast(user?.slast || "");
    setEmail(user?.email || "");
  }, []);

  const allowedEmails = ["jumrk03@gmail.com", "dammevietdt@gmail.com"];

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    toast.success(t("sidebar.logout_success"));
    router.push("/Login");
  };

  function unlockAudio() {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sound/sounds.wav");
      audio.play().catch(() => {});
    }
  }

  const menu = useMemo(() => {
    if (!slast) return [];
    return [
      {
        key: "home",
        label: t("sidebar.home"),
        icon: <CiHome className="text-2xl" />,
        href: `/${slast}/home`,
      },
      {
        key: "file_management",
        label: t("sidebar.file_management"),
        icon: <CiFolderOn className="text-2xl" />,
        href: `/${slast}/file_management`,
      },
      {
        key: "job_management",
        label: t("sidebar.job_management"),
        icon: <CiViewList className="text-2xl" />,
        href: `/${slast}/job_management`,
      },
      {
        key: "tool",
        label: t("sidebar.tool"),
        icon: <PiToolboxThin className="text-2xl" />,
        href: `/${slast}/tools/download`,
        restricted: true,
      },
      {
        key: "edit_video",
        label: t("sidebar.edit_video"),
        icon: <CiVideoOn className="text-2xl" />,
        href: `/${slast}/edit-video`,
        restricted: true,
      },
      {
        key: "donwload_video",
        label: t("sidebar.download_video"),
        icon: <IoCloudDownloadOutline className="text-2xl" />,
        href: `/${slast}/download-video`,
        restricted: true,
      },
      {
        key: "user_management",
        label: t("sidebar.user_management"),
        icon: <CiUser className="text-2xl" />,
        href: `/${slast}/user_management`,
      },
      {
        key: "notification",
        label: t("sidebar.notification"),
        icon: <CiBellOn className="text-2xl" />,
        href: `/${slast}/notification`,
        badge: unreadNotificationCount,
      },
      {
        key: "account_info",
        label: t("sidebar.account_info"),
        icon: <CiFileOn className="text-2xl" />,
        href: `/${slast}/infor_user`,
      },
      {
        key: "chat",
        label: t("sidebar.chat"),
        icon: <CiChat1 className="text-2xl" />,
        href: `/${slast}/chat`,
        badge: unreadCount,
        playSound: true,
      },
    ];
  }, [slast, t, unreadCount, unreadNotificationCount]);

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-all"
          onClick={onClose}
        />
      )}

      <nav
        className={`bg-white h-screen flex flex-col justify-between fixed top-0 left-0 z-50 transition-transform duration-300
          ${isMobile ? (open ? "translate-x-0" : "-translate-x-full") : "w-60"}
          w-60`}
        style={{ minWidth: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Image
              src="/images/Logo_2.png"
              alt="Logo"
              width={120}
              height={40}
              priority
            />
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <span className="sr-only">{t("sidebar.close_menu")}</span>×
            </button>
          )}
        </div>

        {/* Menu */}
        <ul className="flex-1 px-4 py-6 space-y-2">
          {/* Khi chưa có slast, có thể render skeleton ngắn */}
          {!slast && (
            <>
              <li className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              <li className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              <li className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            </>
          )}

          {slast &&
            menu.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.key} className="mb-1">
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (item.playSound) unlockAudio();
                      if (item.restricted && !allowedEmails.includes(email)) {
                        e.preventDefault();
                        toast("Đang thử nghiệm");
                        return;
                      }
                      if (isMobile && onClose) onClose();
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium relative
                      ${
                        active
                          ? "bg-gray-100 text-primary"
                          : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                      }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>

                    {!!item.badge && (
                      <span className="ml-auto bg-[#1cadd9] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>

        {/* Logout */}
        <div className="px-4 pb-12 md:pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-gray-700 hover:bg-gray-100 hover:text-primary"
          >
            <CiLogout className="text-2xl" />
            <span>{t("sidebar.logout")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
