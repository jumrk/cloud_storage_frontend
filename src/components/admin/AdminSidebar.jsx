"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiBarChart2,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiLayers,
  FiUser,
  FiHelpCircle,
  FiMenu,
  FiBell,
  FiCreditCard,
} from "react-icons/fi";
import { decodeTokenGetUser } from "@/lib/jwt";
import { useRouter } from "next/navigation";

const boards = [
  { href: "/dashboard", label: "Dashboard", icon: <FiHome size={20} /> },
  { href: "/users", label: "Quản lý user", icon: <FiUsers size={20} /> },
  {
    href: "/google-accounts",
    label: "Tài khoản Google",
    icon: <FiLayers size={20} />,
  },
  {
    href: "/plans",
    label: "Quản lý gói dịch vụ",
    icon: <FiBarChart2 size={20} />,
  },
  {
    href: "/payments",
    label: "Quản lý thanh toán",
    icon: <FiCreditCard size={20} />,
  },
];
const others = [
  { href: "/settings", label: "Cài đặt", icon: <FiSettings size={20} /> },
  { href: "/support", label: "Hỗ trợ", icon: <FiHelpCircle size={20} /> },
  { href: "/notifications", label: "Thông báo", icon: <FiBell size={20} /> },
];

export default function AdminSidebar(props) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const info = decodeTokenGetUser(token);
      setUser(info);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    router.push("/Login");
  };

  return (
    <>
      {/* Floating open button for mobile */}
      {isMobile && !props.open && (
        <button
          onClick={props.onOpen}
          className="fixed top-4  left-4 z-50 p-3 bg-gray-100 text-gray-800 rounded-full shadow-lg md:hidden border border-gray-300"
          aria-label="Mở menu admin"
        >
          <FiMenu size={24} />
        </button>
      )}
      <aside
        className={`bg-gray-100 border-r border-gray-200 shadow ${
          isMobile ? "h-screen" : "h-[calc(100vh-4rem)]"
        } w-64 flex-shrink-0 z-20 transition-transform duration-300
        fixed md:static ${
          isMobile ? "top-0" : "top-16"
        } md:top-0 left-0 md:h-screen md:pt-0 pt-0
        ${
          props.open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 rounded-tr-3xl rounded-br-3xl md:rounded-tr-none md:rounded-br-none flex flex-col`}
        style={{ top: isMobile ? 0 : "4rem" }}
      >
        <div className="flex flex-col flex-1 px-4 py-8 gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2 mb-2">
            <img src="/images/Logo_2.png" alt="" />
          </div>
          {/* Boards */}
          <div>
            <div className="text-xs text-[#00c3ff] uppercase tracking-wide mb-2 pl-2">
              Boards
            </div>
            <nav className="flex flex-col gap-1">
              {boards.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-base font-medium
                  ${
                    pathname === item.href
                      ? "bg-white text-primary font-semibold shadow-sm"
                      : "hover:bg-white hover:text-primary text-gray-700"
                  }`}
                >
                  <span className="flex items-center justify-center w-7 h-7">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          {/* Others */}
          <div>
            <div className="text-xs text-[#00c3ff] uppercase tracking-wide mb-2 pl-2">
              Other
            </div>
            <nav className="flex flex-col gap-1">
              {others.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-base font-medium
                  ${
                    pathname === item.href
                      ? "bg-white text-primary font-semibold shadow-sm"
                      : "hover:bg-white hover:text-primary text-gray-700"
                  }`}
                >
                  <span className="flex items-center justify-center w-7 h-7">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-1" />
          {/* User avatar bottom */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm mb-2 relative"
            ref={menuRef}
          >
            <div
              className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg cursor-pointer"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {user?.email ? user.email[0].toUpperCase() : <FiUser size={22} />}
            </div>
            <div
              className="flex flex-col cursor-pointer"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="font-semibold text-gray-800 text-sm">
                {user?.fullName || user?.email || "User"}
              </span>
              <span className="text-xs text-gray-400">
                {user?.role || "Admin"}
              </span>
            </div>
            {/* Dropdown menu */}
            <div
              className={`absolute right-0 bottom-14 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 z-50 transition-all duration-300 ${
                menuOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 translate-y-4 pointer-events-none"
              }`}
              style={{ boxShadow: "0 8px 32px rgba(80,80,120,0.10)" }}
            >
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/your_folder");
                }}
              >
                Quản lý file của bạn
              </button>
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition text-red-500 cursor-pointer"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        {/* Nút đóng sidebar trên mobile */}
        <button
          className="absolute top-4 right-4 md:hidden p-2 rounded-full bg-gray-200 hover:bg-gray-300 border border-gray-300 transition"
          onClick={props.onClose}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="#555"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-x"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </aside>
    </>
  );
}
