"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CiFolderOn, CiLogout, CiViewList } from "react-icons/ci";
import { PiToolboxThin } from "react-icons/pi";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { decodeTokenGetUser } from "@/lib/jwt";
import toast from "react-hot-toast";
import Image from "next/image";
import axiosClient from "@/lib/axiosClient";

function normalizePath(p = "") {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}
function isActivePath(pathname, href, exact = false) {
  const p = normalizePath(pathname || "");
  const h = normalizePath(href || "");
  if (exact) return p === h;
  return p === h || p.startsWith(h + "/");
}

export default function MemberSidebar({
  isMobile = false,
  open = false,
  onClose,
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [leaderEmail, setLeaderEmail] = useState(null);

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    router.push("/Login");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const user = decodeTokenGetUser(token);
      setLeaderEmail(user?.leaderEmail ?? null);
    } catch {
      setLeaderEmail(null);
    }
  }, []);

  const isLeaderAllowed = useMemo(
    () =>
      leaderEmail === "jumrk03@gmail.com" ||
      leaderEmail === "dammevietdt@gmail.com",
    [leaderEmail]
  );

  const items = useMemo(
    () => [
      {
        key: "files",
        label: t("sidebar.file_management") || "Quản lý file",
        icon: <CiFolderOn className="text-2xl" />,
        href: "/member",
        exact: true,
      },
      {
        key: "tools",
        label: t("sidebar.tool") || "Công cụ",
        icon: <PiToolboxThin className="text-2xl" />,
        href: "/member/tools",
        restricted: true,
      },
      {
        key: "job",
        label: "Quản lý công việc",
        icon: <CiViewList className="text-2xl" />,
        href: "/member/job_management",
        restricted: true,
      },
    ],
    [t]
  );

  return (
    <>
      {isMobile && open && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      )}

      <nav
        className={`bg-white h-screen flex flex-col justify-between fixed top-0 left-0 z-50 transition-transform duration-300 w-60 ${
          isMobile ? (open ? "translate-x-0" : "-translate-x-full") : ""
        }`}
      >
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
              aria-label={t("sidebar.close_menu") || "Đóng menu"}
            >
              ×
            </button>
          )}
        </div>

        <ul className="flex-1 px-4 py-6 space-y-2">
          {items.map((it) => {
            const active = isActivePath(pathname, it.href, it.exact);
            const disabled = it.restricted && !isLeaderAllowed;

            const base =
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium";
            const stateClass = disabled
              ? "text-gray-400 cursor-not-allowed"
              : active
              ? "bg-gray-100 text-primary"
              : "text-gray-700 hover:bg-gray-100 hover:text-primary";

            return (
              <li key={it.key} className="mb-1">
                <Link
                  href={disabled ? "#" : it.href}
                  aria-disabled={disabled}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => {
                    if (disabled) {
                      e.preventDefault();
                      toast("Tính năng đang phát triển");
                      return;
                    }
                    if (isMobile && onClose) onClose();
                  }}
                  className={`${base} ${stateClass}`}
                >
                  {it.icon}
                  <span className="truncate">{it.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="mb-1">
            <div
              onClick={handleLogout}
              className="flex items-center gap-3 text-gray-700 cursor-pointer hover:bg-gray-100 hover:text-primary px-3 py-2 rounded-lg transition-all font-medium"
            >
              <CiLogout />
              <span className="truncate">Đăng xuất</span>
            </div>
          </li>
        </ul>

        <div className="px-4 pb-6 text-xs text-gray-400">
          <span>Member</span>
        </div>
      </nav>
    </>
  );
}
