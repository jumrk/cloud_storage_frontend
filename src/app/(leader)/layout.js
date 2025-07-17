"use client";

import Sidebar from "@/components/ui/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaBars } from "react-icons/fa";
import { decodeTokenGetUser } from "@/lib/jwt";

export default function ClientLayout({ children }) {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập, vui lòng đăng nhập");
      router.push("/Login");
      return;
    }
    setIsAuthChecked(true);
    // Lấy role từ token (decode)
    const user = decodeTokenGetUser(token);
    setRole(user?.role || null);
  }, [router]);
  if (!isAuthChecked) return null;
  return (
    <div className="flex h-screen">
      {/* Sidebar desktop */}
      <div className="hidden md:block w-60 h-full bg-white shadow-lg z-10">
        <Sidebar role={role} />
      </div>
      {/* Sidebar mobile (ẩn/hiện qua prop) */}
      <Sidebar
        isMobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />
      {/* Nút menu mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white shadow rounded-full border border-gray-200 hover:bg-gray-100 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <FaBars className="text-xl text-gray-700" />
      </button>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
