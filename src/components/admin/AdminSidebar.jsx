"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiBarChart2,
  FiUsers,
  FiLayers,
  FiUser,
  FiHelpCircle,
  FiBell,
  FiCreditCard,
  FiMessageCircle,
} from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import { decodeTokenGetUser } from "@/lib/jwt";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axiosClient";
import Image from "next/image";

const boards = [
  { href: "/admin", label: "Dashboard", icon: <FiHome size={20} /> },
  { href: "/admin/users", label: "Quản lý user", icon: <FiUsers size={20} /> },
  {
    href: "/admin/google-accounts",
    label: "Tài khoản Google",
    icon: <FiLayers size={20} />,
  },
  {
    href: "/admin/plans",
    label: "Quản lý gói dịch vụ",
    icon: <FiBarChart2 size={20} />,
  },
  {
    href: "/admin/payments",
    label: "Quản lý thanh toán",
    icon: <FiCreditCard size={20} />,
  },
  {
    href: "/admin/chat",
    label: "Nhắn tin",
    icon: <FiMessageCircle size={20} />,
  },
];
const others = [
  { href: "/admin/support", label: "Hỗ trợ", icon: <FiHelpCircle size={20} /> },
  {
    href: "/admin/notifications",
    label: "Thông báo",
    icon: <FiBell size={20} />,
  },
];

function unlockAudio() {
  if (typeof window !== "undefined") {
    const audio = new Audio("/sound/sounds.wav");
    audio.play().catch(() => {});
  }
}

export default function AdminSidebar(props) {
  const pathname = usePathname();
  const unreadCount = props.unreadCount || 0;
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Thêm loading state
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
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);
    try {
      // Sử dụng axiosClient thay vì fetch
      await axiosClient.post("/api/auth/logout");
      console.log("Logout thành công");
    } catch (error) {
      console.error("Lỗi logout:", error);
      // Vẫn tiếp tục logout local ngay cả khi API fail
    } finally {
      // Cleanup local storage
      localStorage.removeItem("token");
      localStorage.clear();

      // Redirect về trang login
      router.push("/Login");
    }
  };

  // Responsive: sidebar open/close state (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Nếu props.open/onOpen/onClose được truyền từ layout thì dùng, không thì tự quản lý
  const open = typeof props.open === "boolean" ? props.open : sidebarOpen;
  const onOpen = props.onOpen || (() => setSidebarOpen(true));
  const onClose = props.onClose || (() => setSidebarOpen(false));

  return (
    <>
      {/* Nút menu mobile, chỉ hiện khi sidebar đóng */}
      {isMobile && !open && (
        <button
          onClick={onOpen}
          className=" absolute top-4 left-4 z-50 p-3 bg-gray-100 text-gray-800 rounded-full shadow-lg md:hidden border border-gray-300"
          aria-label="Mở menu admin"
        >
          <FaBars size={24} />
        </button>
      )}
      {/* Overlay mobile khi sidebar mở */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`bg-gray-100 border-r border-gray-200 shadow
          w-64 flex-shrink-0 z-50 transition-transform duration-300
          fixed md:static top-0 left-0 h-screen
          ${isMobile ? (open ? "translate-x-0" : "-translate-x-full") : ""}
          md:translate-x-0
          rounded-tr-3xl rounded-br-3xl md:rounded-tr-none md:rounded-br-none flex flex-col overflow-y-auto`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col flex-1 px-4  gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center mt-3">
            <Image
              src="/images/Logo_2.png"
              alt="Logo"
              className="h-12"
              width={120}
              height={40}
              placeholder="blur"
              blurDataURL="data:image/png;base64,..."
              priority
            />
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
                  onClick={item.label === "Nhắn tin" ? unlockAudio : undefined}
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
                  {item.label === "Nhắn tin" && unreadCount > 0 && (
                    <span className="ml-2 bg-[#1cadd9] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                      {unreadCount}
                    </span>
                  )}
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
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition text-red-500 cursor-pointer"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
