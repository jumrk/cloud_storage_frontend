"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LuPanelLeftClose } from "react-icons/lu";

function normalizePath(p = "") {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p || "/";
}

function isActivePath(pathname, href) {
  const p = normalizePath(pathname || "");
  const h = normalizePath(href || "");

  // Exact match - always return true
  if (p === h) return true;

  // Special handling for /file-management base route
  // Only match if pathname is exactly /file-management, not sub-routes
  if (h === "/file-management" || h.endsWith("/file-management")) {
    return p === h;
  }

  // For other routes, check if path starts with href + "/"
  // This allows child routes to match
  return p.startsWith(h + "/");
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
  collapsedLogoSrc = "/images/Logo_1.png",
  logoutLabel = "Logout",
  onLogout,
  footer,
  user = null,
  router = null,
  t = (key) => key,
  isLoadingUser = false,
  collapsed = false,
  onToggleCollapse = null,
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
        className={`fixed top-0 left-0 z-50 h-screen bg-white flex flex-col border-r border-border transition-all duration-500 ease-in-out ${
          isMobile
            ? open
              ? "translate-x-0"
              : "-translate-x-full"
            : collapsed
            ? "w-16"
            : "w-64"
        }`}
        role="navigation"
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="shrink-0">
              <Image
                src={collapsed ? collapsedLogoSrc : logoSrc}
                alt="Logo"
                width={collapsed ? 40 : 120}
                height={40}
                priority
                className="h-10 w-auto object-contain transition-opacity duration-500"
              />
            </Link>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <LuPanelLeftClose className="w-5 h-5" />
            </button>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto sidebar-scrollbar transition-[padding] duration-500 ease-in-out shadow-sm ${
            collapsed ? "px-2 py-2" : "px-3 py-2"
          }`}
        >
          {items.length === 0 ? (
            <div className="space-y-1">
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ) : (
            <nav className="space-y-1">
              {items.map((item) => {
                // If item is a section header
                if (item.isSection) {
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center transition-all duration-500 ease-in-out ${
                        collapsed
                          ? "justify-center pt-3 pb-1 first:pt-2"
                          : "pt-4 pb-2 first:pt-2"
                      }`}
                    >
                      {collapsed && (
                        // Show small icon when collapsed
                        <div className="flex items-center justify-center w-8 h-8 mx-auto">
                          {item.sectionIcon ? (
                            <div className="text-gray-400 opacity-60">
                              {item.sectionIcon}
                            </div>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          )}
                        </div>
                      )}

                      {/* Show text when expanded with delay */}
                      <h3
                        className={`px-3 text-sm font-bold text-brand-400 tracking-wider transition-opacity duration-300 ${
                          collapsed
                            ? "opacity-0 absolute pointer-events-none"
                            : "opacity-100 delay-200"
                        }`}
                      >
                        {item.label}
                      </h3>
                    </div>
                  );
                }

                // Regular item
                const activeByPath = item.href
                  ? isActivePath(pathname, item.href)
                  : false;
                const activeByKey =
                  item.activeKey !== undefined && item.activeKey === item.key;
                const active = activeByPath || activeByKey;

                const common = `flex items-center rounded-lg transition-colors duration-200 text-[15px] font-medium tracking-wide overflow-hidden ${
                  collapsed
                    ? "justify-center p-2.5 w-10 mx-auto"
                    : "gap-3 px-3 py-2"
                }`;
                const state = item.disabled
                  ? "opacity-50 cursor-not-allowed text-gray-500"
                  : active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900";

                const content = (
                  <>
                    <span className="shrink-0 text-[18px]">{item.icon}</span>
                    <span
                      className={`truncate flex-1 whitespace-nowrap transition-opacity duration-300 ${
                        collapsed
                          ? "opacity-0 w-0 overflow-hidden"
                          : "opacity-100 delay-200"
                      }`}
                    >
                      {item.label}
                    </span>
                    {!!item.badge && (
                      <span
                        className={`ml-auto px-2 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 whitespace-nowrap transition-opacity duration-300 ${
                          collapsed
                            ? "opacity-0 w-0 overflow-hidden"
                            : "opacity-100 delay-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                );

                const handleClick = (e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick(item.key, item);
                    if (isMobile && onClose) onClose();
                  } else if (item.playSound) {
                    playClick();
                  }
                  if (isMobile && onClose && !item.onClick) onClose();
                };

                return (
                  <div key={item.key}>
                    {item.disabled ? (
                      <div
                        className={`${common} ${state}`}
                        aria-disabled="true"
                      >
                        {content}
                      </div>
                    ) : item.onClick ? (
                      <button
                        className={`${common} ${state} w-full text-left`}
                        onClick={handleClick}
                      >
                        {content}
                      </button>
                    ) : (
                      <Link
                        href={item.href || "#"}
                        className={`${common} ${state}`}
                        onClick={handleClick}
                      >
                        {content}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      </nav>
    </>
  );
}
