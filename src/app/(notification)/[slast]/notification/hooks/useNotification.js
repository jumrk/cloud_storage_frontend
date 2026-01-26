"use client";

import useSocket from "@/shared/lib/useSocket";
import { useTranslations } from "next-intl";
import { useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FiBell, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import notificationService from "../services/notificationService";

function useNotification() {
  const service = notificationService();

  const ICON_MAP = {
    info: <FiBell className="text-primary text-lg" />,
    warning: <FiAlertCircle className="text-yellow-500 text-lg" />,
    system: <FiCheckCircle className="text-green-500 text-lg" />,
    chat: <FiBell className="text-primary text-lg" />,
  };

  const t = useTranslations();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  // ✅ No need for token - cookie sent automatically
  const socketRef = useSocket(null);
  const loadedRef = useRef(false);

  const fetchNotifications = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await service.getNotifications(pageNum, 20);
        const payload = res.data;
        if (!payload?.success) {
          toast.error(payload.messenger || "Lỗi khi lấy thông báo");
          return;
        }
        setNotifications(payload.notifications);
        setHasMore(payload.notifications.length === 20);
        setTotalPages(payload.totalPages || 1);
        setPage(payload.page || 1);
      } catch (error) {
        const msg = error?.response?.data?.messenger || "Lỗi";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const markAsRead = useCallback(
    async (id) => {
      try {
        await service.markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      } catch {}
    },
    [service]
  );

  const deleteNotification = useCallback(
    async (id) => {
      try {
        await service.deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      } catch {}
    },
    [service]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await service.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }, [service]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchNotifications(page + 1);
    setPage((p) => p + 1);
  }, [hasMore, loading, page, fetchNotifications]);

  return {
    ICON_MAP,
    t,
    notifications,
    setNotifications,
    page,
    setPage,
    totalPages,
    hasMore,
    loading,
    socketRef,
    loadedRef,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    loadMore,
  };
}

export default useNotification;

