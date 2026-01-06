"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiMessageSquare,
  FiUserPlus,
  FiUsers,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiSettings,
  FiRefreshCw,
  FiPhone,
} from "react-icons/fi";
import Image from "next/image";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import axiosClient from "@/shared/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function formatNotificationTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getNotificationIcon(type, metadata) {
  switch (type) {
    case "message":
    case "chat":
      return <FiMessageSquare className="text-brand" />;
    case "group_invite":
      return <FiUserPlus className="text-green-500" />;
    case "mention":
      return <FiUsers className="text-purple-500" />;
    case "reaction":
      return <span className="text-lg">{metadata?.emoji || "❤️"}</span>;
    case "group_update":
      return <FiUsers className="text-orange-500" />;
    case "call_missed":
      return <FiPhone className="text-[var(--color-danger-500)]" />;
    case "warning":
      return <FiBell className="text-yellow-500" />;
    case "system":
    case "info":
    default:
      return <FiBell className="text-gray-600" />;
  }
}

export default function NotificationsPage({ onUpdateUnreadCount }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all, unread
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ limit: "50" });
      if (filter === "unread") {
        params.append("filter", "unread");
      }
      const res = await axiosClient.get(
        `/api/notification?${params.toString()}`
      );
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  }, [filter]);
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/notification/unread-count");
      if (res.data?.success) {
        setUnreadCount(res.data.count || 0);
        onUpdateUnreadCount?.(res.data.count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [onUpdateUnreadCount]);
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);
  const handleMarkAsRead = async (id) => {
    try {
      await axiosClient.patch(`/api/notification/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      await axiosClient.post("/api/notification/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      onUpdateUnreadCount?.(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/api/notification/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };
  const handleClearAll = async () => {
    try {
      await axiosClient.delete("/api/notification");
      setNotifications([]);
      setUnreadCount(0);
      onUpdateUnreadCount?.(0);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };
  const filteredNotifications = notifications;
  return (
    <div className="flex flex-col h-full bg-white pb-20 lg:pb-0">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
            <button
              onClick={() => {
                fetchNotifications();
                fetchUnreadCount();
              }}
              className="p-2 rounded-full hover:bg-[var(--color-surface-50)] text-gray-600"
              title="Làm mới"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-danger-500)] text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-brand hover:underline flex items-center gap-1"
              >
                <FiCheckCircle size={14} /> Đánh dấu đã đọc
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-[var(--color-danger-500)] hover:underline flex items-center gap-1 ml-3"
              >
                <FiTrash2 size={14} /> Xóa tất cả
              </button>
            )}
          </div>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "Tất cả" },
            { key: "unread", label: `Chưa đọc (${unreadCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === tab.key
                  ? "bg-brand text-white"
                  : "bg-[var(--color-surface-50)] text-gray-600 hover:bg-[var(--color-surface-100)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <div className="relative">
                  <Skeleton circle width={48} height={48} />
                  <div className="absolute -bottom-1 -right-1">
                    <Skeleton circle width={24} height={24} />
                  </div>
                </div>
                <div className="flex-1">
                  <Skeleton width="80%" height={16} />
                  <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <p className="text-lg font-medium text-[var(--color-danger-500)]">
              {error}
            </p>
            <button
              onClick={fetchNotifications}
              className="mt-4 px-4 py-2 rounded-full bg-brand text-white hover:opacity-90"
            >
              Thử lại
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <FiBell size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Không có thông báo</p>
            <p className="text-sm mt-1">Thông báo mới sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 px-6 py-4 hover:bg-[var(--color-surface-50)] transition group cursor-pointer ${
                  !notification.read ? "bg-brand/5" : ""
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-surface-100)]">
                    <Image
                      src={getAvatarUrl(notification.user?.avatar)}
                      alt={notification.user?.name || "System"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                    {getNotificationIcon(
                      notification.type,
                      notification.metadata
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {notification.user ? (
                      <>
                        <span className="font-semibold text-gray-900">
                          {notification.user.name}
                        </span>
                        {""}
                        <span className="text-gray-600">
                          {notification.content}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900">
                          {notification.title}
                        </span>
                        {notification.content && (
                          <span className="text-gray-600">
                            {""} - {notification.content}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatNotificationTime(new Date(notification.time))}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-2 rounded-full hover:bg-[var(--color-surface-100)] text-gray-600 hover:text-[var(--color-danger-500)] opacity-0 group-hover:opacity-100 transition"
                    title="Xóa"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
