"use client";

import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import axiosClient from "@/shared/lib/axiosClient";
import useHomeTableActions from "@/features/file-management/hooks/useHomeTableActions";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  getFavorites as fetchFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
} from "@/features/file-management/services/favoriteService";

export default function useManagement() {
  const t = useTranslations();

  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [view, setView] = useState("grid");
  const [data, setData] = useState([]);
  const [uploadBatches, setUploadBatches] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [pendingMoveItems, setPendingMoveItems] = useState([]);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadBatch, setDownloadBatch] = useState(null);
  const downloadBatchIdRef = useRef(0);

  // Filter state
  const [filter, setFilter] = useState({
    type: "all",
    fileType: null,
    sortBy: "none", // none, name, size, date
    showFavorites: false,
  });

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);
  const favoriteAbortRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    try {
      favoriteAbortRef.current?.abort?.();
      favoriteAbortRef.current = new AbortController();
      const signal = favoriteAbortRef.current.signal;
      const response = await fetchFavorites(signal);
      // Handle both response.favorites and direct array response
      const favoritesList = response.favorites || response || [];
      const ids = new Set(
        favoritesList.map((item) => {
          // Prefer resourceId as it's the actual file/folder ID
          const id = item.resourceId || item.id;
          return id ? String(id) : null;
        }).filter(Boolean)
      );
      setFavoriteIds(ids);
    } catch (err) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
        return;
      }
      console.error("Failed to load favorites", err);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    return () => favoriteAbortRef.current?.abort?.();
  }, [loadFavorites]);

  const isItemFavorite = useCallback(
    (item) => {
      if (!item) return false;
      const resourceId = item._id || item.id;
      if (!resourceId) return false;
      return favoriteIds.has(String(resourceId));
    },
    [favoriteIds]
  );

  const handleToggleFavorite = useCallback(
    async (item) => {
      if (!item) return;
      const resourceId = item._id || item.id;
      if (!resourceId) return;
      if (item.type !== "file") {
        toast.error("Chỉ hỗ trợ yêu thích tệp");
        return;
      }
      const resourceIdStr = String(resourceId);
      const resourceType = "file";
      setFavoriteLoadingId(resourceIdStr);
      try {
        if (favoriteIds.has(resourceIdStr)) {
          await apiRemoveFavorite(resourceId, resourceType);
          toast.success("Đã xóa khỏi yêu thích");
        } else {
          await apiAddFavorite(resourceId, resourceType);
          toast.success("Đã thêm vào yêu thích");
        }
        await loadFavorites();
      } catch (err) {
        console.error("Failed to toggle favorite", err);
        toast.error("Không thể cập nhật yêu thích");
      } finally {
        setFavoriteLoadingId(null);
      }
    },
    [favoriteIds, loadFavorites]
  );

  const randomId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  const pushBatch = (batch) =>
    setUploadBatches((prev) => [...prev, { id: randomId(), ...batch }]);

  const findFolderById = (tree, id) => {
    for (const folder of tree) {
      if (String(folder._id) === String(id)) return folder;
      if (folder.children?.length) {
        const found = findFolderById(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const buildBreadcrumb = (tree, id, path = []) => {
    for (const folder of tree) {
      if (String(folder._id) === String(id))
        return [...path, { id: folder._id, name: folder.name }];
      if (folder.children?.length) {
        const res = buildBreadcrumb(folder.children, id, [
          ...path,
          { id: folder._id, name: folder.name },
        ]);
        if (res) return res;
      }
    }
    return null;
  };

  const fetchFolders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/api/member/folders");
      setFolders(res.data?.folders || []);
    } catch (e) {
      setError(t("member.page.load_folders_error"));
    }
    setLoading(false);
  };

  const tableActions = useHomeTableActions({ data, setData });

  const handleStartUpload = (batches) => {
    const enhanced = (batches || []).map((batch) => ({
      ...batch,
      id: randomId(),
      useChunkedUpload:
        batch.type === "file" &&
        (batch.files || []).some((f) => f.size > 5 * 1024 * 1024),
    }));
    setUploadBatches((prev) => [...prev, ...enhanced]);
    setShowUpload(false);
  };

  const queueCreateFolder = () => {
    const name = (newFolderName || "").trim();
    if (!name) return;
    pushBatch({
      type: "create_folder",
      folderName: name,
      name,
      parentId: currentFolder ?? null,
    });
    setShowCreateFolder(false);
    setNewFolderName("");
  };

  const openMoveModal = (items) => {
    if (!items || !items.length) return;
    setPendingMoveItems(items);
    setShowMoveModal(true);
    setMoveTargetFolder(null);
  };

  const handleMoveItems = (items, targetFolderId) => {
    if (Array.isArray(items) && targetFolderId !== undefined) {
      pushBatch({
        type: "move",
        targetFolderId: targetFolderId ?? null,
        items: items.map((item) => ({
          id: item.id || item._id,
          type: item.type === "folder" ? "folder" : "file",
          name: item.name || item.originalName,
        })),
      });
      tableActions.setSelectedItems([]);
      return;
    }
    openMoveModal(items);
  };

  const handleConfirmMove = () => {
    if (!moveTargetFolder) return;
    pushBatch({
      type: "move",
      targetFolderId: moveTargetFolder.id ?? null,
      items: pendingMoveItems.map((item) => ({
        id: item.id || item._id,
        type: item.type === "folder" ? "folder" : "file",
        name: item.name || item.originalName,
      })),
    });
    setShowMoveModal(false);
    setPendingMoveItems([]);
    setMoveTargetFolder(null);
    tableActions.setSelectedItems([]);
  };

  const handleDelete = (items) => {
    const list =
      Array.isArray(items) && items.length ? items : tableActions.selectedItems;
    if (!list || !list.length) return;
    pushBatch({
      type: "delete",
      items: list.map((item) => ({
        id: item.id || item._id,
        type: item.type === "folder" ? "folder" : "file",
        name: item.name || item.originalName,
      })),
    });
    tableActions.setSelectedItems([]);
  };

  function getPreferredDownloadUrl(item) {
    if (item?.tempDownloadUrl && item?.tempFileStatus === "completed")
      return item.tempDownloadUrl;
    const u = item?.driveUrl || item?.url;
    if (u) {
      const m1 = u.match(/\/d\/([\w-]{10,})\//);
      if (m1) return `https://drive.google.com/uc?export=download&id=${m1[1]}`;
      const m2 = u.match(/[?&]id=([\w-]{10,})/);
      if (m2) return `https://drive.google.com/uc?export=download&id=${m2[1]}`;
      return u;
    }
    if (item?._id || item?.id)
      return `/api/download/file/${item._id || item.id}`;
    return null;
  }

  function isTempApi(url) {
    return (
      typeof url === "string" &&
      (url.startsWith("/api/download/temp/") ||
        url.startsWith("/api/download/file/"))
    );
  }

  const handleDownload = async (items) => {
    // Handle single item (from table row click) or array of items
    let list;
    if (Array.isArray(items)) {
      list = items.length ? items : tableActions.selectedItems;
    } else if (items && (items.id || items._id)) {
      // Single item passed (e.g., from table row download button)
      list = [items];
    } else {
      list = tableActions.selectedItems;
    }
    
    if (!list || !list.length) return;

    // Filter out folders - only download files
    const filesOnly = list.filter(item => item.type === "file");
    if (!filesOnly.length) {
      toast.error("Chỉ có thể tải xuống file, không thể tải xuống thư mục");
      return;
    }

    // For single file, show download progress
    if (filesOnly.length === 1) {
      const item = filesOnly[0];
      if (!item._id && !item.id) {
        toast.error("Không thể tải xuống file này");
        return;
      }

      // Always use API endpoint for downloads
      const downloadUrl = `/api/download/file/${item._id || item.id}`;

      // Create batch download for progress tracking
      const batchId = `member-download-${Date.now()}-${++downloadBatchIdRef.current}`;
      setDownloadBatch({
        batchId,
        files: [{
          name: item?.name || item?.originalName || "download",
          id: item._id || item.id,
          size: item.size || 0,
          status: "pending",
          progress: 0,
        }],
        folderName: null,
        status: "downloading",
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update to downloading status
      setDownloadBatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map((f) => ({
            ...f,
            status: "downloading",
            progress: 0,
          })),
        };
      });

      // For large files, show a simulated progress to indicate processing
      const fileSize = item.size || 0;
      const isLargeFile = fileSize > 100 * 1024 * 1024; // > 100MB
      let simulatedProgressInterval = null;
      
      if (isLargeFile) {
        // Simulate initial progress (0-5%) to show that download is starting
        let simulatedProgress = 0;
        simulatedProgressInterval = setInterval(() => {
          simulatedProgress = Math.min(simulatedProgress + 0.5, 5);
          setDownloadBatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map((f) => ({
                ...f,
                progress: simulatedProgress,
              })),
            };
          });
          if (simulatedProgress >= 5) {
            clearInterval(simulatedProgressInterval);
          }
        }, 200);
      }

      try {
        const res = await axiosClient.get(downloadUrl, {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            // Clear simulated progress when real progress starts
            if (simulatedProgressInterval) {
              clearInterval(simulatedProgressInterval);
              simulatedProgressInterval = null;
            }
            
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setDownloadBatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: prev.files.map((f) => ({
                    ...f,
                    progress: percentCompleted,
                  })),
                };
              });
            } else if (progressEvent.loaded > 0 && fileSize > 0) {
              // Fallback: calculate progress from loaded bytes and known file size
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / fileSize
              );
              setDownloadBatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: prev.files.map((f) => ({
                    ...f,
                    progress: Math.min(percentCompleted, 99), // Cap at 99% until complete
                  })),
                };
              });
            }
          },
        });
        const cd = res.headers?.["content-disposition"] || "";
        const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
        const headerName = decodeURIComponent(m?.[1] || m?.[2] || "");
        const fileName =
          headerName || item?.name || item?.originalName || "download";

        const objectUrl = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);

        setDownloadBatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: prev.files.map((f) => ({
              ...f,
              status: "success",
              progress: 100,
            })),
          };
        });

        setTimeout(() => {
          setDownloadBatch(null);
          toast.success("Tải xuống thành công!");
        }, 1500);
      } catch (e) {
        const errorMsg = e?.response?.data?.error || e.message || "Lỗi tải xuống";
        setDownloadBatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: prev.files.map((f) => ({
              ...f,
              status: "error",
              error: errorMsg,
              progress: 0,
            })),
          };
        });

        setTimeout(() => {
          setDownloadBatch(null);
          toast.error(errorMsg);
        }, 2000);
      }
      return;
    }

    // Multiple files - download one by one
    const getNameFromCD = (cd = "") => {
      const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
      const raw = decodeURIComponent(m?.[1] || m?.[2] || "");
      return raw || "download";
    };

    for (const item of filesOnly) {
      if (!item._id && !item.id) continue;
      
      // Always use API endpoint for downloads
      const downloadUrl = `/api/download/file/${item._id || item.id}`;

      try {
        const res = await axiosClient.get(downloadUrl, { responseType: "blob" });
        const cd = res.headers?.["content-disposition"] || "";
        const headerName = getNameFromCD(cd);
        const fileName =
          headerName || item?.name || item?.originalName || "download";

        const objectUrl = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        toast.error(`Tải xuống thất bại: ${item?.name || item?.originalName || "file"}`);
      }
    }
  };

  const tableHeader = [
    t("member.table.name"),
    t("member.table.size"),
    t("member.table.date"),
    t("member.table.share"),
  ];

  const handlePreview = useCallback((file) => {
    setPreviewFile(file);
    setPreviewUrl(file.url || "");
  }, []);

  // Filter data based on search and filter
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    const searchLower = searchTerm.trim().toLowerCase();
    if (searchLower) {
      result = result.filter((item) =>
        (item.name || "").toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filter.type !== "all") {
      result = result.filter((item) => item.type === filter.type);
    }

    // Apply file type filter
    if (filter.fileType && filter.fileType !== "all") {
      result = result.filter((item) => {
        if (item.type !== "file") return filter.type === "all";
        const ext = item.name?.split(".").pop()?.toLowerCase();
        return ext === filter.fileType || item.mimeType === filter.fileType;
      });
    }

    // Apply favorite filter
    if (filter.showFavorites) {
      result = result.filter((item) => {
        const resourceId = item._id || item.id;
        if (!resourceId) return false;
        return favoriteIds.has(String(resourceId));
      });
    }

    // Apply sorting
    if (filter.sortBy && filter.sortBy !== "none") {
      result = [...result];
      switch (filter.sortBy) {
        case "name":
          result.sort((a, b) => {
            const nameA = (a.name || "").toLowerCase();
            const nameB = (b.name || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;
        case "size":
          result.sort((a, b) => (b.size || 0) - (a.size || 0));
          break;
        case "date":
          result.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0);
            const dateB = new Date(b.date || b.createdAt || 0);
            return dateB - dateA;
          });
          break;
        default:
          break;
      }
    }

    return result;
  }, [data, searchTerm, filter, favoriteIds]);

  const renderFolderTree = (list, level = 0) =>
    list
      .filter((f) => f._id !== undefined)
      .map((folder) => (
        <React.Fragment key={folder._id}>
          <div
            className={`p-2 rounded cursor-pointer mb-1 ${
              moveTargetFolder && moveTargetFolder.id === folder._id
                ? "bg-blue-200"
                : "hover:bg-blue-100"
            }`}
            style={{ paddingLeft: 16 * level }}
            onClick={() =>
              setMoveTargetFolder({ id: folder._id, name: folder.name })
            }
          >
            📁 {folder.name}
          </div>
          {folder.children?.length &&
            renderFolderTree(folder.children, level + 1)}
        </React.Fragment>
      ));

  return {
    t,
    folders,
    loading,
    error,
    currentFolder,
    breadcrumb,
    view,
    data,
    filteredData,
    uploadBatches,
    showUpload,
    showCreateFolder,
    newFolderName,
    showMoveModal,
    moveTargetFolder,
    tableActions,
    tableHeader,
    previewFile,
    previewUrl,
    isMobile,
    isSidebarOpen,
    searchTerm,
    filter,
    downloadBatch,
    favoriteIds,
    favoriteLoadingId,
    setPreviewFile,
    handlePreview,
    findFolderById,
    setCurrentFolder,
    setBreadcrumb,
    setView,
    setData,
    setUploadBatches,
    setShowUpload,
    setShowCreateFolder,
    setNewFolderName,
    setShowMoveModal,
    setMoveTargetFolder,
    setSidebarOpen,
    setSearchTerm,
    setFilter,
    setDownloadBatch,
    buildBreadcrumb,
    fetchFolders,
    handleStartUpload,
    queueCreateFolder,
    openMoveModal,
    handleMoveItems,
    handleConfirmMove,
    handleDelete,
    handleDownload,
    renderFolderTree,
    isItemFavorite,
    handleToggleFavorite,
  };
}
