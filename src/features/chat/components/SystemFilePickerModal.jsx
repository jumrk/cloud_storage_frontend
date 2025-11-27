"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FiX,
  FiFolder,
  FiFile,
  FiChevronLeft,
  FiCheck,
  FiSearch,
  FiLoader,
} from "react-icons/fi";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
} from "react-icons/fa";
import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";

// Get file icon based on mimeType
function getFileIcon(mimeType) {
  if (!mimeType) return <FaFileAlt className="text-gray-500" />;
  if (mimeType.includes("pdf"))
    return <FaFilePdf className="text-red-500" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FaFileWord className="text-blue-600" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return <FaFileExcel className="text-green-600" />;
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return <FaFilePowerpoint className="text-orange-500" />;
  if (mimeType.startsWith("image/"))
    return <FaFileImage className="text-purple-500" />;
  if (mimeType.startsWith("video/"))
    return <FaFileVideo className="text-pink-500" />;
  if (mimeType.startsWith("audio/"))
    return <FaFileAudio className="text-indigo-500" />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive"))
    return <FaFileArchive className="text-yellow-600" />;
  if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("html") || mimeType.includes("css"))
    return <FaFileCode className="text-cyan-500" />;
  return <FaFileAlt className="text-gray-500" />;
}

// Format file size
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function SystemFilePickerModal({
  isOpen,
  onClose,
  onSelectFiles,
  maxFiles = 10,
}) {
  const t = useTranslations();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Fetch folders and files
  const fetchData = useCallback(async (folderId = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = folderId ? { folderId } : {};
      const response = await axiosClient.get("/api/files/browse", { params });
      
      if (response.data?.success) {
        setFolders(response.data.folders || []);
        setFiles(response.data.files || []);
      } else {
        setError(response.data?.error || "Không thể tải danh sách file");
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(err?.response?.data?.error || "Không thể tải danh sách file");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setCurrentFolder(null);
      setFolderPath([]);
      setSearchQuery("");
      fetchData(null);
    }
  }, [isOpen, fetchData]);

  // Navigate to folder
  const navigateToFolder = (folder) => {
    setCurrentFolder(folder._id);
    setFolderPath((prev) => [...prev, { id: folder._id, name: folder.name }]);
    fetchData(folder._id);
  };

  // Navigate back
  const navigateBack = () => {
    if (folderPath.length === 0) return;
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    const parentId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setCurrentFolder(parentId);
    fetchData(parentId);
  };

  // Toggle file selection
  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.some((f) => f._id === file._id);
      if (isSelected) {
        return prev.filter((f) => f._id !== file._id);
      } else {
        if (prev.length >= maxFiles) {
          setError(`Chỉ có thể chọn tối đa ${maxFiles} file`);
          return prev;
        }
        setError(null);
        return [...prev, file];
      }
    });
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedFiles.length === 0) return;
    onSelectFiles(selectedFiles);
    onClose();
  };

  // Filter files by search
  const filteredFiles = searchQuery
    ? files.filter((f) =>
        f.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const filteredFolders = searchQuery
    ? folders.filter((f) =>
        f.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : folders;

  // Calculate total selected size
  const totalSelectedSize = selectedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text-strong">
              Chọn file từ hệ thống
            </h2>
            {selectedFiles.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
                {selectedFiles.length} file đã chọn
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-100 transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-3 bg-surface-50 border-b border-border">
          <button
            onClick={() => {
              setCurrentFolder(null);
              setFolderPath([]);
              fetchData(null);
            }}
            className="text-sm text-brand hover:underline"
          >
            Thư mục gốc
          </button>
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span className="text-text-muted">/</span>
              <button
                onClick={() => {
                  const newPath = folderPath.slice(0, index + 1);
                  setFolderPath(newPath);
                  setCurrentFolder(folder.id);
                  fetchData(folder.id);
                }}
                className="text-sm text-brand hover:underline"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              {searchQuery ? "Không tìm thấy kết quả" : "Thư mục trống"}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Back button */}
              {folderPath.length > 0 && !searchQuery && (
                <button
                  onClick={navigateBack}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-50 transition text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center">
                    <FiChevronLeft size={20} className="text-text-muted" />
                  </div>
                  <span className="text-sm text-text-muted">Quay lại</span>
                </button>
              )}

              {/* Folders */}
              {filteredFolders.map((folder) => (
                <button
                  key={folder._id}
                  onClick={() => navigateToFolder(folder)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-50 transition text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FiFolder size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-strong truncate">
                      {folder.name}
                    </p>
                  </div>
                </button>
              ))}

              {/* Files */}
              {filteredFiles.map((file) => {
                const isSelected = selectedFiles.some((f) => f._id === file._id);
                return (
                  <button
                    key={file._id}
                    onClick={() => toggleFileSelection(file)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition text-left ${
                      isSelected
                        ? "bg-brand-50 border-2 border-brand"
                        : "hover:bg-surface-50 border-2 border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-xl">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-strong truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected
                          ? "bg-brand border-brand text-white"
                          : "border-border"
                      }`}
                    >
                      {isSelected && <FiCheck size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-50">
          <div className="text-sm text-text-muted">
            {selectedFiles.length > 0 && (
              <>
                Đã chọn: {selectedFiles.length} file ({formatBytes(totalSelectedSize)})
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-strong transition"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition ${
                selectedFiles.length > 0
                  ? "bg-brand text-white hover:bg-brand-600"
                  : "bg-surface-200 text-text-muted cursor-not-allowed"
              }`}
            >
              Gửi {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

