"use client";
import { useState, useRef, useCallback } from "react";
import { FiUpload, FiX, FiImage, FiLink } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";

export default function ImageListUpload({
  value = [],
  onChange,
  disabled = false,
  accept = "image/*",
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileUpload = useCallback(
    async (file) => {
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ cho phép upload file ảnh");
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 10MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        // ✅ Cookie sent automatically
        const res = await axiosClient.post("/api/admin/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data.success) {
          const imageUrl = res.data.data.url;
          const newImages = [...value, imageUrl];
          onChange && onChange(newImages);
          toast.success("Upload ảnh thành công!");
        } else {
          toast.error(res.data.error || "Upload ảnh thất bại");
        }
      } catch (error) {
        const errorMsg =
          error?.response?.data?.error ||
          error?.message ||
          "Lỗi khi upload ảnh";
        toast.error(errorMsg);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          handleFileUpload(file);
        }
      });
    },
    [disabled, uploading, handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        handleFileUpload(file);
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileUpload]
  );

  const handleAddUrl = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;

    if (value.includes(url)) {
      toast.error("Ảnh này đã được thêm");
      return;
    }

    const newImages = [...value, url];
    onChange && onChange(newImages);
    setUrlInput("");
  }, [urlInput, value, onChange]);

  const handleRemoveImage = useCallback(
    (index) => {
      const newImages = value.filter((_, i) => i !== index);
      onChange && onChange(newImages);
    },
    [value, onChange]
  );

  const getImageUrl = (url) => {
    if (!url) return "";

    // Nếu đã là full URL thì trả về luôn
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // Nếu là relative path, giữ nguyên (browser sẽ tự resolve)
    if (url.startsWith("/")) {
      return url;
    }

    return url;
  };

  return (
    <div className="space-y-3">
      {/* Input URL */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="/images/projects/project1/image1.jpg"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={disabled || uploading}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={disabled || uploading || !urlInput.trim()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Thêm URL
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        } ${
          disabled || uploading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        onClick={() => {
          if (!disabled && !uploading) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600">Đang upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FiUpload className="text-3xl text-gray-400" />
            <p className="text-sm text-gray-600">
              Kéo thả ảnh vào đây hoặc click để chọn file
            </p>
            <p className="text-xs text-gray-500">
              Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 10MB mỗi file)
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {value.map((img, idx) => (
            <div key={idx} className="relative group">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-video">
                <img
                  src={getImageUrl(img)}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.target && e.target.nextSibling) {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }
                  }}
                />
                <div
                  className="hidden w-full h-full items-center justify-center text-gray-400"
                  style={{ display: "none" }}
                >
                  <div className="text-center">
                    <FiImage className="text-2xl mx-auto mb-1" />
                    <p className="text-xs">Lỗi</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                disabled={disabled || uploading}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Xóa ảnh"
              >
                <FiX className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
