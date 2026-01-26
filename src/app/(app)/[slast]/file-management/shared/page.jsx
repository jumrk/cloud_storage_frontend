"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { getSharedByMe, getSharedWithMe } from "./services/sharedFilesService";
import ShareModal from "@/features/file-management/components/ShareModal";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSettings,
  FiUser,
  FiMoreVertical
} from "react-icons/fi";
import Image from "next/image";
import { getFileIcon } from "@/shared/utils/getFileIcon";
import SkeletonTable from "@/shared/skeletons/SkeletonTable";
import EmptyState from "@/shared/ui/EmptyState";

// Helper functions matching TableFile.jsx
function formatSize(size) {
  if (!size || isNaN(size)) return "-";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + " MB";
  return (size / 1024 / 1024 / 1024).toFixed(1) + " GB";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

const UserAvatar = ({ name }) => {
  const initials = name ? name.charAt(0).toUpperCase() : "?";
  // Generate consistent color
  const colors = [
    "bg-red-100 text-red-600", "bg-orange-100 text-orange-600", 
    "bg-amber-100 text-amber-600", "bg-green-100 text-green-600",
    "bg-teal-100 text-teal-600", "bg-blue-100 text-blue-600",
    "bg-indigo-100 text-indigo-600", "bg-violet-100 text-violet-600"
  ];
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;
  
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ring-white shadow-sm flex-shrink-0 ${colors[colorIndex]}`}>
      {initials}
    </div>
  );
};

export default function SharedPage() {
  const t = useTranslations("file_shared");
  const [tab, setTab] = useState("me");
  const [sharedByMe, setSharedByMe] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalItem, setShareModalItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Resize logic excluded for simplicity, using fixed widths closer to design
  const columnWidths = {
    name: "40%",
    size: "15%",
    date: "15%",
    people: "20%",
    actions: "10%"
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const abortController = new AbortController();
        if (tab === "me") {
          const response = await getSharedByMe(abortController.signal);
          if (response.success) {
            setSharedByMe(response.sharedItems || []);
          }
        } else {
          const response = await getSharedWithMe(abortController.signal);
          if (response.success) {
            setSharedWithMe(response.sharedItems || []);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching shared files:", err);
          setError("Không thể tải dữ liệu");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab, refreshKey]);

  const handleManageShare = (item) => {
    if (tab !== "me") return;
    if (!item) return;
    const resourceId = item.resourceId || item.id;
    if (!resourceId) return;
    setShareModalItem({
      id: resourceId,
      type: item.type || item.resourceType || "file",
      name: item.name,
      canView: typeof item.canView === "boolean" ? item.canView : true,
      canDownload:
        typeof item.canDownload === "boolean" ? item.canDownload : false,
      shareUrl: item.shareUrl || "",
      requirePassword: !!item.requirePassword,
      maxDownloads: item.maxDownloads ?? null,
      notifyOnAccess: !!item.notifyOnAccess,
      viewCount: item.viewCount || 0,
      downloadCount: item.downloadCount || 0,
    });
    setShareModalOpen(true);
  };

  const closeShareModal = (shouldRefresh = false, updatedShareData = null) => {
    if (updatedShareData && shouldRefresh) {
      const resourceId = updatedShareData.resourceId || shareModalItem?.id;
      if (resourceId) {
        setSharedByMe((prev) =>
          prev.map((item) => {
            if ((item.resourceId || item.id) === resourceId) {
              return {
                ...item,
                canView: updatedShareData.canView ?? item.canView,
                canDownload: updatedShareData.canDownload ?? item.canDownload,
                requirePassword: updatedShareData.requirePassword ?? item.requirePassword,
                maxDownloads: updatedShareData.maxDownloads ?? item.maxDownloads,
                notifyOnAccess: updatedShareData.notifyOnAccess ?? item.notifyOnAccess,
                shareUrl: updatedShareData.shareUrl ?? item.shareUrl,
              };
            }
            return item;
          })
        );
      }
    }
    setShareModalOpen(false);
    setShareModalItem(null);
    if (shouldRefresh) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  const data = tab === "me" ? sharedByMe : sharedWithMe;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] relative isolate animate-in fade-in duration-500">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 md:px-8 py-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{t(`description.${tab}`)}</p>
        </div>

        {/* Floating Tabs */}
        <div className="bg-gray-100/80 p-1.5 rounded-2xl flex relative w-fit shadow-inner">
          {["me", "with_me"].map((currentTab) => (
            <button
              key={currentTab}
              onClick={() => setTab(currentTab)}
              className={`relative px-6 py-2 rounded-xl text-sm font-bold transition-colors z-10 ${
                tab === currentTab ? "text-brand-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === currentTab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-black/5"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t(`tabs.${currentTab}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area - Table Layout */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
        {loading ? (
             <div className="mt-4">
                <SkeletonTable rows={6} />
             </div>
        ) : error ? (
           <EmptyState message={error} height={180} />
        ) : data.length === 0 ? (
           <EmptyState message={t("empty")} height={220} />
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="bg-gray-50/50 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                   <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={{ width: columnWidths.name }}>
                      {t("table.name") || "Tên tệp"}
                   </th>
                   <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={{ width: columnWidths.size }}>
                      {t("table.size") || "Kích thước"}
                   </th>
                   <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={{ width: columnWidths.date }}>
                      {t("table.date") || "Ngày"}
                   </th>
                   <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={{ width: columnWidths.people }}>
                      {tab === "me" ? (t("table.recipient") || "Người nhận") : (t("table.owner") || "Chủ sở hữu")}
                   </th>
                   <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700" style={{ width: columnWidths.actions }}>
                      {t("table.actions") || "Thao tác"}
                   </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    className="group hover:bg-gray-50 transition-colors"
                  >
                    {/* Name Column */}
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                             <Image
                               src={getFileIcon({ type: item.type, name: item.name })}
                               alt="icon"
                               className="w-8 h-8 object-contain"
                               width={32}
                               height={32}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                             <span className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                                {item.name}
                             </span>
                             {/* Permission Badge & Tag for Mobile */}
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                    item.permission === "view"
                                      ? "bg-blue-50 text-blue-600 border-blue-100"
                                      : "bg-purple-50 text-purple-600 border-purple-100"
                                }`}>
                                   {item.permission === "view" ? "Can View" : "Can Edit"}
                                </span>
                             </div>
                          </div>
                       </div>
                    </td>

                    {/* Size Column */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                       {formatSize(item.size)}
                    </td>

                    {/* Date Column */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                       {formatDate(item.date)}
                    </td>

                    {/* People Column */}
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-2">
                           <UserAvatar 
                              name={tab === "me" 
                                ? (Array.isArray(item.recipients) ? item.recipients[0] : item.recipients) 
                                : item.owner
                              } 
                           />
                           <div className="flex flex-col">
                              <span className="text-sm text-gray-700 font-medium truncate max-w-[150px]" title={tab === "me" ? (Array.isArray(item.recipients) ? item.recipients.join(", ") : item.recipients) : item.owner}>
                                 {tab === "me" 
                                   ? (Array.isArray(item.recipients) 
                                      ? (item.recipients.length > 1 ? `${item.recipients.length} people` : item.recipients[0]) 
                                      : item.recipients) 
                                   : item.owner
                                 }
                              </span>
                           </div>
                       </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-3 text-right">
                       <button
                          className={`p-2 rounded-lg transition-all inline-flex items-center justify-center ${
                             tab === "me"
                               ? "text-gray-500 hover:text-brand hover:bg-brand/10"
                               : "text-gray-300 cursor-not-allowed"
                          }`}
                          disabled={tab !== "me"}
                          onClick={() => handleManageShare(item)}
                          title={tab === "me" ? t("actions.manage") : "Read Only"}
                       >
                          {tab === "me" ? <FiSettings size={18} /> : <FiUser size={18} />}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {shareModalOpen && typeof document !== "undefined" && createPortal(
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => closeShareModal(false)}
          item={shareModalItem}
          onSuccess={(updatedData) => closeShareModal(true, updatedData)}
        />,
        document.body
      )}
    </div>
  );
}
