import React, { useState, useEffect, useMemo } from "react";
import { FiX, FiActivity, FiUser, FiFile, FiFolder, FiClock, FiAlertCircle } from "react-icons/fi";
import { useTranslations } from "next-intl";
import FileManagementService from "../services/fileManagementService";
import Skeleton from "react-loading-skeleton";

const ActivitySidebar = ({ isOpen, onClose, fileId, folderId, title }) => {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  // ✅ No need for token - cookie sent automatically

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActivity(1);
    }
  }, [isOpen, fileId, folderId]);

  const loadActivity = async (pageNum = 1) => {
    setLoading(true);
    try {
      let res;
      if (fileId) {
        res = await api.getFileActivity(fileId, { page: pageNum, limit: 20 });
      } else if (folderId) {
        res = await api.getFolderActivity(folderId, { page: pageNum, limit: 20 });
      } else {
        res = await api.getUserActivity({ page: pageNum, limit: 20 });
      }

      if (res.success) {
        if (pageNum === 1) {
          setActivities(res.activities || []);
        } else {
          setActivities(prev => [...prev, ...(res.activities || [])]);
        }
        setHasMore(res.pagination?.page < res.pagination?.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to load activities", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "UPLOADED": return "text-green-600 bg-green-50";
      case "DELETED": return "text-red-600 bg-red-50";
      case "MOVED": return "text-blue-600 bg-blue-50";
      case "SHARED": return "text-purple-600 bg-purple-50";
      case "LOCKED": return "text-orange-600 bg-orange-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const formatTimestamp = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[110] transition-opacity" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-screen w-full max-w-[350px] bg-white shadow-2xl z-[120] flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 text-gray-900 font-bold text-lg">
            <FiActivity className="text-brand" />
            <h3 className="truncate max-w-[200px]">{title || "Hoạt động gần đây"}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 sidebar-scrollbar">
          {loading && page === 1 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton circle width={32} height={32} />
                <div className="flex-1">
                  <Skeleton width="80%" height={14} />
                  <Skeleton width="40%" height={10} className="mt-1" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                <FiAlertCircle size={32} className="opacity-20" />
              </div>
              <p className="text-sm italic text-center">Chưa có hoạt động nào được ghi lại</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-100" />

              <div className="space-y-8 relative">
                {activities.map((activity, idx) => (
                  <div key={activity._id || idx} className="flex gap-4 group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${getActionColor(activity.action)} ring-4 ring-white`}>
                      {activity.resourceType === "folder" ? <FiFolder size={14} /> : <FiFile size={14} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {activity.action}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <FiClock size={10} /> {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                        <span className="font-bold text-gray-900">
                          {activity.userId?.fullName || "Người dùng"}
                        </span>{" "}
                        đã {activity.action.toLowerCase().replace("_", " ")}{" "}
                        {activity.resourceType}{" "}
                        <span className="font-semibold text-brand italic">
                          "{activity.resourceName}"
                        </span>
                      </p>

                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {activity.details.fromFolderName && (
                            <p>Từ: {activity.details.fromFolderName}</p>
                          )}
                          {activity.details.toFolderName && (
                            <p>Đến: {activity.details.toFolderName}</p>
                          )}
                          {activity.details.fileSize && (
                            <p>Dung lượng: {(activity.details.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={() => loadActivity(page + 1)}
                  disabled={loading}
                  className="w-full mt-8 py-2 text-xs font-bold text-brand hover:underline disabled:opacity-50"
                >
                  {loading ? "Đang tải..." : "Xem thêm hoạt động"}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ActivitySidebar;
