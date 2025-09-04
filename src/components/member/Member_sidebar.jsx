"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CiFolderOn } from "react-icons/ci";
import { PiToolboxThin } from "react-icons/pi";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { decodeTokenGetUser } from "@/lib/jwt";
import toast from "react-hot-toast";

export default function MemberSidebar({
  isMobile = false,
  open = false,
  onClose,
}) {
  const [leaderEmail, setLeaderEmail] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const user = decodeTokenGetUser(token);
          setLeaderEmail(user?.leaderEmail ?? null);
        }
      } catch (e) {
        setLeaderEmail(null);
      }
    }
  }, []);

  const pathname = usePathname();
  const t = useTranslations();

  const items = [
    {
      key: "files",
      label: t("sidebar.file_management") || "Quản lý file",
      icon: <CiFolderOn className="text-2xl" />,
      href: "/member/member_file_management",
    },
    {
      key: "tools",
      label: t("sidebar.tool") || "Công cụ",
      icon: <PiToolboxThin className="text-2xl" />,
      href: "/member/tools",
    },
  ];

  const isLeaderAllowed =
    leaderEmail === "jumrk03@gmail.com" ||
    leaderEmail === "dammevietdt@gmail.com";

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
            <img src="/images/Logo_2.png" alt="Logo" className="h-10" />
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
            const active =
              pathname === it.href || pathname.startsWith(`${it.href}/`);
            const isToolsItem = it.key === "tools";

            const disabled = isToolsItem && !isLeaderAllowed;

            const baseClasses =
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium";
            const activeClasses = active ? "bg-gray-100 text-primary" : "";
            const enabledHover =
              "text-gray-700 hover:bg-gray-100 hover:text-primary";
            const disabledClasses = "text-gray-400 cursor-not-allowed";

            return (
              <li key={it.key} className="mb-1">
                <Link
                  href={disabled ? "#" : it.href}
                  aria-disabled={disabled}
                  onClick={(e) => {
                    if (disabled) {
                      e.preventDefault();
                      toast("Tính năng đang phát triển");
                      return;
                    }
                    if (isMobile && onClose) onClose();
                  }}
                  className={[
                    baseClasses,
                    activeClasses,
                    disabled ? disabledClasses : enabledHover,
                  ].join(" ")}
                >
                  {it.icon}
                  <span className="truncate">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-4 pb-6 text-xs text-gray-400">
          <span>Member</span>
        </div>
      </nav>
    </>
  );
}
