"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiMoreHorizontal,
} from "react-icons/fi";
import axiosClient from "@/lib/axiosClient";
import useSocket from "@/lib/useSocket";
import { useTranslations } from "next-intl";

const ICON_MAP = {
  info: <FiBell className="text-primary text-lg" />,
  warning: <FiAlertCircle className="text-yellow-500 text-lg" />,
  system: <FiCheckCircle className="text-green-500 text-lg" />,
  chat: <FiBell className="text-primary text-lg" />,
};

function Notification_Page({ onUnreadChange }) {
  const t = useTranslations();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useSocket(token);
  const loadedRef = useRef(false);

  // Lấy danh sách thông báo khi load trang & phân trang
  const fetchNotifications = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(
        `/api/notification?page=${pageNum}&limit=20`
      );
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications);
        setHasMore(res.data.notifications.length === 20);
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.page || 1);
        if (onUnreadChange) {
          const count = res.data.notifications.filter((n) => !n.isRead).length;
          onUnreadChange(count);
        }
      }
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    if (!loadedRef.current) {
      fetchNotifications(1, false);
      loadedRef.current = true;
    }
  }, []);

  // Lắng nghe notification realtime
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on("connect", () => {
      console.log("[SOCKET] Connected!", socketRef.current.id);
    });
    const handleNew = (noti) => {
      setNotifications((prev) => [
        { ...noti, icon: ICON_MAP[noti.type] || ICON_MAP.info },
        ...prev,
      ]);
      if (onUnreadChange) onUnreadChange((prev) => prev + 1);
    };
    socketRef.current.on("notification:new", handleNew);
    return () => {
      socketRef.current.off("notification:new", handleNew);
      socketRef.current.off("connect");
    };
  }, [socketRef.current]);

  // Đánh dấu đã đọc 1 notification
  const markAsRead = async (id) => {
    try {
      await axiosClient.post("/api/notification/read", { notificationId: id });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (onUnreadChange) onUnreadChange((prev) => Math.max(0, prev - 1));
    } catch {}
  };
  // Xóa 1 notification
  const deleteNotification = async (id) => {
    try {
      await axiosClient.delete("/api/notification/delete", {
        data: { notificationId: id },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };
  // Đánh dấu đã đọc tất cả
  const markAllAsRead = async () => {
    try {
      await axiosClient.post("/api/notification/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadChange) onUnreadChange(0);
    } catch {}
  };
  // Load thêm
  const loadMore = () => {
    if (!hasMore || loading) return;
    fetchNotifications(page + 1, true);
    setPage((p) => p + 1);
  };

  // Phân trang số
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3 py-1 rounded mx-1 font-semibold border ${
            i === page
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
          }`}
          onClick={() => fetchNotifications(i, false)}
          disabled={i === page}
        >
          {i}
        </button>
      );
    }
    return <div className="flex justify-center mt-4">{pages}</div>;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-8 mt-8 border border-gray-100">
      {/* Tiêu đề & mô tả + nút đánh dấu đã đọc tất cả */}
      <div className="mb-6 grid md:flex gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t("notification.title")}
          </h1>
          <p className="text-gray-500 text-sm">
            {t("notification.description")}
          </p>
        </div>
        <button
          className="px-4 py-2 rounded bg-primary text-white font-semibold text-sm shadow hover:bg-blue-700"
          onClick={markAllAsRead}
        >
          {t("notification.mark_all_read")}
        </button>
      </div>
      {/* Danh sách thông báo */}
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-gray-400">
            <FiBell className="text-4xl mb-2" />
            {t("notification.empty")}
          </div>
        ) : (
          notifications.map((item, index) => (
            <div
              key={item._id || item.id || index}
              className={`flex items-start gap-4 py-5 px-2 transition bg-white ${
                !item.isRead ? "bg-blue-50/60" : ""
              } hover:bg-blue-50/80`}
              onClick={() => !item.isRead && markAsRead(item._id)}
              style={{ cursor: !item.isRead ? "pointer" : "default" }}
            >
              <div className="mt-1">{ICON_MAP[item.type] || ICON_MAP.info}</div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-base ${
                      !item.isRead ? "text-primary" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </span>
                  {!item.isRead && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-white text-xs font-semibold">
                      {t("notification.new")}
                    </span>
                  )}
                </div>
                <div className="text-gray-600 text-sm mt-0.5">
                  {item.content}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("vi-VN")
                    : item.time}
                </div>
              </div>
              <button
                className="ml-2 text-gray-400 hover:text-red-500 p-2 rounded-full self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(item._id);
                }}
                title={t("notification.delete_tooltip")}
              >
                <FiMoreHorizontal className="text-lg" />
                <span className="sr-only">{t("notification.delete")}</span>
              </button>
            </div>
          ))
        )}
      </div>
      {/* Nút tải thêm */}
      {hasMore && !loading && false && (
        <div className="flex justify-center mt-4">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
            onClick={loadMore}
          >
            {t("notification.load_more")}
          </button>
        </div>
      )}
      {renderPagination()}
      {loading && (
        <div className="text-center text-gray-400 py-4">
          {t("notification.loading")}
        </div>
      )}
    </div>
  );
}

export default Notification_Page;
