"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { CiLogout } from "react-icons/ci";

function normalizePath(p = "") {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p || "/";
}
function isActivePath(pathname, href) {
  const p = normalizePath(pathname || "");
  const h = normalizePath(href || "");
  return p === h || p.startsWith(h + "/");
}
function playClick() {
  if (typeof window === "undefined") return;
  const audio = new Audio("/sound/sounds.wav");
  audio.play().catch(() => {});
}

export default function Sidebar({
  isMobile = false,
  open = false,
  onClose,
  navItems = [],
  logoSrc = "/images/Logo_2.png",
  logoutLabel = "Logout",
  onLogout,
  footer,
}) {
  const pathname = usePathname();
  const items = useMemo(() => navItems.filter(Boolean), [navItems]);

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed top-0 left-0 z-50 h-screen bg-white flex w-60 min-w-[200px] flex-col justify-between border-r border-[var(--color-border)] transition-transform duration-300 ${
          isMobile ? (open ? "translate-x-0" : "-translate-x-full") : ""
        }`}
        role="navigation"
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src={logoSrc}
                alt="Logo"
                width={120}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-50)]"
              aria-label="Close menu"
            >
              ×
            </button>
          )}
        </div>

        <ul className="flex-1 space-y-1 px-3 py-4">
          {items.length === 0 ? (
            <>
              <li className="h-10 rounded-lg bg-[var(--color-surface-50)] animate-pulse" />
              <li className="h-10 rounded-lg bg-[var(--color-surface-50)] animate-pulse" />
              <li className="h-10 rounded-lg bg-[var(--color-surface-50)] animate-pulse" />
            </>
          ) : (
            items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const common =
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium";
              const state = item.disabled
                ? "opacity-50 cursor-not-allowed"
                : active
                ? "bg-[var(--color-surface-50)] text-[var(--color-brand)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-50)] hover:text-[var(--color-brand)]";

              const content = (
                <>
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                  {!!item.badge && (
                    <span
                      className="ml-auto min-w-[22px] rounded-full px-2 py-0.5 text-center text-xs font-bold text-white"
                      style={{ background: "var(--color-brand)" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              );

              return (
                <li key={item.key}>
                  {item.disabled ? (
                    <div className={`${common} ${state}`} aria-disabled="true">
                      {content}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${common} ${state}`}
                      onClick={() => {
                        if (item.playSound) playClick();
                        if (isMobile && onClose) onClose();
                      }}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })
          )}
        </ul>

        <div className="px-3 pb-4 space-y-3">
          {footer}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-50)] hover:text-[var(--color-brand)] transition-colors"
            >
              <CiLogout className="text-2xl" />
              <span>{logoutLabel}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
