"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { FiUpload, FiX, FiImage, FiLink } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";

export default function ImageUpload({
  value = "",
  onChange,
  placeholder = "Nhập URL ảnh hoặc kéo thả file vào đây",
  disabled = false,
  accept = "image/*",
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
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

        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const res = await axiosClient.post("/api/admin/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.data.success) {
          const imageUrl = res.data.data.url;
          setPreview(imageUrl);
          onChange && onChange(imageUrl);
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
    [onChange]
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

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [disabled, uploading, handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }

      // Reset input để có thể chọn lại file cùng tên
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileUpload]
  );

  const handleUrlChange = useCallback(
    (e) => {
      const url = e.target.value;
      setPreview(url);
      onChange && onChange(url);
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    setPreview("");
    onChange && onChange("");
  }, [onChange]);

  // Update preview when value changes externally
  useEffect(() => {
    if (value !== preview) {
      setPreview(value);
    }
  }, [value]);

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
    <div className="space-y-2">
      {/* Input URL */}
      <div className="relative">
        <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={preview}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          disabled={disabled || uploading}
        />
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
              Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative group">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={getImageUrl(preview)}
              alt="Preview"
              className="w-full h-48 object-contain"
              onError={(e) => {
                if (e.target && e.target.nextSibling) {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }
              }}
            />
            <div
              className="hidden w-full h-48 items-center justify-center text-gray-400"
              style={{ display: "none" }}
            >
              <div className="text-center">
                <FiImage className="text-4xl mx-auto mb-2" />
                <p className="text-sm">Không thể hiển thị ảnh</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Xóa ảnh"
          >
            <FiX className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
