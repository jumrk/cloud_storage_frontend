"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiRotateCw, // Restore
  FiTrash2, // Delete Forever
} from "react-icons/fi";
import { BiSelectMultiple } from "react-icons/bi";
import EmptyState from "@/shared/ui/EmptyState";
import { toast } from "react-hot-toast";
import SkeletonTable from "@/shared/skeletons/SkeletonTable";
import FileManagementService from "@/features/file-management/services/fileManagementService";
import ActionZone from "@/features/file-management/components/ActionZone";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Breadcrumb from "@/shared/ui/Breadcrumb";
import MiniStatus from "@/features/file-management/components/MiniStatus";
import Popover from "@/shared/ui/Popover";
import Image from "next/image";
import { getFileIcon } from "@/shared/utils/getFileIcon";

// Helper function
function formatSize(size) {
  if (!size || isNaN(size)) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}

export default function TrashFileManager() {
  const t = useTranslations("file_trash");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const api = useMemo(() => FileManagementService(), []);
  
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  // view state removed as we force table layout
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest","oldest","name"
  const [tableSort, setTableSort] = useState({
    column: null,
    direction: "asc",
  }); 
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });
  const [permanentDeleteBatches, setPermanentDeleteBatches] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);
  const limit = 20;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDeletedItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: searchTerm,
        sortBy,
      };
      const res = await api.getDeletedItems(params);
      if (res.success) {
        setFiles(res.files || []);
        setFolders(res.folders || []);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error("Error fetching deleted items:", err);
      toast.error("Không thể tải danh sách file đã xóa");
    } finally {
      setLoading(false);
    }
  }, [api, page, limit, searchTerm, sortBy]);

  useEffect(() => {
    fetchDeletedItems();
  }, [fetchDeletedItems]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy]);

  const getDaysUntilPermanentDelete = (deletedAt) => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = now - deleted;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  const allItems = useMemo(() => {
    let items = [
      ...folders.map((f) => ({
        ...f,
        id: f._id,
        name: f.name,
        type: "folder",
        date: f.deletedAt,
        parentId: f.parentId,
        daysLeft: getDaysUntilPermanentDelete(f.deletedAt),
      })),
      ...files.map((f) => ({
        ...f,
        id: f._id,
        name: f.originalName || f.name,
        type: "file",
        date: f.deletedAt,
        folderId: f.folderId,
        size: f.size,
        mimeType: f.mimeType,
        url: f.url,
        driveUrl: f.driveUrl,
        daysLeft: getDaysUntilPermanentDelete(f.deletedAt),
      })),
    ];

    if (currentFolderId === null) {
      const deletedFolderIds = new Set(folders.map((f) => f._id?.toString()));
      items = items.filter((item) => {
        if (item.type === "folder") {
          if (!item.parentId) return true;
          return !deletedFolderIds.has(item.parentId?.toString());
        } else {
          if (!item.folderId) return true;
          return !deletedFolderIds.has(item.folderId?.toString());
        }
      });
    } else {
      items = items.filter((item) => {
        if (item.type === "folder") {
          return item.parentId?.toString() === currentFolderId?.toString();
        } else {
          return item.folderId?.toString() === currentFolderId?.toString();
        }
      });
    }

    if (tableSort.column) {
      items.sort((a, b) => {
        let aVal, bVal;
        if (tableSort.column === "name") {
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
        } else if (tableSort.column === "date") {
          aVal = new Date(a.deletedAt || a.date || 0);
          bVal = new Date(b.deletedAt || b.date || 0);
        } else if (tableSort.column === "daysLeft") {
          aVal = a.daysLeft || 0;
          bVal = b.daysLeft || 0;
        } else if (tableSort.column === "size") {
            aVal = a.size || 0;
            bVal = b.size || 0;
        } else {
          return 0;
        }
        if (aVal < bVal) return tableSort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return tableSort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [files, folders, tableSort, currentFolderId]);

  const handleTableSort = (column) => {
    setTableSort((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        return {
          column,
          direction: "asc",
        };
      }
    });
  };

  const getSortIcon = (column) => {
    if (tableSort.column !== column) {
      return (
        <div className="flex flex-col -space-y-1">
          <FiChevronUp className="text-gray-300" size={10} />
          <FiChevronDown className="text-gray-300" size={10} />
        </div>
      );
    }
    return tableSort.direction === "asc" ? (
      <FiChevronUp className="text-brand" size={14} />
    ) : (
      <FiChevronDown className="text-brand" size={14} />
    );
  };

  const handleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(allItems);
    } else {
      setSelectedItems([]);
    }
  };

  const handleFolderClick = (folder) => {
    if (folder.type === "folder") {
      if (currentFolderId !== null) {
        const currentFolder = folders.find(
          (f) => f._id?.toString() === currentFolderId?.toString()
        );
        setFolderStack((prev) => {
          const lastItem = prev[prev.length - 1];
          if (lastItem && String(lastItem.id) === String(currentFolderId)) {
            return prev;
          }
          return [
            ...prev,
            { id: currentFolderId, name: currentFolder?.name || "Unknown" },
          ];
        });
      }
      setCurrentFolderId(folder.id);
      setSelectedItems([]);
    }
  };

  const handleBack = () => {
    if (folderStack.length > 0) {
      const newStack = [...folderStack];
      const previousFolder = newStack.pop();
      setFolderStack(newStack);
      setCurrentFolderId(previousFolder.id);
      setSelectedItems([]);
    } else {
      setCurrentFolderId(null);
      setSelectedItems([]);
    }
  };

  const handleBreadcrumbClick = (folderId) => {
    if (folderId === null) {
      setCurrentFolderId(null);
      setFolderStack([]);
      setSelectedItems([]);
    } else {
      if (currentFolderId?.toString() === folderId?.toString()) return;
      
      const index = folderStack.findIndex(
        (f) => f.id?.toString() === folderId?.toString()
      );
      if (index !== -1) {
        const newStack = folderStack.slice(0, index + 1);
        setFolderStack(newStack);
        setCurrentFolderId(folderId);
        setSelectedItems([]);
      } else {
        setCurrentFolderId(folderId);
        setSelectedItems([]);
      }
    }
  };

  const getBreadcrumbItems = () => {
    const items = [];
    folderStack.forEach((folder) => {
      if (folder.id !== null) {
        items.push({
          id: folder.id,
          label: folder.name || "Root",
        });
      }
    });
    if (currentFolderId !== null) {
      const isCurrentFolderInStack = folderStack.some(
        (folder) => folder && String(folder.id) === String(currentFolderId)
      );
      if (!isCurrentFolderInStack) {
        const currentFolder = folders.find(
          (f) => f._id?.toString() === currentFolderId?.toString()
        );
        if (currentFolder) {
          items.push({
            id: currentFolderId,
            label: currentFolder.name || "Unknown",
          });
        }
      }
    }
    return items;
  };

  const handleRestore = async () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn file/thư mục cần khôi phục");
      return;
    }
    try {
      const items = selectedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));
      const res = await api.restoreItems(items);
      if (res.success) {
        toast.success(t("confirm.restore_success", { count: res.restored?.length || 0 }));
        setSelectedItems([]);
        fetchDeletedItems();
      } else {
        toast.error("Không thể khôi phục");
      }
    } catch (err) {
      console.error("Error restoring items:", err);
      toast.error("Không thể khôi phục");
    }
  };

  const handlePermanentDelete = async (item = null) => {
    let itemsToDelete;
    if (item !== null && item !== undefined && !item.nativeEvent) { // Check for event object just in case
        itemsToDelete = Array.isArray(item) ? item : [item];
    } else {
        itemsToDelete = selectedItems;
    }

    if (itemsToDelete.length === 0) {
      toast.error("Vui lòng chọn file/thư mục cần xóa vĩnh viễn");
      return;
    }

    const invalidItems = itemsToDelete.filter((it) => !it.id || !it.type);
    if (invalidItems.length > 0) return;

    const confirmCallback = async () => {
      setConfirmDialog({
        open: false, title: "", message: "", onConfirm: null, loading: false,
      });
      setSelectedItems([]);

      const batchId = `permanent-delete-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const batchItems = itemsToDelete.map((it) => ({
        id: it.id,
        name: it.name || it.originalName || it.id,
        type: it.type,
      }));

      try {
        setPermanentDeleteBatches((prev) => [
          ...prev,
          { id: batchId, items: batchItems },
        ]);
      } catch (error) {
        toast.error("Không thể tạo batch xóa");
      }
    };

    setConfirmDialog({
      open: true,
      title: t("confirm.delete_title"),
      message: t("confirm.delete_message", { count: itemsToDelete.length }),
      confirmText: t("actions.delete_forever"),
      cancelText: tCommon("cancel"),
      onConfirm: confirmCallback,
      loading: false,
    });
  };

  const handleRestoreSingle = async (item) => {
    if (!item) return;
    try {
      const items = [{ id: item.id, type: item.type }];
      const res = await api.restoreItems(items);
      if (res.success) {
        toast.success(t("confirm.restore_success", { count: 1 }));
        setSelectedItems([]);
        fetchDeletedItems();
      } else {
        toast.error("Không thể khôi phục");
      }
    } catch (err) {
      console.error("Error restoring item:", err);
      toast.error("Không thể khôi phục");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleString("vi-VN");
  };

  const columnWidths = {
    checkbox: "48px",
    name: "40%",
    size: "15%",
    date: "20%",
    daysLeft: "15%",
    actions: "10%"
  };

  return (
    <div className="flex w-full h-full bg-white relative">
      <div className="flex-1 flex flex-col items-start px-3 md:px-6 py-4">
        {/* Header */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-800">{t("title")}</h1>
            <div className="flex items-center gap-3">
             <div className="relative max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder={t("search_placeholder")} // Fallback or use standard key
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm transition-all"
                />
             </div>
            </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">{t("description")}</p>

        {/* Breadcrumb */}
        {(allItems.length > 0 || currentFolderId !== null || folderStack.length > 0) && (
          <div className="w-full mb-2" style={{ minHeight: "28px" }}>
            <Breadcrumb
              items={getBreadcrumbItems()}
              onItemClick={handleBreadcrumbClick}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="w-full flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <SkeletonTable rows={8} />
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
                <EmptyState message={t("empty")} />
            </div>
          ) : (
            <table className="w-full md:min-w-[800px] border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left" style={{ width: columnWidths.checkbox }}>
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={allItems.length > 0 && allItems.every((item) => selectedItems.find((i) => i.id === item.id))}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                        />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    style={{ width: isMobile ? "auto" : columnWidths.name }}
                    onClick={() => handleTableSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      {t("table.name")} {getSortIcon("name")}
                    </div>
                  </th>
                  <th 
                    className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    style={{ width: columnWidths.size }}
                    onClick={() => handleTableSort("size")}
                  >
                    <div className="flex items-center gap-2">
                       {t("table.size")} {getSortIcon("size")}
                    </div>
                  </th>
                  <th 
                    className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    style={{ width: columnWidths.date }}
                    onClick={() => handleTableSort("date")}
                  >
                     <div className="flex items-center gap-2">
                       {t("table.deleted_at")} {getSortIcon("date")}
                     </div>
                  </th>
                  <th 
                    className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    style={{ width: columnWidths.daysLeft }}
                    onClick={() => handleTableSort("daysLeft")}
                  >
                     <div className="flex items-center gap-2">
                       {t("table.days_left")} {getSortIcon("daysLeft")}
                     </div>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700" style={{ width: isMobile ? "auto" : columnWidths.actions }}>
                     {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allItems.map((item, index) => {
                  const checked = !!selectedItems.find((i) => i.id === item.id);
                  const daysLeft = item.daysLeft || getDaysUntilPermanentDelete(item.deletedAt || item.date);
                  
                  return (
                    <tr 
                      key={item.id || index} 
                      className={`group hover:bg-gray-50 transition-colors ${checked ? "bg-brand-50/30" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                         <div className="flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleSelectItem(item)}
                                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                            />
                         </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                         <div 
                            className={`flex items-center gap-3 ${item.type === "folder" ? "cursor-pointer" : ""}`}
                            onClick={() => item.type === "folder" && handleFolderClick(item)}
                         >
                            <div className="relative flex-shrink-0">
                               <Image
                                  src={getFileIcon({ type: item.type, name: item.name })}
                                  alt="icon"
                                  className="w-8 h-8 object-contain"
                                  width={32}
                                  height={32}
                               />
                            </div>
                            <span className={`text-sm font-medium truncate ${item.type === "folder" ? "text-gray-900 group-hover:text-brand" : "text-gray-900"}`} title={item.name}>
                               {item.name}
                            </span>
                         </div>
                      </td>

                      {/* Size */}
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                         {item.type === "folder" ? "-" : formatSize(item.size)}
                      </td>

                      {/* Date */}
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                         {formatDate(item.deletedAt || item.date)}
                      </td>

                      {/* Days Left */}
                      <td className="hidden md:table-cell px-4 py-3 text-sm">
                         {daysLeft > 0 ? (
                            <span className={`font-medium ${daysLeft <= 3 ? "text-red-500" : "text-orange-500"}`}>
                               {daysLeft} ngày
                            </span>
                         ) : (
                            <span className="text-red-600 font-bold">
                               Sắp xóa
                            </span>
                         )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                         <div className="flex items-center justify-end gap-1 opacity-100">
                            <button
                               onClick={(e) => { e.stopPropagation(); handleRestoreSingle(item); }}
                               className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                               title={t("actions.restore")}
                            >
                               <FiRotateCw size={18} />
                            </button>
                            <button
                               onClick={(e) => { e.stopPropagation(); handlePermanentDelete(item); }}
                               className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                               title={t("actions.delete_forever")}
                            >
                               <FiTrash2 size={18} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination - Reuse existing logic */}
        {totalPages > 1 && (
            <div className="flex items-center justify-center w-full gap-2 mt-4">
                <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                Trước
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                Trang {page} / {totalPages}
                </span>
                <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                Sau
                </button>
            </div>
        )}
      </div>

      <ActionZone
        isMobile={isMobile}
        selectedItems={selectedItems}
        draggedItems={[]}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        showRestore={true}
        showPermanentDelete={true}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => {
          setConfirmDialog({
            open: false, title: "", message: "", onConfirm: null, loading: false,
          });
        }}
        onConfirm={confirmDialog.onConfirm}
        loading={confirmDialog.loading}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />

      {permanentDeleteBatches.map((batch, idx) => (
        <MiniStatus
          key={batch.id}
          batchType="permanent-delete"
          batchId={batch.id}
          moveItems={batch.items}
          onComplete={(result) => {
            setPermanentDeleteBatches((prev) =>
              prev.filter((b) => b.id !== batch.id)
            );
            if (result?.success !== false) {
              fetchDeletedItems();
            }
          }}
          style={{
            bottom: `${6 + idx * 360}px`,
          }}
        />
      ))}
    </div>
  );
}
