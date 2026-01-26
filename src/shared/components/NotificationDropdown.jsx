"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { FiBell, FiTrash2, FiCheckCircle, FiAlertCircle, FiMessageSquare, FiInfo, FiCheck } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import useSocket from "@/shared/lib/useSocket";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import Popover from "@/shared/ui/Popover";
import { motion, AnimatePresence } from "framer-motion";

const getIcon = (type) => {
  switch(type) {
    case 'warning':
      return <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><FiAlertCircle size={20} /></div>;
    case 'system':
      return <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><FiCheckCircle size={20} /></div>;
    case 'chat':
      return <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><FiMessageSquare size={20} /></div>;
    case 'info':
    default:
      return <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><FiInfo size={20} /></div>;
  }
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
  const [expandedId, setExpandedId] = useState(null);

  // ✅ No need for token - cookie sent automatically
  const socketRef = useSocket(null);

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
      setExpandedId(null);
      fetchNotifications(1, false);
    } else {
      setExpandedId(null);
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
      setNotifications((prev) => [noti, ...prev]);

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

  const handleItemClick = async (item) => {
    const itemId = item?._id;
    if (!itemId) return;
    setExpandedId((prev) => (prev === itemId ? null : itemId));
    if (!item.isRead) {
      await markAsRead(itemId);
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
      toast.success(t("notification.marked_all_read_success") || "Đã đánh dấu tất cả là đã đọc");
    } catch {}
  };

  return (
    <>
      <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      </AnimatePresence>

      <Popover
        open={isOpen}
        className="fixed md:absolute left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 top-16 md:top-full mt-0 md:mt-2 md:right-0 origin-top md:origin-top-right w-[calc(100vw-2rem)] sm:w-96 md:w-[28rem] max-w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col p-0 z-50 drop-shadow-2xl"
      >
        <div ref={dropdownRef} className="w-full h-full flex flex-col bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden ring-1 ring-black/5">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100/50 bg-white/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2">
               <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                  <FiBell size={16} />
               </div>
               <h3 className="font-bold text-gray-900">
                  {t("header.notifications")}
               </h3>
               {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                     {unreadCount}
                  </span>
               )}
            </div>
            
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-brand hover:bg-brand/5 transition-colors"
              >
                <FiCheck size={14} />
                {t("notification.mark_all_read")}
              </button>
            )}
          </div>

          {/* List */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto max-h-[65vh] custom-scrollbar bg-gray-50/30"
          >
            {notifications.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                   <FiBell className="text-3xl opacity-20" />
                </div>
                <p className="text-sm font-medium opacity-60">{t("notification.empty")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/50">
                <AnimatePresence mode="popLayout">
                  {notifications.map((item, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                      key={item._id || item.id || index}
                      className={`group relative flex items-start gap-4 p-4 transition-all duration-200 cursor-pointer ${
                        !item.isRead ? "bg-brand/5 hover:bg-brand/10" : "hover:bg-white/80"
                      }`}
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Read Indicator Line */}
                      {!item.isRead && (
                         <div className="absolute left-0 top-4 bottom-4 w-1 bg-brand rounded-r-full shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" />
                      )}

                      {/* Icon */}
                      {getIcon(item.type)}

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start gap-2">
                           <p className={`text-sm font-semibold leading-snug ${!item.isRead ? "text-gray-900" : "text-gray-600"}`}>
                             {item.title}
                           </p>
                           <p className="text-[10px] font-medium text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })
                                : ""}
                           </p>
                        </div>
                        
                        <p className={`text-xs mt-1 leading-relaxed ${expandedId === item._id ? "" : "line-clamp-2"} ${!item.isRead ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                           {item.content}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                           <span className="text-[10px] text-gray-400">
                              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : item.time}
                           </span>
                           
                           <motion.button
                             whileHover={{ scale: 1.1, color: "#ef4444" }}
                             whileTap={{ scale: 0.9 }}
                             className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:bg-red-50 rounded-full transition-all"
                             onClick={(e) => deleteNotification(item._id, e)}
                             title={t("notification.delete_tooltip")}
                           >
                             <FiTrash2 size={14} />
                           </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <div className="p-6 text-center text-brand">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent mx-auto mb-2"></div>
                    <p className="text-xs font-semibold animate-pulse">{t("notification.loading")}</p>
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
