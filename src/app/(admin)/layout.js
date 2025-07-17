"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import toast from "react-hot-toast";
import { decodeTokenGetUser } from "@/lib/jwt";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Lấy user từ localStorage
    const userStr =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!userStr) {
      router.replace("/");
      toast.error("Vui lòng đăng nhập!");
      return;
    }
    let user = decodeTokenGetUser(userStr);
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {}
    if (!user || user.role !== "admin") {
      router.replace("/");
      toast.error("Bạn không có quyền truy cập trang admin!");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-row bg-gray-100 font-sans">
      <div
        className="
          fixed md:sticky top-0 left-0 z-30 flex-shrink-0
          w-20 md:w-64
          bg-white
          border-r border-gray-200
        "
      >
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
      </div>
      <main className="flex-1 p-8 md:p-12 overflow-auto bg-white  shadow-md">
        {children}
      </main>
    </div>
  );
}
