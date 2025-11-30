"use client";
import React, { useEffect } from "react";
import {
  FiCopy,
  FiFolder,
  FiFile,
  FiChevronRight,
  FiDownload,
  FiChevronDown,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import DownloadStatus from "./DownloadStatus";
import useSharePage from "../hooks/useSharePage";

export default function SharePage() {
  const {
    item,
    error,
    loading,
    copied,
    breadcrumb,
    downloadingId,
    downloadBatch,
    formatSize,
    fetchShareInfo,
    handleEnterFolder,
    handleBreadcrumbClick,
    copyShareLink,
    handleDownload,
    handleDownloadUrl,
    clearDownloadBatch,
  } = useSharePage();

  const [showDownloadMenu, setShowDownloadMenu] = React.useState(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && !event.target.closest('.relative')) {
        setShowDownloadMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  useEffect(() => {
    fetchShareInfo();
  }, [fetchShareInfo]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7faff]">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center gap-6 animate-fade-in">
          <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
            <Skeleton circle width={56} height={56} />
          </div>
          <div className="w-full flex flex-col items-center gap-2">
            <Skeleton width={180} height={28} />
            <Skeleton width={120} height={18} />
            <Skeleton width={120} height={18} />
          </div>
          <Skeleton width={160} height={36} className="rounded-lg" />
          <Skeleton width={120} height={20} />
          <div className="w-full mt-4">
            <Skeleton width={140} height={20} className="mb-2" />
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-gray-50">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-3">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton width={120} height={16} />
                  <Skeleton width={60} height={14} />
                  <Skeleton width={80} height={28} />
                </div>
              ))}
            </div>
          </div>
          <Skeleton width={100} height={14} />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7faff]">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="text-2xl font-bold text-red-500 mb-2">Lỗi</div>
          <div className="text-gray-700">{error}</div>
        </div>
      </div>
    );

  if (!item) return null;

  const ext = item.name.split(".").pop().toLowerCase();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center gap-6">
        {/* Breadcrumb */}
        {item.type === "folder" && breadcrumb.length > 0 && (
          <div className="flex gap-1 items-center mb-2 text-sm text-gray-500 w-full">
            {breadcrumb.map((b, idx) => (
              <span key={b.id} className="flex items-center gap-1">
                <button
                  className={`hover:underline ${
                    idx === breadcrumb.length - 1
                      ? "font-bold text-primary"
                      : ""
                  }`}
                  onClick={() => handleBreadcrumbClick(idx)}
                  disabled={idx === breadcrumb.length - 1}
                >
                  {b.name}
                </button>
                {idx < breadcrumb.length - 1 && <FiChevronRight />}
              </span>
            ))}
          </div>
        )}

        <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
          {item.type === "folder" ? (
            <FiFolder className="text-4xl text-blue-400" />
          ) : (
            <FiFile className="text-4xl text-blue-400" />
          )}
        </div>

        <div className="text-xl font-bold text-gray-800 text-center break-all">
          {item.name}
        </div>

        <div className="flex gap-4 text-gray-500 text-sm">
          <span>Kích thước: {formatSize(item.size)}</span>
          <span>
            Loại: {item.type === "folder" ? "Thư mục" : item.mimeType || ext}
          </span>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-blue-100 transition mb-2"
          onClick={copyShareLink}
        >
          <FiCopy />
          <span>Copy link chia sẻ</span>
        </button>

        {copied && (
          <div className="text-green-600 text-sm font-medium mb-2 animate-fade-in">
            Đã copy link chia sẻ!
          </div>
        )}

        {item.type === "file" ? (
          item.canDownload ? (
            <div className="relative inline-block">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow"
                onClick={() => setShowDownloadMenu(showDownloadMenu === item.id ? null : item.id)}
                disabled={downloadingId === item.id}
              >
                {downloadingId === item.id ? (
                  "Đang tải..."
                ) : (
                  <>
                    Tải xuống
                    <FiChevronDown className="text-sm" />
                  </>
                )}
              </button>
              {showDownloadMenu === item.id && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2"
                    onClick={() => {
                      handleDownload(item);
                      setShowDownloadMenu(null);
                    }}
                  >
                    <FiDownload />
                    Tải xuống tại chỗ
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2"
                    onClick={() => {
                      handleDownloadUrl(item);
                      setShowDownloadMenu(null);
                    }}
                  >
                    <FiFile />
                    Tải xuống bằng URL
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Bạn chỉ có quyền xem, không thể tải xuống
            </div>
          )
        ) : (
          <>
            {item.canDownload && (
              <button
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow mb-2"
                onClick={() => handleDownload(item)}
                disabled={downloadingId === item.id}
              >
                <FiDownload className="inline mr-2" />
                {downloadingId === item.id
                  ? "Đang tải..."
                  : "Tải xuống thư mục"}
              </button>
            )}

            {/* Danh sách file/thư mục con */}
            <div className="w-full mt-4">
              <div className="font-semibold text-gray-700 mb-2">
                Nội dung thư mục:
              </div>
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-gray-50">
                {item.children &&
                  item.children.folders &&
                  item.children.folders.length === 0 &&
                  item.children &&
                  item.children.files &&
                  item.children.files.length === 0 && (
                    <div className="p-4 text-gray-400 text-center">
                      Thư mục trống
                    </div>
                  )}
                {item.children &&
                  item.children.folders &&
                  item.children.folders.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-blue-50 cursor-pointer"
                      onClick={() => handleEnterFolder(f)}
                    >
                      <FiFolder className="text-lg text-blue-400" />
                      <span className="font-medium text-gray-800 flex-1">
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-400">Thư mục</span>
                      <FiChevronRight />
                    </div>
                  ))}
                {item.children &&
                  item.children.files &&
                  item.children.files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-blue-50"
                    >
                      <FiFile className="text-lg text-gray-400" />
                      <span className="font-medium text-gray-800 flex-1">
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatSize(f.size)}
                      </span>
                      {item.canDownload && (
                        <div className="relative ml-2">
                          <button
                            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-blue-700 flex items-center gap-1"
                            onClick={() => setShowDownloadMenu(showDownloadMenu === f.id ? null : f.id)}
                            disabled={downloadingId === f.id}
                          >
                            {downloadingId === f.id ? (
                              "Đang tải..."
                            ) : (
                              <>
                                <FiDownload /> Tải xuống
                                <FiChevronDown className="text-xs" />
                              </>
                            )}
                          </button>
                          {showDownloadMenu === f.id && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-xs"
                                onClick={() => {
                                  handleDownload(f);
                                  setShowDownloadMenu(null);
                                }}
                              >
                                <FiDownload />
                                Tải xuống tại chỗ
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2 text-xs"
                                onClick={() => {
                                  handleDownloadUrl(f);
                                  setShowDownloadMenu(null);
                                }}
                              >
                                <FiFile />
                                Tải xuống bằng URL
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        <div className="text-xs text-gray-400 mt-2">Chia sẻ bởi D2MBox</div>
      </div>

      {/* DownloadStatus cho download progress */}
      {downloadBatch && (
        <DownloadStatus
          files={downloadBatch.files}
          folderName={downloadBatch.folderName}
          onComplete={clearDownloadBatch}
        />
      )}
    </div>
  );
}
