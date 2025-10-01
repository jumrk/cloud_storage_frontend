"use client";
import Link from "next/link";
import Button_custom from "@/components/ui/ButtonCustom";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { decodeTokenGetUser } from "@/lib/jwt";
import toast from "react-hot-toast";
import axiosClient from "@/lib/axiosClient";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { useTranslations } from "next-intl";
import Image from "next/image";
export default function Header() {
  const router = useRouter();
  const t = useTranslations();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const [currentLocale, setCurrentLocale] = useState("vi");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const info = decodeTokenGetUser(token);
      setUser(info);
    } else {
      setUser(null);
    }
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      setCurrentLocale(match ? match[1] : "vi");
    }
  }, []);

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
    toast.success(t("header.logout_success"));
    router.push("/Login");
  };

  const handleSwitchLocale = () => {
    const nextLocale = currentLocale === "vi" ? "en" : "vi";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; SameSite=Lax`;

    window.location.reload();
  };

  return (
    <header className="w-full shadow-xl fixed top-0 left-0 z-50 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="w-30 md:w-36">
          <Image
            src="/images/Logo_2.png"
            alt="logo"
            width={120}
            height={40}
            className="object-cover"
          />
        </Link>

        <div className="flex gap-2 md:gap-4 xl:gap-6 items-center">
          {/* Nút chuyển đổi ngôn ngữ */}
          <button
            onClick={handleSwitchLocale}
            className="flex flex-col relative p-2 items-center group"
            style={{
              minWidth: 40,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            title={t("header.switch_language")}
          >
            <HiOutlineGlobeAlt className="w-7 h-7 text-[#189ff2] group-hover:text-[#0d8ad1] transition" />
            <span className="text-xs font-semibold mt-0.5 text-[#189ff2] group-hover:text-[#0d8ad1] absolute bottom-0 right-0">
              {currentLocale.toUpperCase()}
            </span>
          </button>
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
                    {t("header.file_management")}
                  </button>
                  <button
                    className="w-full text-left cursor-pointer px-4 py-3 hover:bg-gray-50 transition text-red-500"
                    onClick={handleLogout}
                  >
                    {t("header.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button_custom
                onclick={() => router.push("/Login")}
                text={t("header.login")}
                bg="bg-[#1cadd9]"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
