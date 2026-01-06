"use client";
import React, { useState, useEffect } from "react";
import {
  FiX,
  FiImage,
  FiFile,
  FiMusic,
  FiVideo,
  FiDownload,
  FiGrid,
  FiList,
} from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import { formatBytes } from "@/features/chat/utils/messageUtils";
const TABS = [
  { key: "all", label: "Tất cả", icon: FiGrid },
  { key: "image", label: "Ảnh", icon: FiImage },
  { key: "video", label: "Video", icon: FiVideo },
  { key: "audio", label: "Âm thanh", icon: FiMusic },
  { key: "file", label: "Tệp", icon: FiFile },
];
export default function MediaGalleryModal({
  open,
  onClose,
  chatId,
  chatType = "direct",
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [previewItem, setPreviewItem] = useState(null);
  useEffect(() => {
    if (!open || !chatId) {
      setMedia([]);
      return;
    }
    async function fetchMedia() {
      setLoading(true);
      try {
        const endpoint =
          chatType === "group"
            ? `/api/message/group/${chatId}/media`
            : `/api/message/media/${chatId}`;
        const params = activeTab !== "all" ? `?type=${activeTab}` : "";
        const res = await axiosClient.get(`${endpoint}${params}`);
        setMedia(res.data.media || []);
      } catch {
        setMedia([]);
      }
      setLoading(false);
    }
    fetchMedia();
  }, [open, chatId, chatType, activeTab]);
  const base64ToBlob = (base64, mimeType = "application/octet-stream") => {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i += 1) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };
  const handleDownload = (item) => {
    if (!item?.data) return;
    const blob = base64ToBlob(item.data, item.mime);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.name || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const getFileIcon = (mime) => {
    if (mime?.startsWith("image/")) return FiImage;
    if (mime?.startsWith("video/")) return FiVideo;
    if (mime?.startsWith("audio/")) return FiMusic;
    return FiFile;
  };
  const renderGridItem = (item) => {
    const isImage = item.mime?.startsWith("image/");
    const isVideo = item.mime?.startsWith("video/");
    const isAudio = item.mime?.startsWith("audio/");
    const hasData = Boolean(item.data);
    const isExpired = item.expired || !hasData;
    if (isExpired) {
      return (
        <div className="aspect-square rounded-xl bg-[var(--color-surface-100)] flex flex-col items-center justify-center text-gray-600 p-2">
          <FiFile size={24} />
          <p className="text-xs mt-1 text-center line-clamp-2">{item.name}</p>
          <p className="text-[10px] text-[var(--color-danger-500)]">
            Đã hết hạn
          </p>
        </div>
      );
    }
    if (isImage) {
      const src = `data:${item.mime};base64,${item.data}`;
      return (
        <button
          type="button"
          className="aspect-square rounded-xl overflow-hidden bg-[var(--color-surface-100)] hover:opacity-90 transition"
          onClick={() => setPreviewItem(item)}
        >
          <img
            src={src}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </button>
      );
    }
    if (isVideo) {
      const src = `data:${item.mime};base64,${item.data}`;
      return (
        <button
          type="button"
          className="aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center relative hover:opacity-90 transition"
          onClick={() => setPreviewItem(item)}
        >
          <video src={src} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <FiVideo size={32} className="text-white" />
          </div>
        </button>
      );
    }
    if (isAudio) {
      return (
        <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center text-white p-2">
          <FiMusic size={32} />
          <p className="text-xs mt-2 text-center line-clamp-2">{item.name}</p>
          <button
            type="button"
            className="mt-2 p-1.5 rounded-full bg-white hover:bg-white transition"
            onClick={() => handleDownload(item)}
          >
            <FiDownload size={14} />
          </button>
        </div>
      );
    }
    const FileIcon = getFileIcon(item.mime);
    return (
      <div className="aspect-square rounded-xl bg-[var(--color-surface-100)] flex flex-col items-center justify-center text-gray-600 p-2">
        <FileIcon size={32} />
        <p className="text-xs mt-2 text-center line-clamp-2">{item.name}</p>
        <p className="text-[10px]">{formatBytes(item.size)}</p>
        <button
          type="button"
          className="mt-2 p-1.5 rounded-full bg-brand/10 text-brand hover:bg-brand/20 transition"
          onClick={() => handleDownload(item)}
        >
          <FiDownload size={14} />
        </button>
      </div>
    );
  };
  const renderListItem = (item) => {
    const FileIcon = getFileIcon(item.mime);
    const isExpired = item.expired || !item.data;
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-50)] hover:bg-[var(--color-surface-100)] transition">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            item.mime?.startsWith("image/")
              ? "bg-blue-100 text-blue-600"
              : item.mime?.startsWith("video/")
              ? "bg-purple-100 text-purple-600"
              : item.mime?.startsWith("audio/")
              ? "bg-pink-100 text-pink-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <FileIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-600">
            {formatBytes(item.size)} •{""}
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
          {isExpired && (
            <p className="text-xs text-[var(--color-danger-500)]">Đã hết hạn</p>
          )}
        </div>
        {!isExpired && (
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-white text-gray-600 hover:text-gray-900 transition"
            onClick={() => handleDownload(item)}
          >
            <FiDownload size={18} />
          </button>
        )}
      </div>
    );
  };
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-gray-900">
            Thư viện phương tiện
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`p-2 rounded-xl transition ${
                viewMode === "grid"
                  ? "bg-brand/10 text-brand"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid size={18} />
            </button>
            <button
              type="button"
              className={`p-2 rounded-xl transition ${
                viewMode === "list"
                  ? "bg-brand/10 text-brand"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewMode("list")}
            >
              <FiList size={18} />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-[var(--color-surface-50)] transition"
              onClick={onClose}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 px-5 py-3 border-b border-[var(--color-border)] overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? "bg-brand text-white"
                    : "bg-[var(--color-surface-50)] text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <FiFile size={48} className="mb-3 opacity-50" />
              <p>Không có phương tiện nào</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {media.map((item) => (
                <div key={item._id}>{renderGridItem(item)}</div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {media.map((item) => (
                <div key={item._id}>{renderListItem(item)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Preview Modal */}
      {previewItem && (
        <>
          <div
            className="fixed inset-0 bg-black/90 z-[60]"
            onClick={() => setPreviewItem(null)}
          />
          <div className="fixed inset-4 z-[60] flex items-center justify-center">
            <button
              type="button"
              className="absolute top-4 right-4 p-3 rounded-full bg-white text-white hover:bg-white transition"
              onClick={() => setPreviewItem(null)}
            >
              <FiX size={24} />
            </button>
            <button
              type="button"
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-white hover:bg-white transition"
              onClick={() => handleDownload(previewItem)}
            >
              <FiDownload size={18} /> Tải xuống
            </button>
            {previewItem.mime?.startsWith("image/") && (
              <img
                src={`data:${previewItem.mime};base64,${previewItem.data}`}
                alt={previewItem.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
            {previewItem.mime?.startsWith("video/") && (
              <video
                src={`data:${previewItem.mime};base64,${previewItem.data}`}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg"
              />
            )}
          </div>
        </>
      )}
    </>
  );
}
