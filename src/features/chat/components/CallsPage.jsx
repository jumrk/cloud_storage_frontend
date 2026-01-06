"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FiPhone,
  FiVideo,
  FiPhoneIncoming,
  FiPhoneOutgoing,
  FiPhoneMissed,
  FiSearch,
  FiMoreVertical,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
import Image from "next/image";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import axiosClient from "@/shared/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function formatCallTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDuration(seconds) {
  if (seconds === 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function CallsPage({ onStartCall, userMap = {} }) {
  const [calls, setCalls] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, missed, incoming, outgoing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "all") {
        params.append("filter", filter);
      }
      const res = await axiosClient.get(`/api/calls?${params.toString()}`);
      if (res.data?.success) {
        setCalls(res.data.calls || []);
      }
    } catch (err) {
      console.error("Failed to fetch calls:", err);
      setError("Không thể tải lịch sử cuộc gọi");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const filteredCalls = calls.filter((call) => {
    const matchesSearch = call.user?.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteCall = async (callId) => {
    try {
      await axiosClient.delete(`/api/calls/${callId}`);
      setCalls((prev) => prev.filter((c) => c.callId !== callId));
    } catch (err) {
      console.error("Failed to delete call:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await axiosClient.delete("/api/calls");
      setCalls([]);
    } catch (err) {
      console.error("Failed to clear calls:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-20 lg:pb-0">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Cuộc gọi</h1>
            <button
              onClick={fetchCalls}
              className="p-2 rounded-full hover:bg-[var(--color-surface-50)] text-gray-600"
              title="Làm mới"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
          {calls.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-[var(--color-danger-500)] hover:underline flex items-center gap-1"
            >
              <FiTrash2 size={14} /> Xóa tất cả
            </button>
          )}
        </div>
        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc gọi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--color-surface-50)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
          />
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "Tất cả" },
            { key: "missed", label: "Nhỡ" },
            { key: "incoming", label: "Đến" },
            { key: "outgoing", label: "Đi" },
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
      {/* Call list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton circle width={48} height={48} />
                <div className="flex-1">
                  <Skeleton width={150} height={16} />
                  <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
                </div>
                <Skeleton width={60} height={14} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <p className="text-lg font-medium text-[var(--color-danger-500)]">
              {error}
            </p>
            <button
              onClick={fetchCalls}
              className="mt-4 px-4 py-2 rounded-full bg-brand text-white hover:opacity-90"
            >
              Thử lại
            </button>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <FiPhone size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Không có cuộc gọi nào</p>
            <p className="text-sm mt-1">Lịch sử cuộc gọi sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-surface-50)] transition group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-surface-100)]">
                    <Image
                      src={getAvatarUrl(call.user.avatar)}
                      alt={call.user.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold truncate ${
                      call.missed
                        ? "text-[var(--color-danger-500)]"
                        : "text-gray-900"
                    }`}
                  >
                    {call.user.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {call.type === "incoming" ? (
                      call.missed ? (
                        <FiPhoneMissed className="text-[var(--color-danger-500)]" />
                      ) : (
                        <FiPhoneIncoming className="text-green-500" />
                      )
                    ) : (
                      <FiPhoneOutgoing className="text-brand" />
                    )}
                    <span>
                      {call.type === "incoming"
                        ? "Cuộc gọi đến"
                        : "Cuộc gọi đi"}
                      {call.duration > 0 &&
                        ` • ${formatDuration(call.duration)}`}
                    </span>
                  </div>
                </div>
                {/* Time & Actions */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {formatCallTime(new Date(call.time))}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onStartCall?.("voice", call.user?.id)}
                      className="p-2 rounded-full hover:bg-[var(--color-surface-100)] text-gray-600 hover:text-brand"
                      title="Gọi thoại"
                    >
                      <FiPhone size={18} />
                    </button>
                    <button
                      onClick={() => onStartCall?.("video", call.user?.id)}
                      className="p-2 rounded-full hover:bg-[var(--color-surface-100)] text-gray-600 hover:text-brand"
                      title="Gọi video"
                    >
                      <FiVideo size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCall(call.callId)}
                      className="p-2 rounded-full hover:bg-[var(--color-surface-100)] text-gray-600 hover:text-[var(--color-danger-500)]"
                      title="Xóa"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
