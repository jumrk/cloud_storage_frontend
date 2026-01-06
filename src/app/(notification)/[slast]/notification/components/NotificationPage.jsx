"use client";
import React, { useEffect } from "react";
import { FiBell, FiMoreHorizontal } from "react-icons/fi";
import useNotification from "../hooks/useNotification";
function NotificationPage() {
  const {
    ICON_MAP,
    t,
    notifications,
    setNotifications,
    totalPages,
    page,
    hasMore,
    loading,
    socketRef,
    loadedRef,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    loadMore,
  } = useNotification();
  useEffect(() => {
    if (!loadedRef.current) {
      fetchNotifications(1);
      loadedRef.current = true;
    }
  }, []);
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
    };
    socketRef.current.on("notification:new", handleNew);
    return () => {
      socketRef.current.off("notification:new", handleNew);
      socketRef.current.off("connect");
    };
  }, [socketRef.current, setNotifications, ICON_MAP]);
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
          onClick={() => fetchNotifications(i)}
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
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-gray-400">
            <FiBell className="text-4xl mb-2" /> {t("notification.empty")}
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
export default NotificationPage;
