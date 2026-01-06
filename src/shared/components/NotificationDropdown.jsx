"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { FiBell, FiTrash2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import useSocket from "@/shared/lib/useSocket";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import Popover from "@/shared/ui/Popover";

const ICON_MAP = {
  info: <FiBell className="text-primary text-lg" />,
  warning: <FiAlertCircle className="text-yellow-500 text-lg" />,
  system: <FiCheckCircle className="text-green-500 text-lg" />,
  chat: <FiBell className="text-primary text-lg" />,
};

export default function NotificationDropdown({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}) {
  const t = useTranslations();
  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useSocket(token);

  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true);
      try {
        const res = await axiosClient.get(
          `/api/notification?page=${pageNum}&limit=10`
        );
        const payload = res.data;

        if (payload?.success) {
          const newNotifications = payload.notifications || [];
          if (append) {
            setNotifications((prev) => [...prev, ...newNotifications]);
          } else {
            setNotifications(newNotifications);
          }
          setHasMore(newNotifications.length === 10);
          setPage(pageNum);
        }
      } catch (error) {
        toast.error("Lỗi khi tải thông báo");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setPage(1);
      setHasMore(true);
      fetchNotifications(1, false);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, fetchNotifications, onClose]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isOpen) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      if (
        scrollHeight - scrollTop <= clientHeight + 50 &&
        hasMore &&
        !loading
      ) {
        fetchNotifications(page + 1, true);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, hasMore, loading, page, fetchNotifications]);

  useEffect(() => {
    if (!socketRef.current || !isOpen) return;

    const handleNew = (noti) => {
      setNotifications((prev) => [
        {
          ...noti,
          icon: ICON_MAP[noti.type] || ICON_MAP.info,
        },
        ...prev,
      ]);

      if (onUnreadCountChange) {
        onUnreadCountChange((prev) => prev + 1);
      }
    };

    socketRef.current.on("notification:new", handleNew);

    return () => {
      socketRef.current.off("notification:new", handleNew);
    };
  }, [socketRef.current, isOpen, onUnreadCountChange]);

  const markAsRead = async (id) => {
    try {
      await axiosClient.patch(`/api/notification/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      if (onUnreadCountChange) {
        onUnreadCountChange((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosClient.delete(`/api/notification/${id}`);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));

      if (deleted && !deleted.isRead && onUnreadCountChange) {
        onUnreadCountChange((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("deleteNotification error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.post("/api/notification/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch {}
  };

  return (
    <>
      {/* Mobile/Tablet: Backdrop overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <Popover
        open={isOpen}
        className="fixed md:absolute left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 top-16 md:top-full mt-0 md:mt-1 md:right-0 origin-top md:origin-top-right w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] sm:max-w-80 md:max-w-96 max-h-[80vh] flex flex-col p-0 z-50"
      >
        <div ref={dropdownRef} className="w-full h-full flex flex-col">
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              {t("header.notifications")}
            </h3>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium whitespace-nowrap shrink-0"
              >
                {t("notification.mark_all_read")}
              </button>
            )}
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto max-h-[70vh] pr-1 sidebar-scrollbar"
          >
            {notifications.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-400">
                <FiBell className="text-4xl mx-auto mb-2" />
                <p className="text-sm">{t("notification.empty")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((item, index) => (
                  <div
                    key={item._id || item.id || index}
                    className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 transition ${
                      !item.isRead ? "bg-blue-50/60" : "hover:bg-gray-50"
                    }`}
                    onClick={() => !item.isRead && markAsRead(item._id)}
                    style={{
                      cursor: !item.isRead ? "pointer" : "default",
                    }}
                  >
                    <div className="mt-0.5 shrink-0">
                      {ICON_MAP[item.type] || ICON_MAP.info}
                    </div>
                    <div className="flex-1 min-w-0 overflow-auto">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 overflow-hidden pr-2">
                          <div className="flex items-start gap-2 mb-1 flex-wrap">
                            <span
                              className={`font-semibold text-sm wrap-break-word whitespace-normal ${
                                !item.isRead ? "text-primary" : "text-gray-900"
                              }`}
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                              }}
                            >
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-xs font-semibold shrink-0">
                                {t("notification.new")}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-gray-600 text-sm line-clamp-2 wrap-break-word whitespace-normal"
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            {item.content}
                          </p>
                          <p className="text-gray-400 text-xs mt-1 wrap-break-word">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString("vi-VN")
                              : item.time}
                          </p>
                        </div>
                        <button
                          className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full shrink-0 transition"
                          onClick={(e) => deleteNotification(item._id, e)}
                          title={t("notification.delete_tooltip")}
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="p-4 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-xs">{t("notification.loading")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Popover>
    </>
  );
}
