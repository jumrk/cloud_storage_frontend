"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CiHome,
  CiFolderOn,
  CiUser,
  CiBellOn,
  CiFileOn,
  CiSettings,
  CiLogout,
  CiChat1,
} from "react-icons/ci";
import toast from "react-hot-toast";
import { decodeTokenGetUser } from "@/lib/jwt";
import { FaBars } from "react-icons/fa";

export default function Sidebar({
  isMobile = false,
  open = false,
  onClose,
  role,
  unreadCount = 0,
  unreadNotificationCount = 0,
  menuButtonPosition = "fixed top-4 left-4 z-50", // thêm prop này
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slast, setSlast] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        const user = decodeTokenGetUser(token);
        setSlast(user?.slast || "");
        console.log(slast);
      }
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(open);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile, open]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    toast.success("Đăng xuất thành công!");
    router.push("/Login");
  };

  function unlockAudio() {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sound/sounds.wav");
      audio.play().catch(() => {});
    }
  }

  // Sidebar menu items
  const menu = [
    {
      label: "Trang chủ",
      icon: <CiHome className="text-2xl" />,
      href: `/${slast}/home`,
    },
    {
      label: "Quản lý tệp",
      icon: <CiFolderOn className="text-2xl" />,
      href: `/${slast}/file_management`,
    },
    {
      label: "Quản lý tài khoản",
      icon: <CiUser className="text-2xl" />,
      href: `/${slast}/user_management`,
    },
    {
      label: "Thông báo",
      icon: <CiBellOn className="text-2xl" />,
      href: `/${slast}/notification`,
      badge: unreadNotificationCount,
    },
    {
      label: "Thông tin tài khoản",
      icon: <CiFileOn className="text-2xl" />,
      href: `/${slast}/infor_user`,
    },
    {
      label: "Nhắn tin",
      icon: <CiChat1 className="text-2xl" />,
      href: `/${slast}/chat`,
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-all"
          onClick={onClose}
        />
      )}
      {/* Nút menu mobile, chỉ hiện khi sidebar đóng */}
      {isMobile && !isSidebarOpen && (
        <button
          className={`${menuButtonPosition} p-2 bg-white shadow rounded-full border border-gray-200 hover:bg-gray-100 md:hidden`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Mở menu"
        >
          <FaBars className="text-xl text-gray-700" />
        </button>
      )}
      <nav
        className={`bg-white h-screen flex flex-col justify-between fixed top-0 left-0 z-50 transition-transform duration-300
        ${
          isMobile
            ? isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "w-60"
        }
        w-60`}
        style={{ minWidth: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img src="/images/Logo_2.png" alt="Logo" className="h-7" />
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <span className="sr-only">Đóng menu</span>×
            </button>
          )}
        </div>
        {/* Menu */}
        <ul className="flex-1 px-4 py-6 space-y-2">
          {menu.map((item, idx) => {
            return (
              <li key={item.label} className="mb-1">
                <Link
                  href={item.href}
                  onClick={item.label === "Nhắn tin" ? unlockAudio : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-gray-700 hover:bg-gray-100 hover:text-primary relative
                    ${pathname === item.href ? "bg-gray-100 text-primary" : ""}
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.label === "Nhắn tin" && unreadCount > 0 && (
                    <span className="ml-2 bg-[#1cadd9] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                      {unreadCount}
                    </span>
                  )}
                  {item.label === "Thông báo" &&
                    unreadNotificationCount > 0 && (
                      <span className="ml-2 bg-[#1cadd9] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                        {unreadNotificationCount}
                      </span>
                    )}
                  {item.badge &&
                    item.label !== "Nhắn tin" &&
                    item.label !== "Thông báo" && (
                      <span className="ml-auto bg-[#1cadd9] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                </Link>
              </li>
            );
          })}
        </ul>
        {/* Đăng xuất */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-gray-700 hover:bg-gray-100 hover:text-primary"
          >
            <CiLogout className="text-2xl" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </nav>
    </>
  );
}
