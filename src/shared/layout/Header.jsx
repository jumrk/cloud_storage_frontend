"use client";
import Link from "next/link";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { FiBell } from "react-icons/fi";
import Image from "next/image";
import Button from "../ui/button";
import useHeader from "../hooks/useHeader";
import NotificationDropdown from "../components/NotificationDropdown";
import { useState, useRef, useEffect } from "react";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import { toast } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Header() {
  const {
    router,
    t,
    user,
    isLoading,
    menuOpen,
    menuRef,
    currentLocale,
    setMenuOpen,
    handleSwitchLocale,
    handleLogout,
    unreadNotificationCount,
    setUnreadNotificationCount,
  } = useHeader();
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const notificationRef = useRef(null);
  const mobileNotificationRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const userRole = user?.role || null;
  const isMember = userRole === "member";
  const hasPlanData = Boolean(user?.plan) || Boolean(user?.leaderPlan);

  // Video processor logic:
  // - Members: check leaderPlan (leader's plan)
  // - Leaders: check their own plan
  let videoLocked = false;
  let videoLockLabel = "";
  if (hasPlanData) {
    if (isMember) {
      const leaderPlanSlug = (user?.leaderPlan?.slug || "free").toLowerCase();
      videoLocked = !leaderPlanSlug || leaderPlanSlug === "free";
      videoLockLabel = videoLocked ? "Leader chưa nâng cấp gói" : "";
    } else {
      const ownPlanSlug = (user?.plan?.slug || "free").toLowerCase();
      videoLocked = !ownPlanSlug || ownPlanSlug === "free";
      videoLockLabel = videoLocked ? "Nâng cấp gói để sử dụng" : "";
    }
  }

  const accountLocked = isMember;
  const badgeClassName =
    "ml-2 inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning-700";
  const accountLockLabel = "Chỉ leader";

  return (
    <header className="w-full shadow-xl fixed top-0 left-0 z-50 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
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
          {/* Desktop: Language switcher */}
          <button
            onClick={handleSwitchLocale}
            className="hidden md:flex flex-col relative p-2 items-center group"
            style={{
              minWidth: 40,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            title={t("header.switch_language")}
          >
            <HiOutlineGlobeAlt className="w-7 h-7 text-brand group-hover:text-brand transition" />
            <span className="text-xs font-semibold mt-0.5 text-brand group-hover:text-brand absolute bottom-0 right-0">
              {currentLocale.toUpperCase()}
            </span>
          </button>

          {/* Desktop: Notification bell */}
          {user && (
            <div className="hidden md:block relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationDropdownOpen((v) => !v)}
                className="relative p-2 items-center group"
                style={{
                  minWidth: 40,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title={t("header.notifications")}
              >
                <FiBell className="w-7 h-7 text-brand group-hover:text-brand transition" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotificationCount > 9
                      ? "9+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>
              {/* Desktop notification dropdown */}
              <NotificationDropdown
                isOpen={notificationDropdownOpen}
                onClose={() => setNotificationDropdownOpen(false)}
                unreadCount={unreadNotificationCount}
                onUnreadCountChange={setUnreadNotificationCount}
              />
            </div>
          )}

          {/* Mobile notification dropdown - rendered outside menu */}
          {user && (
            <div className="md:hidden">
              <NotificationDropdown
                isOpen={notificationDropdownOpen}
                onClose={() => setNotificationDropdownOpen(false)}
                unreadCount={unreadNotificationCount}
                onUnreadCountChange={setUnreadNotificationCount}
              />
            </div>
          )}

          {/* Loading skeleton while checking auth */}
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 md:px-3 py-2">
              <Skeleton circle width={32} height={32} />
              <Skeleton width={80} height={16} className="hidden sm:block" />
            </div>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--color-border)] bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-lg relative">
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
                  {/* Mobile: notification badge on avatar */}
                  {unreadNotificationCount > 0 && (
                    <span className="md:hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadNotificationCount > 9
                        ? "9+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block font-medium text-gray-700 max-w-[120px] truncate">
                  {user.email}
                </span>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="hidden sm:block"
                >
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
                <div className="absolute right-0 mt-2 w-56 md:w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                  {/* Mobile only: Language and Notifications */}
                  <div className="md:hidden border-b border-gray-100">
                    <button
                      className="w-full text-left cursor-pointer px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between"
                      onClick={() => {
                        handleSwitchLocale();
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <HiOutlineGlobeAlt className="w-5 h-5 text-brand" />
                        {t("header.switch_language")}
                      </span>
                      <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">
                        {currentLocale.toUpperCase()}
                      </span>
                    </button>
                    <div className="relative" ref={mobileNotificationRef}>
                      <button
                        className="w-full text-left cursor-pointer px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          setNotificationDropdownOpen(true);
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <FiBell className="w-5 h-5 text-brand" />
                          {t("header.notifications")}
                        </span>
                        {unreadNotificationCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadNotificationCount > 9
                              ? "9+"
                              : unreadNotificationCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

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
                    className="w-full text-left cursor-pointer px-4 py-3 hover:bg-gray-50 transition"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/job-management/workspace`);
                    }}
                  >
                    {t("header.job_management")}
                  </button>
                  <button
                    disabled={videoLocked || isMobile}
                    className={`w-full text-left px-4 py-3 transition ${
                      videoLocked || isMobile
                        ? "cursor-not-allowed text-gray-400"
                        : "cursor-pointer hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      if (isMobile) {
                        toast.error(
                          "Trình xử lý video chỉ hỗ trợ trên máy tính. Vui lòng sử dụng thiết bị có màn hình lớn hơn.",
                          { duration: 4000 }
                        );
                        return;
                      }
                      if (videoLocked) return;
                      setMenuOpen(false);
                      router.push(`/video-processor`);
                    }}
                    title={
                      isMobile
                        ? "Chỉ hỗ trợ trên máy tính"
                        : videoLocked
                        ? isMember
                          ? "Leader của bạn đang dùng gói Free, không hỗ trợ Trình xử lý video"
                          : "Gói Free không hỗ trợ Trình xử lý video"
                        : undefined
                    }
                  >
                    {t("header.video_processor")}
                    {isMobile ? (
                      <span className={badgeClassName}>Chỉ trên PC</span>
                    ) : (
                      videoLocked &&
                      videoLockLabel && (
                        <span className={badgeClassName}>{videoLockLabel}</span>
                      )
                    )}
                  </button>
                  <button
                    disabled={accountLocked}
                    className={`w-full text-left px-4 py-3 transition ${
                      accountLocked
                        ? "cursor-not-allowed text-gray-400"
                        : "cursor-pointer hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      if (accountLocked) return;
                      setMenuOpen(false);
                      router.push(`/${user.slast}/infor-user`);
                    }}
                    title={
                      accountLocked
                        ? "Chỉ leader mới truy cập trang Thông tin tài khoản"
                        : undefined
                    }
                  >
                    Thông tin tài khoản
                    {accountLocked && (
                      <span className={badgeClassName}>{accountLockLabel}</span>
                    )}
                  </button>
                  <button
                    className="w-full text-left cursor-pointer px-4 py-3 hover:bg-gray-50 transition"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/${user.slast}/chat`);
                    }}
                  >
                    Chat
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
            <Button
              onClick={() => router.push("/login")}
              children={t("header.login")}
              bg="bg-primary"
            />
          )}
        </div>
      </div>
    </header>
  );
}
