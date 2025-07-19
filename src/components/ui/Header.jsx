"use client";
import Link from "next/link";
import Button_custom from "@/components/ui/Button_custom";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { decodeTokenGetUser } from "@/lib/jwt";
import toast from "react-hot-toast";
import axiosClient from "@/lib/axiosClient";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const info = decodeTokenGetUser(token);
      setUser(info);
    } else {
      setUser(null);
    }
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    toast.success("Đăng xuất thành công!");
    router.push("/Login");
  };

  return (
    <header className="w-full shadow-xl fixed top-0 left-0 z-50 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="w-22 md:w-36">
          <img src="/images/Logo_2.png" alt="logo" className="object-cover" />
        </Link>

        <div className="flex gap-2 md:gap-4 xl:gap-6 items-center">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-lg">
                  {user.email ? user.email[0].toUpperCase() : "U"}
                </div>
                <span className="font-medium text-gray-700 max-w-[120px] truncate">
                  {user.email}
                </span>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M7 10l5 5 5-5"
                    stroke="#555"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                  <button
                    className="w-full text-left cursor-pointer px-4 py-3 hover:bg-gray-50 transition"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/${user.slast}/home`);
                    }}
                  >
                    Quản lý file
                  </button>
                  <button
                    className="w-full text-left cursor-pointer px-4 py-3 hover:bg-gray-50 transition text-red-500"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button_custom
                onclick={() => router.push("/Login")}
                text="Đăng nhập"
                bg="bg-[#1cadd9]"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
