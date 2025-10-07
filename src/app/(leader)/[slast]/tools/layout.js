"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { decodeTokenGetUser } from "@/lib/jwt";
import {
  FiDownload,
  FiScissors,
  FiGlobe,
  FiLayers,
  FiMic,
} from "react-icons/fi";
import { MdSubtitles } from "react-icons/md";

function normalizePath(p = "") {
  if (!p) return "";
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}
function isActivePath(pathname = "", href = "") {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (!p || !h) return false;
  if (p === h) return true;
  return p.startsWith(h + "/"); // chỉ match nếu có ranh giới segment
}

function ToolItem({ href, label, Icon, active }) {
  const Comp = Icon;
  return (
    <li>
      <Link
        href={href}
        className={`group relative flex aspect-square p-2 items-center justify-center rounded-xl border transition
          ${
            active
              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
              : "text-neutral-700 border-neutral-200 bg-white hover:bg-neutral-50"
          }`}
        aria-label={label}
        title={label}
      >
        {Comp ? (
          <Comp
            size={20}
            className={active ? "" : "opacity-90 group-hover:opacity-100"}
          />
        ) : (
          <span className="inline-block h-2 w-2 rounded-full bg-current" />
        )}
      </Link>
    </li>
  );
}

export default function Layout({ children }) {
  const pathname = usePathname();
  const [slast, setSlast] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        const user = decodeTokenGetUser(token);
        setSlast(user?.slast || "");
      }
    }
  }, []);

  const base = slast ? `/${slast}/tools` : "/tools"; // tránh // khi slast rỗng lúc đầu

  const nav = useMemo(
    () => [
      { href: `${base}/download`, label: "Tải Video", icon: FiDownload },
      { href: `${base}/separate-voice`, label: "Tách Voice", icon: FiScissors },
      { href: `${base}/subtitle`, label: "Tách Subtitle", icon: MdSubtitles },
      { href: `${base}/sub`, label: "Dịch văn bản", icon: FiGlobe },
      { href: `${base}/merge`, label: "Ghép Video", icon: FiLayers },
      {
        href: `${base}/convert-text-to-voice`,
        label: "Chuyển văn bản thành giọng nói",
        icon: FiMic,
      },
    ],
    [base]
  );

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="flex h-full">
        <aside
          className="sticky top-0 h-screen shrink-0 bg-white p-2 shadow-sm"
          aria-label="Thanh công cụ"
        >
          <ul className="flex h-full flex-col mt-16 gap-5">
            {nav.map((item) => (
              <ToolItem
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </ul>
        </aside>
        <main className="container mx-auto h-full flex-1 overflow-y-auto px-2 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
