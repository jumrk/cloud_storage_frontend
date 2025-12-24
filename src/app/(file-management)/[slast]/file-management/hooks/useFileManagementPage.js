"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import useHomeTableActions from "@/features/file-management/hooks/useHomeTableActions";
import FileManagementService from "../../../../../features/file-management/services/fileManagementService";
import {
  getFavorites as fetchFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
} from "@/features/file-management/services/favoriteService";

const useFileManagementPage = () => {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  const tokenRef = useRef(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize with default "grid" to avoid hydration mismatch
  const [viewMode, setViewModeState] = useState("grid");
  
  // Load view preference from localStorage after mount (client-side only)
  // Wait for isMobile to be set before loading
  useEffect(() => {
    if (typeof window !== "undefined" && !isMobile) {
      const saved = localStorage.getItem("fileManagementViewMode");
      if (saved === "list" || saved === "grid") {
        setViewModeState(saved);
      }
    }
  }, [isMobile]); // Run when isMobile is determined
  
  // Wrapper function to save to localStorage and update state
  const setViewMode = useCallback((mode) => {
    if (typeof window !== "undefined" && !isMobile) {
      localStorage.setItem("fileManagementViewMode", mode);
    }
    setViewModeState(mode);
  }, [isMobile]);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderHistory, setFolderHistory] = useState([]); // Array of { id, name }
  const [openImport, setOpenImport] = useState(false);
  const [uploadBatches, setUploadBatches] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasFetched, setHasFetched] = useState(false); // Track if data has been fetched at least once
  const limit = 20;

  const [currentFolderId, setCurrentFolderId] = useState(null);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [pendingMoveItems, setPendingMoveItems] = useState([]);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);

  const [showGrantPermissionModal, setShowGrantPermissionModal] =
    useState(false);
  const [grantPermissionTarget, setGrantPermissionTarget] = useState(null);

  const [filter, setFilter] = useState({
    type: "all",
    memberId: null,
    fileType: null,
    sortBy: "none", // none, name, size, date
    showFavorites: false,
  });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);

  const tableActions = useHomeTableActions({ data, setData });
  const favoriteAbortRef = useRef(null);
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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Force grid view on mobile, restore from localStorage when switching to desktop
  useEffect(() => {
    if (isMobile) {
      // Force grid view on mobile
      if (viewMode !== "grid") {
        setViewModeState("grid");
      }
    } else {
      // Restore from localStorage when switching to desktop
      const saved = localStorage.getItem("fileManagementViewMode");
      if (saved === "list" || saved === "grid") {
        setViewModeState(saved);
      }
    }
  }, [isMobile]);

  const acRef = useRef(null);
  const fetchData = useCallback(
    async (pageNum = 1) => {
      acRef.current?.abort?.();
      acRef.current = new AbortController();
      const signal = acRef.current.signal;

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const json = await api.getUploads(
          { page: pageNum, limit, parentId: currentFolderId ?? null },
          tokenRef.current,
          signal
        );

        const files = (json.files || []).map((f) => ({
          id: f._id ? String(f._id) : String(f.id),
          name: f.originalName || f.name,
          type: "file",
          size: f.size,
          date: f.createdAt || f.date,
          folderId: f.folderId ? String(f.folderId) : null,
          permissions: f.permissions || [],
          extension: f.originalName
            ? f.originalName.split(".").pop()?.toLowerCase()
            : undefined,
          mimeType: f.mimeType,
          url: f.url,
          driveUrl: f.driveUrl,
          tempDownloadUrl: f.tempDownloadUrl,
          tempFileStatus: f.tempFileStatus,
          _id: f._id,
          originalName: f.originalName,
        }));

        const folders = (json.folders || []).map((f) => ({
          id: f._id ? String(f._id) : String(f.id),
          name: f.name,
          type: "folder",
          size: 0,
          date: f.createdAt || f.date,
          parentId: f.parentId ? String(f.parentId) : null,
          permissions: f.permissions || [],
          _id: f._id,
          fileCount: f.fileCount || 0,
        }));

        if (pageNum === 1) {
          setData([...folders, ...files]);
          setLoading(false); // Set loading to false AFTER setting data
        } else {
          setData((prev) => [...prev, ...folders, ...files]);
          setLoadingMore(false);
        }

        setHasMore(pageNum < (json.totalPages || 1));
      } catch {
        if (pageNum === 1) {
          setData([]);
          setLoading(false); // Set loading to false even on error
        } else {
          setLoadingMore(false);
        }
      }
    },
    [api, currentFolderId]
  );

  // Set hasFetched to true when loading changes from true to false (first fetch completed)
  // This ensures data state is fully updated before showing empty state
  useEffect(() => {
    if (!loading && !hasFetched) {
      // Use a small delay to ensure React has flushed all state updates
      const timer = setTimeout(() => {
        setHasFetched(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, hasFetched]);

  // Debounce search and refetch data when searchTerm changes
  const searchDebounceRef = useRef(null);
  
  useEffect(() => {
    fetchData(page);
    return () => acRef.current?.abort?.();
  }, [fetchData, page]);

  // Set hasFetched to true when loading changes from true to false (first fetch completed)
  // This ensures data state is fully updated before showing empty state
  useEffect(() => {
    if (!loading && !hasFetched) {
      // Use a small delay to ensure React has flushed all state updates
      const timer = setTimeout(() => {
        setHasFetched(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, hasFetched]);


  // Track previous folder ID to avoid unnecessary resets
  const prevFolderIdRef = useRef(null);
  
  useEffect(() => {
    // Only reset if folder actually changed
    if (prevFolderIdRef.current !== currentFolderId) {
      prevFolderIdRef.current = currentFolderId;
      setPage(1);
      setHasFetched(false); // Reset hasFetched when folder changes to show loading skeleton
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  // Update folder names in history when data loads
  useEffect(() => {
    if (data.length > 0) {
      // Update all folder names in history from data
      setFolderHistory((h) => {
        return h.map((folderInfo) => {
          // Try to find folder in current data
          const folderData = data.find(
            (item) => item.type === "folder" && String(item.id || item._id) === String(folderInfo.id)
          );
          
          if (folderData && folderData.name) {
            // Save to ref
            folderNamesRef.current.set(String(folderInfo.id), folderData.name);
            return { ...folderInfo, name: folderData.name };
          }
          
          // If not in current data, try to get from ref
          const nameFromRef = folderNamesRef.current.get(String(folderInfo.id));
          if (nameFromRef && nameFromRef !== folderInfo.name) {
            return { ...folderInfo, name: nameFromRef };
          }
          
          return folderInfo;
        });
      });
      
      // Also update current folder name if it's in history
      if (currentFolderId) {
        const currentFolderData = data.find(
          (item) => item.type === "folder" && String(item.id || item._id) === String(currentFolderId)
        );
        
        if (currentFolderData && currentFolderData.name) {
          folderNamesRef.current.set(String(currentFolderId), currentFolderData.name);
          
          // If current folder is not in history, add it
          setFolderHistory((h) => {
            const isInHistory = h.some(f => String(f.id) === String(currentFolderId));
            if (!isInHistory && currentFolderId) {
              return [...h, { id: currentFolderId, name: currentFolderData.name }];
            }
            return h;
          });
        }
      }
    }
  }, [data, currentFolderId]);

  const resetAndReload = useCallback(() => {
    setPage(1);
    fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    const onScroll = () => {
      if (loadingMore || loading || !hasMore) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - (scrollY + windowHeight) < 200) setPage((p) => p + 1);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadingMore, loading, hasMore]);

  const handleStartUpload = useCallback((batches) => {
    const newBatches = (batches || []).map((batch) => ({
      ...batch,
      id: uuidv4(),
      useChunkedUpload:
        batch.type === "file" &&
        (batch.files || []).some((f) => f.size > 5 * 1024 * 1024),
    }));
    setUploadBatches((prev) => [...prev, ...newBatches]);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { batchId } = e.detail || {};
      setUploadBatches((prev) => prev.filter((b) => b.id !== batchId));
      resetAndReload();
    };
    window.addEventListener("d2m:upload-completed", handler);
    return () => window.removeEventListener("d2m:upload-completed", handler);
  }, [resetAndReload]);

  useEffect(() => {
    const ac = new AbortController();
    api
      .getMember(tokenRef.current, ac.signal)
      .then((json) => setMembers(json.members || []))
      .catch(() => setMembers([]));
    return () => ac.abort();
  }, [api]);

  const visibleFolders = useMemo(
    () =>
      data.filter(
        (item) =>
          item.type === "folder" &&
          ((item.parentId &&
            String(item.parentId) === String(currentFolderId)) ||
            (!item.parentId && !currentFolderId))
      ),
    [data, currentFolderId]
  );

  const visibleFiles = useMemo(
    () =>
      data.filter(
        (item) =>
          item.type === "file" &&
          ((item.folderId &&
            String(item.folderId) === String(currentFolderId)) ||
            (!item.folderId && !currentFolderId))
      ),
    [data, currentFolderId]
  );

  const filteredFolders = useMemo(() => {
    return data.filter((item) => {
      if (item.type !== "folder") return false;
      if (filter.memberId) {
        if (
          !Array.isArray(item.permissions) ||
          !item.permissions.some(
            (p) => String(p.memberId) === String(filter.memberId)
          )
        )
          return false;
      }
      return filter.type === "folder" || filter.type === "all";
    });
  }, [data, filter]);

  const filteredFiles = useMemo(() => {
    return data.filter((item) => {
      if (item.type !== "file") return false;
      if (filter.memberId) {
        if (
          !Array.isArray(item.permissions) ||
          !item.permissions.some(
            (p) => String(p.memberId) === String(filter.memberId)
          )
        )
          return false;
      }
      if (filter.type === "file" || filter.type === "all") {
        if (
          filter.fileType &&
          filter.fileType !== "all" &&
          item.extension !== filter.fileType &&
          item.mimeType !== filter.fileType
        )
          return false;
        // Apply favorite filter
        if (filter.showFavorites) {
          const resourceId = item._id || item.id;
          const resourceIdStr = resourceId ? String(resourceId) : null;
          if (!resourceIdStr || !favoriteIds.has(resourceIdStr)) {
            return false;
          }
        }
        return true;
      }
      return false;
    });
  }, [data, filter, favoriteIds]);

  const foldersBase =
    filter.type === "all" &&
    !filter.memberId &&
    (!filter.fileType || filter.fileType === "all")
      ? visibleFolders
      : filteredFolders;

  const filesBase =
    filter.type === "all" &&
    !filter.memberId &&
    (!filter.fileType || filter.fileType === "all")
      ? visibleFiles
      : filteredFiles;

  // Helper function to sort items
  const sortItems = useCallback((items) => {
    if (!filter.sortBy || filter.sortBy === "none") return items;
    
    const sorted = [...items];
    switch (filter.sortBy) {
      case "name":
        sorted.sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case "size":
        sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
        break;
      case "date":
        sorted.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || 0);
          const dateB = new Date(b.date || b.createdAt || 0);
          return dateB - dateA;
        });
        break;
      default:
        break;
    }
    return sorted;
  }, [filter.sortBy]);

  // Apply favorite filter to base results
  const foldersAfterFavoriteFilter = useMemo(() => {
    if (!filter.showFavorites) return foldersBase;
    // Folders typically don't have favorites, but check anyway
    return foldersBase.filter((item) => {
      const resourceId = item._id || item.id;
      if (!resourceId) return false;
      return favoriteIds.has(String(resourceId));
    });
  }, [foldersBase, filter.showFavorites, favoriteIds]);

  const filesAfterFavoriteFilter = useMemo(() => {
    if (!filter.showFavorites) return filesBase;
    return filesBase.filter((item) => {
      const resourceId = item._id || item.id;
      if (!resourceId) return false;
      return favoriteIds.has(String(resourceId));
    });
  }, [filesBase, filter.showFavorites, favoriteIds]);

  const searchLower = searchTerm.trim().toLowerCase();

  const foldersToShowFiltered = useMemo(() => {
    let result = searchLower
      ? foldersAfterFavoriteFilter.filter((f) =>
          (f.name || "").toLowerCase().includes(searchLower)
        )
      : foldersAfterFavoriteFilter;
    return sortItems(result);
  }, [foldersAfterFavoriteFilter, searchLower, sortItems]);

  const filesToShowFiltered = useMemo(() => {
    let result = searchLower
      ? filesAfterFavoriteFilter.filter((f) =>
          (f.name || "").toLowerCase().includes(searchLower)
        )
      : filesAfterFavoriteFilter;
    return sortItems(result);
  }, [filesAfterFavoriteFilter, searchLower, sortItems]);

  const handlePreview = useCallback((file) => {
    setPreviewFile(file);
    setPreviewUrl(file.url || "");
  }, []);

  const handleBack = useCallback(() => {
    setFolderHistory((h) => {
      const prev = h[h.length - 1];
      const newFolderId = prev?.id ?? null;
      setCurrentFolderId(newFolderId);
      return h.slice(0, -1);
    });
  }, []);

  // Store folder names in a ref to preserve them even when data changes
  const folderNamesRef = useRef(new Map());

  // Update folder names when data loads
  useEffect(() => {
    data.forEach((item) => {
      if (item.type === "folder" && (item.id || item._id)) {
        const folderId = String(item.id || item._id);
        folderNamesRef.current.set(folderId, item.name || "Unknown");
      }
    });
  }, [data]);

  const handleFolderClick = useCallback(
    (folder) => {
      if (!folder?.id && !folder?._id) return;
      
      const folderId = String(folder.id || folder._id);
      const folderName = folder.name || "Unknown";
      
      // Don't navigate if clicking the same folder
      if (folderId === currentFolderId) {
        return;
      }
      
      // Save clicked folder name to ref immediately
      folderNamesRef.current.set(folderId, folderName);
      
      // Get current folder name from ref (preserved from previous data)
      let currentFolderName = "Unknown";
      
      if (currentFolderId) {
        // Try to get from ref first (preserved from previous load)
        currentFolderName = folderNamesRef.current.get(String(currentFolderId)) || "Unknown";
        
        // If not in ref, try to find in current data (visible folders)
        if (currentFolderName === "Unknown") {
          const currentFolderData = visibleFolders.find(
            (item) => String(item.id || item._id) === String(currentFolderId)
          );
          if (currentFolderData) {
            currentFolderName = currentFolderData.name || "Unknown";
            // Save to ref for future use
            folderNamesRef.current.set(String(currentFolderId), currentFolderName);
          } else {
            // If still not found, try all data
            const currentFolderInAllData = data.find(
              (item) => item.type === "folder" && String(item.id || item._id) === String(currentFolderId)
            );
            if (currentFolderInAllData) {
              currentFolderName = currentFolderInAllData.name || "Unknown";
              folderNamesRef.current.set(String(currentFolderId), currentFolderName);
            }
          }
        }
      }
      
      // Update folder history - add current folder to history before navigating
      // But exclude currentFolderId from history if it's already there to avoid duplicate
      setFolderHistory((h) => {
        if (!currentFolderId) {
          return h; // No current folder, don't add anything
        }
        
        // Remove currentFolderId from history if it exists to avoid duplicate
        const filteredHistory = h.filter(item => String(item.id) !== String(currentFolderId));
        
        // Check if current folder is already the last item in filtered history
        const lastItem = filteredHistory[filteredHistory.length - 1];
        if (lastItem && String(lastItem.id) === String(currentFolderId)) {
          // Already in history as last item, don't add again
          return filteredHistory;
        }
        
        // Add current folder to history with proper name
        return [...filteredHistory, { id: currentFolderId, name: currentFolderName }];
      });
      
      // Update current folder
      setCurrentFolderId(folderId);
    },
    [currentFolderId, data, visibleFolders]
  );

  const navigateToFolder = useCallback((targetFolderId) => {
    if (targetFolderId === null) {
      // Navigate to root
      setCurrentFolderId(null);
      setFolderHistory([]);
    } else {
      // Find the index of target folder in history
      const index = folderHistory.findIndex(
        (item) => item && String(item.id) === String(targetFolderId)
      );
      if (index !== -1) {
        // Navigate to that folder by updating history and currentFolderId
        setCurrentFolderId(targetFolderId);
        setFolderHistory(folderHistory.slice(0, index + 1));
      }
    }
  }, [folderHistory]);

  const handleCreateFolder = useCallback(async () => {
    const name = (newFolderName || "").trim();
    if (!name) return;
    try {
      setLoading(true);
      await api.createFolder(
        { name, parentId: currentFolderId || null },
        tokenRef.current
      );
      toast.success(t("upload_status.create_folder_success"));
      setLoading(false);
      setShowCreateFolderModal(false);
      setNewFolderName("");
      resetAndReload();
    } catch (e) {
      toast.error(
        e?.response?.data?.error || t("upload_status.create_folder_failed")
      );
    } finally {
      setLoading(false);
    }
  }, [api, newFolderName, currentFolderId, resetAndReload, t]);

  const handleMoveItems = useCallback(
    async (items, targetFolderId) => {
      if (!items || items.length === 0 || typeof targetFolderId === "undefined")
        return;
      const mapped = items.map((it) => ({
        id: it._id || it.id,
        type: it.type,
        name: it.name || it.originalName,
      }));
      setUploadBatches((prev) => [
        ...prev,
        { id: uuidv4(), type: "move", items: mapped, targetFolderId },
      ]);
      tableActions.handleDragEnd?.();
      tableActions.setSelectedItems([]);
    },
    [tableActions]
  );

  const handleDeleteItems = useCallback(
    async (items) => {
      if (!items || items.length === 0) return;
      const mapped = items.map((it) => ({
        id: it._id || it.id,
        type: it.type,
        name: it.name || it.originalName,
      }));
      setUploadBatches((prev) => [
        ...prev,
        { id: uuidv4(), type: "delete", items: mapped },
      ]);
      tableActions.setSelectedItems([]);
    },
    [tableActions]
  );

  const handleShowMoveModal = useCallback((items) => {
    setPendingMoveItems(items);
    setShowMoveModal(true);
    setMoveTargetFolder(null);
  }, []);

  const handleConfirmMove = useCallback(() => {
    if (
      Array.isArray(pendingMoveItems) &&
      pendingMoveItems.length > 0 &&
      moveTargetFolder &&
      typeof moveTargetFolder.id !== "undefined"
    ) {
      handleMoveItems(pendingMoveItems, moveTargetFolder.id);
      setShowMoveModal(false);
      setTimeout(() => {
        setPendingMoveItems([]);
        setMoveTargetFolder(null);
        tableActions.handleDragEnd?.();
      }, 100);
    }
  }, [pendingMoveItems, moveTargetFolder, handleMoveItems, tableActions]);

  const handleGrantPermission = useCallback(
    (items) => {
      if (!items || items.length === 0) return;
      let target = items[0];
      if (target && !target._id && target.id)
        target = { ...target, _id: target.id };
      if (!target || !target._id) return;
      setGrantPermissionTarget(target);
      setShowGrantPermissionModal(true);
      tableActions.handleDragEnd?.();
    },
    [tableActions]
  );

  function getPreferredDownloadUrl(item) {
    if (item?.tempDownloadUrl && item?.tempFileStatus === "completed")
      return item.tempDownloadUrl;
    if (item?.driveUrl || item?.url) {
      const url = item.driveUrl || item.url;
      const m = url.match(/\/d\/([\w-]+)\//);
      return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : url;
    }
    if (item?._id) return `/api/download/file/${item._id}`;
    return null;
  }

  function isTempApi(url) {
    return (
      typeof url === "string" &&
      (url.startsWith("/api/download/temp/") ||
        url.startsWith("/api/download/file/"))
    );
  }

  const handleDownload = useCallback(
    async (items) => {
      if (!Array.isArray(items)) items = [items];
      for (const item of items) {
        const rawUrl = getPreferredDownloadUrl(item);
        if (!rawUrl) continue;

        if (isTempApi(rawUrl)) {
          try {
            const res = await api.downloadInternal(rawUrl, tokenRef.current);
            const cd = res.headers?.["content-disposition"] || "";
            const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
              cd
            );
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
          } catch {}
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
    },
    [api]
  );
  function toIdSet(selectedItems = []) {
    return new Set(
      selectedItems.map((x) => (typeof x === "string" ? x : x?.id))
    );
  }

  function dedupeById(arr = []) {
    const map = new Map();
    for (const it of arr) map.set(it.id, it);
    return Array.from(map.values());
  }

  function areAllVisibleSelected(
    selectedItems,
    foldersToShowFiltered = [],
    filesToShowFiltered = []
  ) {
    const visible = [...foldersToShowFiltered, ...filesToShowFiltered];
    if (visible.length === 0) return false;
    const sel = toIdSet(selectedItems);
    return visible.every((it) => sel.has(it.id));
  }

  const tableHeader = [
    t("file.table.name"),
    t("file.table.size"),
    t("file.table.fileCount"),
    t("file.table.date"),
    t("file.table.actions"),
  ];

  return {
    t,
    isSidebarOpen,
    isMobile,
    viewMode,
    showUploadDropdown,
    openImport,
    showUploadModal,
    showCreateFolderModal,
    newFolderName,
    data,
    loading,
    hasMore,
    loadingMore,
    currentFolderId,
    uploadBatches,
    filter,
    members,
    searchTerm,
    showMoveModal,
    moveTargetFolder,
    showGrantPermissionModal,
    grantPermissionTarget,
    previewFile,
    tableActions,
    foldersToShowFiltered,
    tableHeader,
    filesToShowFiltered,
    hasFetched,
    previewUrl,
    setSidebarOpen,
    setViewMode,
    setShowUploadDropdown,
    setShowUploadModal,
    setShowCreateFolderModal,
    setNewFolderName,
    setPage,
    resetAndReload,
    handleBack,
    handleFolderClick,
    navigateToFolder,
    folderNamesRef,
    setUploadBatches,
    handleStartUpload,
    setFilter,
    setSearchTerm,
    setShowMoveModal,
    setMoveTargetFolder,
    handleShowMoveModal,
    handleConfirmMove,
    handleMoveItems,
    handleDeleteItems,
    setShowGrantPermissionModal,
    handleGrantPermission,
    handleCreateFolder,
    setPreviewFile,
    handlePreview,
    handleDownload,
    favoriteIds,
    isItemFavorite,
    handleToggleFavorite,
    favoriteLoadingId,
    dedupeById,
    areAllVisibleSelected,
    setOpenImport,
    folderHistory,
  };
};

export default useFileManagementPage;
