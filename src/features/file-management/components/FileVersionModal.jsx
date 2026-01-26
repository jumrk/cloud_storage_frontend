import React, { useState, useEffect, useMemo } from "react";
import { FiX, FiClock, FiRotateCcw, FiDownload, FiCheck, FiInfo } from "react-icons/fi";
import { useTranslations } from "next-intl";
import FileManagementService from "../services/fileManagementService";
import toast from "react-hot-toast";

const FileVersionModal = ({ isOpen, onClose, file }) => {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  // ✅ No need for token - cookie sent automatically

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    if (isOpen && file) {
      loadVersions();
    }
  }, [isOpen, file]);

  const loadVersions = async () => {
    const fileId = file.id || file._id;
    if (!fileId) return;
    setLoading(true);
    try {
      const res = await api.getFileVersions(fileId);
      if (res.success) {
        setVersions(res.versions || []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách phiên bản");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    if (!window.confirm("Bạn có chắc chắn muốn khôi phục phiên bản này? Phiên bản hiện tại sẽ được lưu thành một phiên bản mới.")) return;
    
    const fileId = file.id || file._id;
    setRestoringId(versionId);
    try {
      const res = await api.restoreVersion(fileId, versionId);
      if (res.success) {
        toast.success("Khôi phục phiên bản thành công");
        loadVersions();
        onClose(); // Optional: close and refresh main data
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khôi phục phiên bản");
    } finally {
      setRestoringId(null);
    }
  };

  const formatSize = (size) => {
    if (!size) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-gray-900 font-bold text-lg min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex-shrink-0 flex items-center justify-center">
              <FiClock size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate">{file.name || file.originalName}</h3>
              <p className="text-xs text-gray-500 font-normal">Quản lý lịch sử phiên bản</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 main-content-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-gray-400">
              <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
              <p className="text-sm">Đang tải lịch sử phiên bản...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-gray-400 text-center">
              <FiInfo size={48} className="opacity-20" />
              <p className="text-sm italic">Chưa có phiên bản cũ nào cho tệp tin này</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Version */}
              <div className="p-4 rounded-2xl border-2 border-brand/20 bg-brand/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      V{file.versionNumber || 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Phiên bản hiện tại</p>
                      <p className="text-xs text-gray-500">Cập nhật lúc {formatDate(file.updatedAt || file.date)}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    Active
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Lịch sử ({versions.length})</h4>

              {/* Version List */}
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      V{v.versionNumber}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {v.fileName}
                        </p>
                        <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {formatSize(v.fileSize)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Tạo bởi {v.createdBy?.fullName || v.createdBy?.email || "N/A"} • {formatDate(v.createdAt)}
                      </p>
                      {v.changeLog && (
                        <p className="text-[11px] text-gray-400 italic mt-1 line-clamp-1">
                          "{v.changeLog}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestore(v._id)}
                        disabled={restoringId === v._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:border-brand hover:text-brand transition-all shadow-sm disabled:opacity-50"
                        title="Khôi phục"
                      >
                        {restoringId === v._id ? (
                          <div className="w-3 h-3 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                        ) : (
                          <FiRotateCcw size={14} />
                        )}
                        <span>Khôi phục</span>
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Handle version download
                          if (v.driveUrl) window.open(v.driveUrl, "_blank");
                        }}
                        className="p-2 text-gray-400 hover:text-brand hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100"
                        title="Tải xuống phiên bản này"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileVersionModal;
