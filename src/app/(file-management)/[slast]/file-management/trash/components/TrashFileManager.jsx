"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import CardDelete from "@/features/file-management/components/CardDelete";
import {
  FiGrid,
  FiList,
  FiSearch,
  FiChevronDown,
  FiRotateCw,
  FiTrash2,
  FiChevronUp,
} from "react-icons/fi";
import { BiSelectMultiple } from "react-icons/bi";
import EmptyState from "@/shared/ui/EmptyState";
import { toast } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonTable from "@/shared/skeletons/SkeletonTable";
import FileManagementService from "@/features/file-management/services/fileManagementService";
import ActionZone from "@/features/file-management/components/ActionZone";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Breadcrumb from "@/shared/ui/Breadcrumb";
import MiniStatus from "@/features/file-management/components/MiniStatus";

export default function TrashFileManager() {
  const router = useRouter();
  const api = useMemo(() => FileManagementService(), []);
  const tokenRef = useMemo(
    () =>
      typeof window !== "undefined" ? localStorage.getItem("token") : null,
    []
  );

  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [view, setView] = useState("grid");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "name"
  const [tableSort, setTableSort] = useState({ column: null, direction: "asc" }); // For table column sorting
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });
  const [permanentDeleteBatches, setPermanentDeleteBatches] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null); // Track current folder being viewed
  const [folderStack, setFolderStack] = useState([]); // Track folder navigation stack
  const limit = 20;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
      const res = await api.getDeletedItems(params, tokenRef);
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
  }, [api, tokenRef, page, limit, searchTerm, sortBy]);

  useEffect(() => {
    fetchDeletedItems();
  }, [fetchDeletedItems]);

  // Reset page when search or sort changes
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

    // Filter items based on current folder
    // If currentFolderId is null, show only root items (items whose parent/folder is NOT deleted)
    if (currentFolderId === null) {
      // Get all folder IDs that are deleted
      const deletedFolderIds = new Set(
        folders.map((f) => f._id?.toString())
      );
      
      // Filter: only show items that don't have a parent/folderId, OR their parent/folderId is NOT in deleted list (meaning parent still exists, so this item is at root level)
      items = items.filter((item) => {
        if (item.type === "folder") {
          // Folder: show if no parentId OR parent is NOT deleted (parent still exists)
          if (!item.parentId) return true;
          return !deletedFolderIds.has(item.parentId?.toString());
        } else {
          // File: show if no folderId OR folder is NOT deleted (folder still exists)
          if (!item.folderId) return true;
          return !deletedFolderIds.has(item.folderId?.toString());
        }
      });
    } else {
      // Show items inside current folder
      items = items.filter((item) => {
        if (item.type === "folder") {
          return item.parentId?.toString() === currentFolderId?.toString();
        } else {
          return item.folderId?.toString() === currentFolderId?.toString();
        }
      });
    }

    // Apply table column sorting if active
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
        // Toggle direction if same column
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        // New column, default to asc
        return { column, direction: "asc" };
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
      // Add current folder to stack before navigating
      // Only add if it's not already the last item in stack (to avoid duplicates)
      if (currentFolderId !== null) {
        const currentFolder = folders.find(f => f._id?.toString() === currentFolderId?.toString());
        setFolderStack((prev) => {
          // Check if current folder is already the last item in stack
          const lastItem = prev[prev.length - 1];
          if (lastItem && String(lastItem.id) === String(currentFolderId)) {
            // Already in stack as last item, don't add again
            return prev;
          }
          // Add current folder to stack
          return [...prev, { 
            id: currentFolderId, 
            name: currentFolder?.name || "Unknown" 
          }];
        });
      }
      setCurrentFolderId(folder.id);
      setSelectedItems([]); // Clear selection when navigating
    }
  };

  const handleBack = () => {
    if (folderStack.length > 0) {
      const newStack = [...folderStack];
      const previousFolder = newStack.pop();
      setFolderStack(newStack);
      setCurrentFolderId(previousFolder.id);
      setSelectedItems([]); // Clear selection when navigating
    } else {
      setCurrentFolderId(null);
      setSelectedItems([]);
    }
  };

  const handleBreadcrumbClick = (folderId) => {
    if (folderId === null) {
      // Click on home icon - go to root
      setCurrentFolderId(null);
      setFolderStack([]);
      setSelectedItems([]);
    } else {
      // Check if clicked folder is current folder
      if (currentFolderId?.toString() === folderId?.toString()) {
        // Already at this folder, do nothing
        return;
      }
      
      // Find the index of clicked folder in stack
      const index = folderStack.findIndex(f => f.id?.toString() === folderId?.toString());
      if (index !== -1) {
        // Navigate to that folder - cut stack at that index
        const newStack = folderStack.slice(0, index + 1);
        setFolderStack(newStack);
        setCurrentFolderId(folderId);
        setSelectedItems([]);
      } else {
        // Clicked on current folder from breadcrumb items
        // This shouldn't happen as current folder is the last item and not clickable
        // But handle it just in case
        setCurrentFolderId(folderId);
        setSelectedItems([]);
      }
    }
  };

  const getBreadcrumbItems = () => {
    const items = [];
    
    // Add all folders in stack
    folderStack.forEach((folder) => {
      if (folder.id !== null) {
        items.push({
          id: folder.id,
          label: folder.name || "Root",
        });
      }
    });
    
    // Add current folder only if it's NOT already in stack
    // (to avoid duplicate display when navigating back)
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
      const res = await api.restoreItems(items, tokenRef);
      if (res.success) {
        toast.success(`Đã khôi phục ${res.restored?.length || 0} mục`);
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
    const itemsToDelete = item ? [item] : selectedItems;
    
    if (itemsToDelete.length === 0) {
      toast.error("Vui lòng chọn file/thư mục cần xóa vĩnh viễn");
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Xóa vĩnh viễn",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${itemsToDelete.length} mục? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa vĩnh viễn",
      cancelText: "Hủy",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null, loading: false });
        
        // Create batch for MiniStatus
        const batchId = `permanent-delete-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const batchItems = itemsToDelete.map((it) => ({
          id: it.id,
          name: it.name || it.originalName || it.id,
          type: it.type,
        }));
        
        setPermanentDeleteBatches((prev) => [
          ...prev,
          {
            id: batchId,
            items: batchItems,
          },
        ]);
        
        // Execute permanent delete
        try {
          const items = itemsToDelete.map((it) => ({
            id: it.id,
            type: it.type,
          }));
          const res = await api.permanentDeleteItems(items, tokenRef);
          if (res.success) {
            setSelectedItems([]);
            // MiniStatus will handle the completion callback
          } else {
            toast.error("Không thể xóa vĩnh viễn");
            // Remove batch on error
            setPermanentDeleteBatches((prev) => prev.filter((b) => b.id !== batchId));
          }
        } catch (err) {
          console.error("Error permanently deleting items:", err);
          toast.error("Không thể xóa vĩnh viễn");
          // Remove batch on error
          setPermanentDeleteBatches((prev) => prev.filter((b) => b.id !== batchId));
        }
      },
      loading: false,
    });
  };

  const handleRestoreSingle = async (item) => {
    if (!item) return;
    
    try {
      const items = [
        {
          id: item.id,
          type: item.type,
        },
      ];
      const res = await api.restoreItems(items, tokenRef);
      if (res.success) {
        toast.success("Đã khôi phục mục");
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

  return (
    <div className="flex w-full min-h-screen bg-surface-50 relative">
      <div className="flex-1 flex flex-col items-start px-2 md:px-8 py-6">
        {/* Header with search, view, and sort */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex-1 relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white shadow-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand text-[15px] text-text-strong placeholder:text-text-muted/60"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 rounded-xl bg-white shadow-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand text-[15px] text-text-strong cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name">Sắp xếp theo tên</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="hidden items-center gap-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-border lg:flex">
              <button
                className={`p-2 rounded-lg transition-all text-lg ${
                  view === "grid"
                    ? "shadow"
                    : "text-text-muted hover:bg-surface-50"
                }`}
                style={
                  view === "grid"
                    ? {
                        background:
                          "color-mix(in srgb, var(--color-brand) 15%, transparent)",
                        color: "var(--color-brand)",
                      }
                    : undefined
                }
                onClick={() => setView("grid")}
                aria-label="Xem dạng lưới"
              >
                <FiGrid />
              </button>
              <button
                className={`p-2 rounded-lg transition-all text-lg ${
                  view === "list"
                    ? "shadow"
                    : "text-text-muted hover:bg-surface-50"
                }`}
                style={
                  view === "list"
                    ? {
                        background:
                          "color-mix(in srgb, var(--color-brand) 15%, transparent)",
                        color: "var(--color-brand)",
                      }
                    : undefined
                }
                onClick={() => setView("list")}
                aria-label="Xem dạng bảng"
              >
                <FiList />
              </button>
            </div>

            {/* Select All Button */}
            <div className="bg-white rounded-xl px-1 py-1 shadow-sm border border-border">
              <button
                aria-label="Chọn tất cả"
                title={
                  allItems.length > 0 &&
                  allItems.every((item) =>
                    selectedItems.find((i) => i.id === item.id)
                  )
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"
                }
                className="p-2 rounded-lg transition focus:outline-none focus:ring-2"
                style={{
                  color:
                    allItems.length > 0 &&
                    allItems.every((item) =>
                      selectedItems.find((i) => i.id === item.id)
                    )
                      ? "var(--color-danger-500)"
                      : "var(--color-brand)",
                  background:
                    allItems.length > 0 &&
                    allItems.every((item) =>
                      selectedItems.find((i) => i.id === item.id)
                    )
                      ? "color-mix(in srgb, var(--color-danger) 10%, transparent)"
                      : undefined,
                  boxShadow:
                    allItems.length > 0 &&
                    allItems.every((item) =>
                      selectedItems.find((i) => i.id === item.id)
                    )
                      ? "none"
                      : undefined,
                }}
                onClick={() => {
                  const allSelected =
                    allItems.length > 0 &&
                    allItems.every((item) =>
                      selectedItems.find((i) => i.id === item.id)
                    );
                  if (allSelected) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(allItems);
                  }
                }}
              >
                <BiSelectMultiple />
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb - Only show when there are items or in a folder */}
        {(allItems.length > 0 || currentFolderId !== null || folderStack.length > 0) && (
          <div className="w-full mb-2" style={{ minHeight: "28px" }}>
            <Breadcrumb
              items={getBreadcrumbItems()}
              onItemClick={handleBreadcrumbClick}
            />
          </div>
        )}

        {/* Main content area */}
        <div className="w-full">
          {loading ? (
            <>
              {view === "list" ? (
                <SkeletonTable rows={8} />
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-border"
                    >
                      <Skeleton
                        circle
                        width={48}
                        height={48}
                        className="mb-2"
                      />
                      <Skeleton width={80} height={18} className="mb-1" />
                      <Skeleton width={60} height={14} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : allItems.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              <EmptyState message="Không có file nào trong thùng rác" />
            </div>
          ) : (
            <>
              {view === "grid" ? (
                <>
                  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {allItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.type === "folder" && handleFolderClick(item)}
                        className={item.type === "folder" ? "cursor-pointer" : ""}
                      >
                        <CardDelete
                          data={item}
                          selectedItems={selectedItems}
                          onSelectItem={handleSelectItem}
                          onRestore={handleRestoreSingle}
                          onPermanentDelete={handlePermanentDelete}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-sm text-text-muted">
                        Trang {page} / {totalPages} ({total} mục)
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-surface-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={
                              allItems.length > 0 &&
                              allItems.every((item) =>
                                selectedItems.find((i) => i.id === item.id)
                              )
                            }
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4"
                          />
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold text-text-strong cursor-pointer hover:bg-surface-100 select-none"
                          onClick={() => handleTableSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Tên
                            {getSortIcon("name")}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-strong">
                          Loại
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold text-text-strong cursor-pointer hover:bg-surface-100 select-none"
                          onClick={() => handleTableSort("date")}
                        >
                          <div className="flex items-center gap-2">
                            Ngày xóa
                            {getSortIcon("date")}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold text-text-strong cursor-pointer hover:bg-surface-100 select-none"
                          onClick={() => handleTableSort("daysLeft")}
                        >
                          <div className="flex items-center gap-2">
                            Còn lại
                            {getSortIcon("daysLeft")}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-strong">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allItems.map((item) => {
                        const checked = !!selectedItems.find(
                          (i) => i.id === item.id
                        );
                        const daysLeft = item.daysLeft || getDaysUntilPermanentDelete(
                          item.deletedAt || item.date
                        );
                        return (
                          <tr
                            key={item.id}
                            className={`border-t border-border hover:bg-surface-50 ${
                              checked ? "bg-brand-50" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleSelectItem(item)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td
                              className={`px-4 py-3 text-sm text-text-strong ${
                                item.type === "folder" ? "cursor-pointer hover:text-brand" : ""
                              }`}
                              onClick={() => item.type === "folder" && handleFolderClick(item)}
                            >
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-muted">
                              {item.type === "folder" ? "Thư mục" : "File"}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-muted">
                              {formatDate(item.deletedAt || item.date)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {daysLeft > 0 ? (
                                <span className="text-orange-600 font-medium">
                                  {daysLeft} ngày
                                </span>
                              ) : (
                                <span className="text-red-600 font-medium">
                                  Sắp xóa
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRestoreSingle(item)}
                                  className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Khôi phục"
                                >
                                  <FiRotateCw size={18} />
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(item)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Xóa vĩnh viễn"
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
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-sm text-text-muted">
                        Trang {page} / {totalPages} ({total} mục)
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Zone */}
      <ActionZone
        isMobile={isMobile}
        selectedItems={selectedItems}
        draggedItems={[]}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        showRestore={true}
        showPermanentDelete={true}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({ open: false, title: "", message: "", onConfirm: null, loading: false })
        }
        onConfirm={confirmDialog.onConfirm}
        loading={confirmDialog.loading}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />

      {/* Permanent Delete Status */}
      {permanentDeleteBatches.map((batch, idx) => (
        <MiniStatus
          key={batch.id}
          batchType="delete"
          batchId={batch.id}
          moveItems={batch.items}
          onComplete={(result) => {
            setPermanentDeleteBatches((prev) => prev.filter((b) => b.id !== batch.id));
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
