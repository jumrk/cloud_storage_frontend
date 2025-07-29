"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiCopy,
  FiFolder,
  FiFile,
  FiChevronRight,
  FiDownload,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/lib/axiosClient";

function formatSize(size) {
  if (!size) return "-";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + " MB";
  return (size / 1024 / 1024 / 1024).toFixed(1) + " GB";
}

export default function SharePage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]); // [{id, name}]
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosClient
      .get(`/api/share/${id}`)
      .then((res) => {
        const data = res.data;
        setItem(data);
        // Breadcrumb logic: if navigating into subfolder, push to breadcrumb
        if (data.type === "folder") {
          setBreadcrumb((prev) => {
            // Nếu đã có id này thì cắt đến đó
            const idx = prev.findIndex((b) => b.id === data.id);
            if (idx !== -1) return prev.slice(0, idx + 1);
            return [...prev, { id: data.id, name: data.name }];
          });
        }
      })
      .catch((err) => {
        let msg = "Không tìm thấy file hoặc thư mục";
        if (err.response && err.response.data && err.response.data.error) {
          msg = err.response.data.error;
        } else if (err.message) {
          msg = err.message;
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [id]);

  const handleEnterFolder = (folder) => {
    router.push(`/share/${folder.id}`);
  };

  const handleBreadcrumbClick = (idx) => {
    if (idx === breadcrumb.length - 1) return;
    const target = breadcrumb[idx];
    router.push(`/share/${target.id}`);
    setBreadcrumb(breadcrumb.slice(0, idx + 1));
  };

  // Thay thế logic tải xuống file/folder bằng axiosClient để tải và lưu file đúng tên
  const handleDownload = async (item) => {
    try {
      setDownloadingId(item.id);
      let url = "";
      let filename = item.name;
      let isFolder = item.type === "folder";
      if (isFolder) {
        url = `/api/share/${item.id}/download`;
        filename = `${item.name}.zip`;
      } else {
        url =
          item.url ||
          `https://drive.google.com/uc?export=download&id=${item.id}`;
        if (item.url) {
          window.location.href = item.url;
          setDownloadingId(null);
          return;
        }
      }
      const res = await axiosClient.get(url, { responseType: "blob" });
      const blob = new Blob([res.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }, 200);
    } catch (err) {
      alert("Lỗi tải xuống: " + (err?.response?.data?.error || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

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
          {/* Nếu là folder, giả lập danh sách con */}
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
          {/* Icon file/folder */}
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
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
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
          <button
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow"
            onClick={() => handleDownload(item)}
            disabled={downloadingId === item.id}
          >
            {downloadingId === item.id ? "Đang tải..." : "Tải xuống"}
          </button>
        ) : (
          <>
            <button
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow mb-2"
              onClick={() => handleDownload(item)}
              disabled={downloadingId === item.id}
            >
              <FiDownload className="inline mr-2" />
              {downloadingId === item.id
                ? "Đang nén & tải..."
                : "Tải xuống thư mục (zip)"}
            </button>
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
                      <button
                        className="ml-2 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        onClick={() => handleDownload(f)}
                        disabled={downloadingId === f.id}
                      >
                        {downloadingId === f.id ? (
                          "Đang tải..."
                        ) : (
                          <>
                            <FiDownload /> Tải xuống
                          </>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
        <div className="text-xs text-gray-400 mt-2">Chia sẻ bởi D2MBox</div>
      </div>
    </div>
  );
}
