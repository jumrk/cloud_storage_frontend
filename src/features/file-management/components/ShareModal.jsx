"use client";
import React, { useState, useEffect } from "react";
import { FiCopy, FiCheck, FiX } from "react-icons/fi";
import shareService from "../services/shareService";
import toast from "react-hot-toast";

export default function ShareModal({ isOpen, onClose, item, onSuccess }) {
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setCanView(
        typeof item.canView === "boolean" ? item.canView : true
      );
      setCanDownload(
        typeof item.canDownload === "boolean" ? item.canDownload : false
      );
      setShareUrl(item.shareUrl || "");
      setCopied(false);
    }
  }, [isOpen, item]);

  const handleCreateShare = async () => {
    if (!item) return;

    setLoading(true);
    try {
      const response = await shareService.createOrUpdateShare({
        resourceId: item.id,
        resourceType: item.type,
        canView,
        canDownload,
      });

      if (response.data?.success) {
        setShareUrl(response.data.share.shareUrl);
        toast.success("Tạo link chia sẻ thành công!");
        if (typeof onSuccess === "function") {
          onSuccess(response.data.share);
        }
      } else {
        toast.error(response.data?.error || "Không thể tạo link chia sẻ");
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error || "Không thể tạo link chia sẻ";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã copy link chia sẻ!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Không thể copy link");
    }
  };

  if (!isOpen || !item) return null;

  const permissionOptions = [
    {
      id: "view-only",
      label: "Chỉ được xem",
      description: "Người dùng chỉ có thể xem nội dung, không thể tải xuống",
      canView: true,
      canDownload: false,
    },
    {
      id: "download-only",
      label: "Chỉ được tải xuống",
      description: "Người dùng chỉ có thể tải xuống, không thể xem trước",
      canView: false,
      canDownload: true,
    },
    {
      id: "both",
      label: "Xem và tải xuống",
      description: "Người dùng có thể xem và tải xuống nội dung",
      canView: true,
      canDownload: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-all"
          title="Đóng"
        >
          <FiX size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Chia sẻ {item.type === "folder" ? "thư mục" : "file"}
          </h2>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold">{item.name}</span>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Chọn quyền chia sẻ:
          </label>
          <div className="space-y-3">
            {permissionOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  canView === option.canView &&
                  canDownload === option.canDownload
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  className="mt-1 mr-3"
                  checked={
                    canView === option.canView &&
                    canDownload === option.canDownload
                  }
                  onChange={() => {
                    setCanView(option.canView);
                    setCanDownload(option.canDownload);
                  }}
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {!shareUrl ? (
          <button
            onClick={handleCreateShare}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang tạo link..." : "Tạo link chia sẻ"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Link chia sẻ:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  title="Copy link"
                >
                  {copied ? (
                    <>
                      <FiCheck size={18} />
                      <span className="text-sm">Đã copy</span>
                    </>
                  ) : (
                    <>
                      <FiCopy size={18} />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShareUrl("");
                  setCanView(true);
                  setCanDownload(false);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Tạo link mới
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

