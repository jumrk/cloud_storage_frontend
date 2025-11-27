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
      const ids = new Set(
        (response.favorites || []).map((item) =>
          String(item.resourceId || item.id)
        )
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

    // For single file, show download progress
    if (list.length === 1) {
      const item = list[0];
      const rawUrl = getPreferredDownloadUrl(item);
      if (!rawUrl) return;

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
            progress: 50,
          })),
        };
      });

      try {
        if (isTempApi(rawUrl)) {
          const res = await axiosClient.get(rawUrl, { responseType: "blob" });
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
        } else {
          const a = document.createElement("a");
          a.href = rawUrl;
          a.rel = "noopener";
          a.target = "_blank";
          a.download = item?.name || item?.originalName || "";
          document.body.appendChild(a);
          a.click();
          a.remove();

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
          }, 1500);
        }
      } catch (e) {
        setDownloadBatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: prev.files.map((f) => ({
              ...f,
              status: "error",
              error: e.message,
              progress: 0,
            })),
          };
        });

        setTimeout(() => {
          setDownloadBatch(null);
          toast.error("Tải xuống thất bại");
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

    for (const item of list) {
      const rawUrl = getPreferredDownloadUrl(item);
      if (!rawUrl) continue;

      if (isTempApi(rawUrl)) {
        try {
          const res = await axiosClient.get(rawUrl, { responseType: "blob" });
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
          toast.error("Tải xuống thất bại");
        }
        continue;
      }

      const a = document.createElement("a");
      a.href = rawUrl;
      a.rel = "noopener";
      a.target = "_blank";
      a.download = item?.name || item?.originalName || "";
      document.body.appendChild(a);
      a.click();
      a.remove();
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

    return result;
  }, [data, searchTerm, filter]);

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
