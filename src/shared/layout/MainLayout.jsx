"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  FiHome,
  FiFolder,
  FiClock,
  FiVideo,
  FiMessageSquare,
  FiShare2,
  FiTrash2,
  FiGrid,
  FiUser,
  FiCheckSquare,
  FiFilm,
  FiMic,
  FiBell,
  FiChevronDown,
  FiSettings,
  FiLogOut,
  FiGlobe,
  FiChevronRight,
} from "react-icons/fi";
import { LuPanelLeftClose, LuPanelRightClose } from "react-icons/lu";
import Sidebar from "./Sidebar";
import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import NotificationDropdown from "@/shared/components/NotificationDropdown";
import Image from "next/image";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useUserRole } from "@/shared/hooks/useUserRole";
import {
  hasVideoToolsAccess,
  getVideoToolsAccessMessage,
} from "@/shared/utils/videoToolsAccess";

function getBasePath(pathname) {
  if (!pathname) return "";
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg ? `/${seg}` : "";
}

export default function MainLayout({
  children,
  user: userProp = null,
  extraContent = null,
  customNavSections = null,
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(userProp);
  const [isLoadingUser, setIsLoadingUser] = useState(!userProp);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageSubmenuOpen, setLanguageSubmenuOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState("vi");
  const notificationRef = useRef(null);
  const menuRef = useRef(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get current locale from cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      setCurrentLocale(match ? match[1] : "vi");
    }
  }, []);

  // Function to fetch user data
  const fetchUserData = useCallback(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      axiosClient
        .get("/api/user")
        .then((res) => {
          if (res?.data) {
            setUser((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch(() => {
          /* ignore */
        });
    }
  }, []);

  // Fetch user data if not provided
  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      setIsLoadingUser(false);
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      const info = decodeTokenGetUser(token);
      setUser(info);
      // Fetch full user data from API
      fetchUserData();
      setIsLoadingUser(false);
    } else {
      setIsLoadingUser(false);
    }
  }, [userProp, fetchUserData]);

  // Listen for refresh user data events (from video tools)
  useEffect(() => {
    const handleRefreshUserData = () => {
      fetchUserData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("refreshUserData", handleRefreshUserData);
      return () => {
        window.removeEventListener("refreshUserData", handleRefreshUserData);
      };
    }
  }, [fetchUserData]);

  // Handle language switch
  const handleSwitchLocale = (locale) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; SameSite=Lax`;
    window.location.reload();
  };

  // Fetch unread notification count
  useEffect(() => {
    if (user) {
      axiosClient
        .get("/api/notification/unread-count")
        .then((res) => {
          const count = res?.data?.count ?? 0;
          setUnreadNotificationCount(count);
        })
        .catch(() => {
          /* ignore */
        });
    }
  }, [user]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (notificationDropdownOpen || menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationDropdownOpen, menuOpen]);

  const basePath = useMemo(() => getBasePath(pathname), [pathname]);

  // Get slast from params first (from URL), fallback to user.slast
  const slast = params?.slast || user?.slast;

  // Get user role
  const { isLeader: isLeaderUser, isMember: isMemberUser } = useUserRole(user);

  // Build navigation sections - flat structure with section headers
  // Filter based on user role: Member cannot see Dashboard/Home
  const defaultNavSections = useMemo(() => {
    const items = [];

    // === Dashboard section ===
    // Only show Dashboard section for Leader
    if (isLeaderUser) {
      items.push({
        key: "section-dashboard",
        label: t("sidebar.dashboard") || "Dashboard",
        isSection: true,
        sectionIcon: <FiHome className="text-[10px]" />,
      });

      // Home (main page) - Only for Leader
      items.push({
        key: "home",
        label: t("sidebar.home") || "Trang chủ",
        icon: <FiHome />,
        href: slast ? `/${slast}/home` : "/",
      });
    }

    // === Quản lý file section ===
    items.push({
      key: "section-file-management",
      label: t("sidebar.file_management") || "Quản lý tệp",
      isSection: true,
      sectionIcon: <FiFolder className="text-[10px]" />,
    });
    items.push({
      key: "file-management-home",
      label: t("sidebar.my_files") || "Tệp của tôi",
      icon: <FiFolder />,
      href: slast ? `/${slast}/file-management` : "/file-management",
    });
    items.push({
      key: "file-management-shared",
      label: t("sidebar.shared") || "Tệp đã chia sẻ",
      icon: <FiShare2 />,
      href: slast
        ? `/${slast}/file-management/shared`
        : "/file-management/shared",
    });
    items.push({
      key: "file-management-trash",
      label: t("sidebar.trash") || "Tệp đã xóa",
      icon: <FiTrash2 />,
      href: slast
        ? `/${slast}/file-management/trash`
        : "/file-management/trash",
    });

    // === Quản lý công việc section ===
    items.push({
      key: "section-job-management",
      label: t("job_management.nav.title") || "Quản lý công việc",
      isSection: true,
      sectionIcon: <FiCheckSquare className="text-[10px]" />,
    });
    items.push({
      key: "job-workspace",
      label: t("job_management.nav.workspace") || "Không gian làm việc",
      icon: <FiGrid />,
      href: slast
        ? `/${slast}/job-management/workspace`
        : "/job-management/workspace",
    });
    items.push({
      key: "job-assigned",
      label: t("job_management.nav.assigned") || "Được giao cho tôi",
      icon: <FiUser />,
      href: slast
        ? `/${slast}/job-management/assigned`
        : "/job-management/assigned",
    });
    items.push({
      key: "job-recent",
      label: t("job_management.nav.recent") || "Gần đây",
      icon: <FiClock />,
      href: slast
        ? `/${slast}/job-management/recent`
        : "/job-management/recent",
    });
    items.push({
      key: "job-pinned",
      label: t("job_management.nav.pinned") || "Board đã ghim",
      icon: <FiCheckSquare />,
      href: slast
        ? `/${slast}/job-management/pinned`
        : "/job-management/pinned",
    });

    // === Công cụ video section ===
    const hasVideoAccess = hasVideoToolsAccess(user);
    const videoToolsMessage = getVideoToolsAccessMessage();

    items.push({
      key: "section-video-tools",
      label: t("video_tools.nav.title") || "Công cụ video",
      isSection: true,
      sectionIcon: <FiVideo className="text-[10px]" />,
    });
    items.push({
      key: "video-extract-subtitle",
      label: hasVideoAccess
        ? t("video_tools.nav.extract_subtitle") || "Trích xuất phụ đề"
        : videoToolsMessage,
      icon: <FiFilm />,
      href: hasVideoAccess
        ? slast
          ? `/${slast}/video-tools/extract-subtitle`
          : "/video-tools/extract-subtitle"
        : null,
      disabled: !hasVideoAccess,
      tooltip: !hasVideoAccess ? videoToolsMessage : undefined,
    });
    items.push({
      key: "video-hardsub",
      label: hasVideoAccess
        ? t("video_tools.nav.hardsub") || "Hard sub"
        : videoToolsMessage,
      icon: <FiVideo />,
      href: hasVideoAccess
        ? slast
          ? `/${slast}/video-tools/hardsub`
          : "/video-tools/hardsub"
        : null,
      disabled: !hasVideoAccess,
      tooltip: !hasVideoAccess ? videoToolsMessage : undefined,
    });
    items.push({
      key: "video-voiceover",
      label: hasVideoAccess
        ? t("video_tools.nav.voiceover") || "Lồng tiếng"
        : videoToolsMessage,
      icon: <FiMic />,
      href: hasVideoAccess
        ? slast
          ? `/${slast}/video-tools/voiceover`
          : "/video-tools/voiceover"
        : null,
      disabled: !hasVideoAccess,
      tooltip: !hasVideoAccess ? videoToolsMessage : undefined,
    });

    // Chat (direct link)
    items.push({
      key: "chat",
      label: t("sidebar.chat") || "Trò chuyện",
      icon: <FiMessageSquare />,
      href: "/chat",
    });

    return items;
  }, [t, slast, isLeaderUser, user]);

  const navSections = customNavSections || defaultNavSections;

  // Get current page label from pathname
  const currentPageLabel = useMemo(() => {
    if (!pathname) return "";

    // Helper function to normalize path
    const normalizePath = (p = "") => {
      if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
      return p || "/";
    };

    // Helper function to check if path matches
    const isActivePath = (pathname, href) => {
      const p = normalizePath(pathname || "");
      const h = normalizePath(href || "");
      if (p === h) return true;
      if (h === "/file-management" || h.endsWith("/file-management")) {
        return p === h;
      }
      return p.startsWith(h + "/");
    };

    // Find active item in navSections
    for (const item of navSections) {
      if (item.isSection) continue;
      if (item.href && isActivePath(pathname, item.href)) {
        return item.label;
      }
    }

    // Fallback: extract from pathname
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return lastSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return "Trang chủ";
  }, [pathname, navSections]);

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="flex h-screen">
      <div
        className={`hidden md:block h-full bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <Sidebar
          navItems={navSections}
          onLogout={handleLogout}
          logoutLabel={t("sidebar.logout") || "Đăng xuất"}
          logoSrc="/images/Logo_2.png"
          collapsedLogoSrc="/images/Logo_1.png"
          user={user}
          router={router}
          t={t}
          isLoadingUser={isLoadingUser}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <Sidebar
        isMobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navSections}
        onLogout={handleLogout}
        logoutLabel={t("sidebar.logout") || "Đăng xuất"}
        logoSrc="/images/Logo_2.png"
        user={user}
        router={router}
        t={t}
        isLoadingUser={isLoadingUser}
      />

      <main
        className={`flex-1 overflow-auto bg-white flex flex-col transition-all duration-300`}
      >
        {/* Top Header Bar - matches sidebar header */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-40 h-[57px] min-w-0">
          <div className="flex items-center gap-3">
            {/* Toggle sidebar button */}
            <button
              onClick={() => {
                if (isMobile) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="flex p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {isMobile ? (
                // Mobile: show close icon when open, show open icon when closed
                sidebarOpen ? (
                  <LuPanelLeftClose className="w-5 h-5 text-gray-600" />
                ) : (
                  <LuPanelRightClose className="w-5 h-5 text-gray-600" />
                )
              ) : // Desktop: show close icon when expanded, show open icon when collapsed
              sidebarCollapsed ? (
                <LuPanelRightClose className="w-5 h-5 text-gray-600" />
              ) : (
                <LuPanelLeftClose className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Current page title */}
            <span className="text-sm font-medium text-gray-700">
              {currentPageLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 h-full shrink-0">
            {/* Notification bell */}
            {user && (
              <div
                className="relative h-full flex items-center"
                ref={notificationRef}
              >
                <button
                  onClick={() => setNotificationDropdownOpen((v) => !v)}
                  className="relative flex items-center justify-center h-full aspect-square"
                  style={{
                    minWidth: 40,
                    background: "none",
                    cursor: "pointer",
                  }}
                  title={t("header.notifications") || "Thông báo"}
                >
                  <FiBell className="w-5 h-5 text-brand-500 transition" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {unreadNotificationCount > 9
                        ? "9+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                <NotificationDropdown
                  isOpen={notificationDropdownOpen}
                  onClose={() => setNotificationDropdownOpen(false)}
                  unreadCount={unreadNotificationCount}
                  onUnreadCountChange={setUnreadNotificationCount}
                />
              </div>
            )}

            {/* User profile button */}
            {isLoadingUser ? (
              <div className="flex items-center gap-2 h-full">
                <Skeleton width={80} height={16} className="hidden sm:block" />
              </div>
            ) : user ? (
              <div className="relative h-full flex items-center" ref={menuRef}>
                <button
                  className="flex items-center gap-2 px-2 md:px-3 h-full rounded-lg hover:bg-gray-100 transition"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-lg relative">
                    {user.avatar ? (
                      <Image
                        src={getAvatarUrl(user.avatar)}
                        alt="avatar"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {user.email ? user.email[0].toUpperCase() : "U"}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block font-medium text-gray-700 max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <FiChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* User menu dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 md:w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                    {/* Credits Section */}
                    <div className="px-3.5 sm:px-4 md:px-4 py-2.5 sm:py-3 md:py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm md:text-sm text-gray-500">
                          {t("user_menu.total") || "Total"}
                        </span>
                        <span className="text-xs sm:text-sm md:text-sm font-semibold text-gray-900">
                          {(user.credis || 0).toLocaleString()}{" "}
                          {t("user_menu.credits") || "credits"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm md:text-sm text-gray-500">
                          {t("user_menu.remaining") || "Remaining"}
                        </span>
                        <span className="text-xs sm:text-sm md:text-sm font-semibold text-gray-900">
                          {(user.credis || 0).toLocaleString()}
                        </span>
                      </div>
                      <button
                        className="w-full mt-2 px-3 py-1.5 text-xs sm:text-sm md:text-sm bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed opacity-60"
                        disabled
                        title="Tính năng đang phát triển"
                      >
                        Mua credits (Đang phát triển)
                      </button>
                    </div>

                    {/* Workspace Section */}
                    <div className="px-3.5 sm:px-4 md:px-4 py-2.5 sm:py-3 md:py-3 border-b border-gray-200">
                      <div className="text-xs sm:text-sm md:text-sm text-gray-500 mb-1">
                        {t("user_menu.workspace") || "Workspace"}
                      </div>
                      <div className="text-xs sm:text-sm md:text-sm font-semibold text-gray-900 truncate">
                        {user.fullName ||
                          user.email?.split("@")[0] ||
                          t("user_menu.my_workspace") ||
                          "My Workspace"}
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="border-b border-gray-200">
                      <button
                        className="w-full text-left px-3.5 sm:px-4 md:px-4 py-2 sm:py-2.5 md:py-2.5 hover:bg-gray-50 transition flex items-center gap-2 text-xs sm:text-sm md:text-sm text-gray-900"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(`/${user.slast}/account`);
                        }}
                      >
                        <FiUser className="w-3.5 sm:w-4 md:w-4 h-3.5 sm:h-4 md:h-4" />
                        <span>
                          {t("header.account_info") ||
                            t("user_menu.account_info") ||
                            "Thông tin tài khoản"}
                        </span>
                      </button>
                    </div>

                    {/* Settings Section */}
                    <div className="py-1.5 sm:py-2 md:py-2">
                      <div className="px-3.5 sm:px-4 md:px-4 py-1.5 sm:py-2 md:py-2 text-[10px] sm:text-xs md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("user_menu.settings") || "Settings"}
                      </div>

                      {/* Subscription */}
                      <button
                        className="w-full text-left px-3.5 sm:px-4 md:px-4 py-2 sm:py-2.5 md:py-2.5 hover:bg-gray-50 transition flex items-center justify-between group"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(`/${user.slast}/subscription`);
                        }}
                      >
                        <span className="text-xs sm:text-sm md:text-sm text-gray-900">
                          {t("user_menu.subscription") || "Subscription"}
                        </span>
                        <span className="text-[10px] sm:text-xs md:text-xs text-gray-600 px-1.5 sm:px-2 md:px-2 py-0.5 rounded bg-gray-100">
                          {user.plan?.name || t("user_menu.free") || "Free"}
                        </span>
                      </button>

                      {/* Language */}
                      <div
                        className="relative"
                        onMouseEnter={() => {
                          setLanguageSubmenuOpen(true);
                        }}
                        onMouseLeave={() => setLanguageSubmenuOpen(false)}
                      >
                        <button className="w-full text-left px-3.5 sm:px-4 md:px-4 py-2 sm:py-2.5 md:py-2.5 hover:bg-gray-50 transition flex items-center justify-between group">
                          <span className="text-xs sm:text-sm md:text-sm text-gray-900">
                            {t("user_menu.language") || "Language"}
                          </span>
                          <FiChevronRight
                            className={`w-3.5 sm:w-4 md:w-4 h-3.5 sm:h-4 md:h-4 text-gray-400 transition-transform duration-200 ${
                              languageSubmenuOpen ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            languageSubmenuOpen
                              ? "max-h-32 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="pl-3.5 sm:pl-4 md:pl-4 pr-3.5 sm:pr-4 md:pr-4">
                            <button
                              className="w-full text-left px-3.5 sm:px-4 md:px-4 py-1.5 sm:py-2 md:py-2 hover:bg-gray-50 transition text-xs sm:text-sm md:text-sm text-gray-900 flex items-center gap-2 rounded"
                              onClick={() => {
                                setLanguageSubmenuOpen(false);
                                handleSwitchLocale("vi");
                              }}
                            >
                              <FiGlobe className="w-3.5 sm:w-4 md:w-4 h-3.5 sm:h-4 md:h-4" />
                              <span>
                                {t("user_menu.vietnamese") || "Tiếng Việt"}
                              </span>
                            </button>
                            <button
                              className="w-full text-left px-3.5 sm:px-4 md:px-4 py-1.5 sm:py-2 md:py-2 hover:bg-gray-50 transition text-xs sm:text-sm md:text-sm text-gray-900 flex items-center gap-2 rounded"
                              onClick={() => {
                                setLanguageSubmenuOpen(false);
                                handleSwitchLocale("en");
                              }}
                            >
                              <FiGlobe className="w-3.5 sm:w-4 md:w-4 h-3.5 sm:h-4 md:h-4" />
                              <span>{t("user_menu.english") || "English"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-200">
                      <button
                        className="w-full text-left px-3.5 sm:px-4 md:px-4 py-2 sm:py-2.5 md:py-2.5 hover:bg-gray-50 transition flex items-center gap-2 text-xs sm:text-sm md:text-sm text-gray-900"
                        onClick={() => {
                          setMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        <FiLogOut className="w-3.5 sm:w-4 md:w-4 h-3.5 sm:h-4 md:h-4" />
                        <span>
                          {t("sidebar.logout") ||
                            t("header.logout") ||
                            "Đăng xuất"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {children}
          {extraContent}
        </div>
      </main>
    </div>
  );
}
