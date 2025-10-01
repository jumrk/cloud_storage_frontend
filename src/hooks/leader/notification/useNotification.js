import axiosClient from "@/lib/axiosClient";
import useSocket from "@/lib/useSocket";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiBell, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
function useNotification() {
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
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useSocket(token);
  const loadedRef = useRef(false);

  const fetchNotifications = async (pageNum = 1, onUnreadChange) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(
        `/api/notification?page=${pageNum}&limit=20`
      );
      const payload = res.data;
      if (!payload?.success) {
        toast.error(payload.messenger || "Lỗi khi lấy thông báo");
        return;
      }
      setNotifications(payload.notifications);
      setHasMore(payload.notifications.length === 20);
      setTotalPages(payload.totalPages || 1);
      setPage(payload.page || 1);
      if (onUnreadChange) {
        const count = payload.notifications.filter((n) => !n.isRead).length;
        onUnreadChange(count);
      }
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    ICON_MAP,
    t,
    notifications,
    setNotifications,
    page,
    setPage,
    totalPages,
    hasMore,
    setHasMore,
    loading,
    setLoading,
    token,
    socketRef,
    loadedRef,
    fetchNotifications,
  };
}

export default useNotification;
