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
} from "react-icons/ci";
import toast from "react-hot-toast";
import { decodeTokenGetUser } from "@/lib/jwt";

export default function Sidebar({
  isMobile = false,
  open = false,
  onClose,
  role,
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

  // Nếu chưa có slast thì không render menu (hoặc render loading)
  if (!slast) {
    return null;
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
      badge: 8,
    },
    {
      label: "Thông tin tài khoản",
      icon: <CiFileOn className="text-2xl" />,
      href: `/${slast}/infor_user`,
    },
    {
      label: "Cài đặt",
      icon: <CiSettings className="text-2xl" />,
      href: `/${slast}/settings`,
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
            // Only enable file management for member
            const isFileManagement =
              item.href === "/file_management" ||
              item.href === "/member_file_management";
            const disabled = role === "member" && !isFileManagement;
            return (
              <li key={item.label} className="mb-1">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-gray-700 hover:bg-gray-100 hover:text-primary relative
                    ${pathname === item.href ? "bg-gray-100 text-primary" : ""}
                    ${
                      disabled
                        ? "opacity-50 pointer-events-none cursor-not-allowed"
                        : ""
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
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
