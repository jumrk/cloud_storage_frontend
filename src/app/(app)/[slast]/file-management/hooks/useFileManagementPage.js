"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import axiosClient from "@/shared/lib/axiosClient";
import useHomeTableActions from "@/features/file-management/hooks/useHomeTableActions";
import FileManagementService from "../../../../../features/file-management/services/fileManagementService";
import {
  getFavorites as fetchFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
} from "@/features/file-management/services/favoriteService";
import useSocket from "@/shared/lib/useSocket";

const useFileManagementPage = ({
  userRole = null,
  isLeader = false,
  isMember = false,
} = {}) => {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  const tokenRef = useRef(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );

  // Setup WebSocket for real-time updates
  const socketRef = useSocket(tokenRef.current);

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
  const setViewMode = useCallback(
    (mode) => {
      if (typeof window !== "undefined" && !isMobile) {
        localStorage.setItem("fileManagementViewMode", mode);
      }
      setViewModeState(mode);
    },
    [isMobile]
  );
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
  // Cache for folder data to avoid re-fetching when navigating back
  const folderDataCache = useRef(new Map()); // key: folderId (null for root), value: { data, timestamp }
  const isRestoringFromCache = useRef(false); // Flag to prevent fetchData when restoring from cache
  const loadFavorites = useCallback(async () => {
    try {
      favoriteAbortRef.current?.abort?.();
      favoriteAbortRef.current = new AbortController();
      const signal = favoriteAbortRef.current.signal;
      const response = await fetchFavorites(signal);
      // Handle both response.favorites and direct array response
      const favoritesList = response.favorites || response || [];
      const ids = new Set(
        favoritesList
          .map((item) => {
            // Prefer resourceId as it's the actual file/folder ID
            const id = item.resourceId || item.id;
            return id ? String(id) : null;
          })
          .filter(Boolean)
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

  // Helper function to find folder by ID in nested structure
  const findFolderById = useCallback((folders, folderId) => {
    if (!folderId) return null;
    for (const folder of folders) {
      if (String(folder._id) === String(folderId)) {
        return folder;
      }
      if (folder.children && folder.children.length > 0) {
        const found = findFolderById(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const fetchData = useCallback(
    async (pageNum = 1, forceRefresh = false) => {
      // Check cache first (only for page 1 and if not forcing refresh)
      // Use currentFolderId from closure to get the correct folder
      const folderIdForCache = currentFolderId || "root";
      // Check cache first (for any page, not just page 1)
      if (!forceRefresh) {
        const cached = folderDataCache.current.get(folderIdForCache);
        if (cached) {
          // If requesting page 1, restore all cached data
          if (pageNum === 1) {
            isRestoringFromCache.current = true;
            // Set data first, then other states to avoid empty state flash
            setData(cached.data);
            setHasMore(cached.hasMore || false);
            setLoading(false);
            setLoadingMore(false);
            // Always delay hasFetched to ensure data is rendered first
            // This prevents the empty state flash
            setTimeout(() => {
              setHasFetched(true);
            }, 100);
            // Reset flag after state updates
            setTimeout(() => {
              isRestoringFromCache.current = false;
            }, 150);
            return; // Skip fetching
          } else {
            // If requesting page > 1, check if cached data already has enough items
            // Calculate expected item count: we need at least (pageNum - 1) * limit items
            // to have already loaded this page
            const expectedMinItems = (pageNum - 1) * limit;
            if (cached.data.length > expectedMinItems) {
              // We already have data beyond this page, skip fetching to avoid duplicates
              setLoadingMore(false);
              // Make sure current data state matches cached data
              if (data.length < cached.data.length) {
                setData(cached.data);
              }
              return;
            }
          }
        }
      }

      acRef.current?.abort?.();
      acRef.current = new AbortController();
      const signal = acRef.current.signal;

      if (pageNum === 1) {
        setLoading(true);
        setLoadingMore(false); // Reset loadingMore when starting new fetch
      } else {
        setLoadingMore(true);
      }

      try {
        let json;

        // Conditional API call based on role
        if (isMember) {
          // Member: Use /api/member/folders endpoint
          const res = await axiosClient.get("/api/member/folders", {
            signal,
            headers: tokenRef.current
              ? { Authorization: `Bearer ${tokenRef.current}` }
              : {},
          });

          const foldersTree = res.data?.folders || [];

          // If currentFolderId is set, get children from that folder
          // Otherwise, get root folders
          let sourceItems = foldersTree;
          if (currentFolderId) {
            const targetFolder = findFolderById(foldersTree, currentFolderId);
            if (targetFolder) {
              sourceItems = targetFolder.children || [];
            } else {
              // Folder not found, return empty
              console.warn(
                `Folder with ID ${currentFolderId} not found in folders tree`
              );
              sourceItems = [];
            }
          }

          // Separate folders and files from sourceItems
          const sourceFolders = (sourceItems || []).filter(
            (item) => item.type === "folder" && !item.locked
          );
          const sourceFiles = (sourceItems || []).filter(
            (item) => item.type === "file" && !item.locked
          );

          // Transform member folders format to match leader format
          const folders = sourceFolders.map((f) => ({
            id: f._id ? String(f._id) : String(f.id),
            name: f.originalName || f.name,
            type: "folder",
            size: f.size || 0,
            date: f.createdAt || f.date,
            parentId: f.parentId
              ? String(f.parentId)
              : currentFolderId
              ? String(currentFolderId)
              : null,
            permissions: f.permissions || [],
            _id: f._id,
            fileCount: f.fileCount || 0,
            locked: f.locked,
            children: f.children || [],
            mimeType: f.mimeType,
            url: f.url,
            driveUrl: f.driveUrl,
            tempDownloadUrl: f.tempDownloadUrl,
            tempFileStatus: f.tempFileStatus,
          }));

          const files = sourceFiles.map((f) => ({
            id: f._id ? String(f._id) : String(f.id),
            name: f.originalName || f.name,
            type: "file",
            size: f.size,
            date: f.createdAt || f.date,
            folderId: f.folderId
              ? String(f.folderId)
              : currentFolderId
              ? String(currentFolderId)
              : null,
            permissions: f.permissions || [],
            extension: f.originalName
              ? f.originalName.split(".").pop()?.toLowerCase()
              : undefined,
            mimeType: f.mimeType,
            url: f.url,
            driveUrl: f.driveUrl,
            tempDownloadUrl: f.tempDownloadUrl,
            tempFileStatus: f.tempFileStatus,
            driveUploadStatus: f.driveUploadStatus,
            driveFileId: f.driveFileId,
            _id: f._id,
            originalName: f.originalName,
          }));

          json = {
            folders: folders,
            files: files,
            totalPages: 1,
            page: 1,
          };

          // For member, data is already transformed, set it directly
          const finalData = [...folders, ...files];
          if (pageNum === 1) {
            setData(finalData);
            setLoading(false);
            setLoadingMore(false); // Ensure loadingMore is false for first page
            // Cache the data for this folder
            folderDataCache.current.set(folderIdForCache, {
              data: finalData,
              hasMore: false,
              lastPage: pageNum,
              timestamp: Date.now(),
            });
          } else {
            setData((prev) => {
              const newData = [...prev, ...folders, ...files];
              // Update cache with accumulated data
              folderDataCache.current.set(folderIdForCache, {
                data: newData,
                hasMore: false,
                lastPage: pageNum,
                timestamp: Date.now(),
              });
              return newData;
            });
            setLoadingMore(false);
          }
          setHasMore(false); // Member API doesn't support pagination
          return; // Early return for member
        } else {
          // Leader: Use existing /api/upload endpoint
          json = await api.getUploads(
            { page: pageNum, limit, parentId: currentFolderId ?? null },
            tokenRef.current,
            signal
          );
        }

        // Transform leader API response
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
          driveUploadStatus: f.driveUploadStatus,
          driveFileId: f.driveFileId,
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

        const finalData = [...folders, ...files];
        const hasMoreData = pageNum < (json.totalPages || 1);
        if (pageNum === 1) {
          setData(finalData);
          setLoading(false); // Set loading to false AFTER setting data
          // Cache the data for this folder
          folderDataCache.current.set(folderIdForCache, {
            data: finalData,
            hasMore: hasMoreData,
            lastPage: pageNum,
            timestamp: Date.now(),
          });
        } else {
          setData((prev) => {
            const newData = [...prev, ...folders, ...files];
            // Update cache with accumulated data
            folderDataCache.current.set(folderIdForCache, {
              data: newData,
              hasMore: hasMoreData,
              lastPage: pageNum,
              timestamp: Date.now(),
            });
            return newData;
          });
          setLoadingMore(false);
        }

        setHasMore(hasMoreData);
      } catch (error) {
        // Ignore abort errors (they're expected when component unmounts or new request starts)
        if (error.name === "AbortError" || error.name === "CanceledError") {
          return;
        }
        console.error("Failed to fetch data:", error);
        if (pageNum === 1) {
          setData([]);
          setLoading(false); // Set loading to false even on error
          setLoadingMore(false); // Ensure loadingMore is also false
        } else {
          setLoadingMore(false);
        }
      }
    },
    [api, currentFolderId, isMember, findFolderById]
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
    // Skip fetchData if we're restoring from cache
    if (isRestoringFromCache.current) {
      return;
    }
    fetchData(page);
    return () => {
      // Only abort if controller exists and hasn't been aborted
      if (acRef.current && !acRef.current.signal.aborted) {
        acRef.current.abort();
      }
    };
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
      setLoadingMore(false); // Reset loadingMore when folder changes
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
            (item) =>
              item.type === "folder" &&
              String(item.id || item._id) === String(folderInfo.id)
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
          (item) =>
            item.type === "folder" &&
            String(item.id || item._id) === String(currentFolderId)
        );

        if (currentFolderData && currentFolderData.name) {
          folderNamesRef.current.set(
            String(currentFolderId),
            currentFolderData.name
          );

          // If current folder is not in history, add it
          setFolderHistory((h) => {
            const isInHistory = h.some(
              (f) => String(f.id) === String(currentFolderId)
            );
            if (!isInHistory && currentFolderId) {
              return [
                ...h,
                { id: currentFolderId, name: currentFolderData.name },
              ];
            }
            return h;
          });
        }
      }
    }
  }, [data, currentFolderId]);

  // Track which folders we've already restored uploads for
  const hasRestoredUploadsRef = useRef(new Set());

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    // Handle file upload
    const handleFileUploaded = (payload) => {
      // Support both old format (file, folderId) and new format (item, createdBy)
      const file = payload.file || payload.item;
      const folderId = payload.folderId || file?.folderId;
      const createdBy = payload.createdBy || payload.uploadedBy;
      const currentFolder = currentFolderId || "root";
      const itemParentId = folderId || file?.parentId || "root";

      // Only add if it's for the current folder and not created by current user (optimistic update already handled)
      // Get current user ID from token
      let currentUserId = null;
      try {
        if (tokenRef.current) {
          const tokenParts = tokenRef.current.split(".");
          if (tokenParts.length > 1) {
            const tokenData = JSON.parse(atob(tokenParts[1]));
            currentUserId = tokenData?.id || tokenData?.userId || null;
          }
        }
      } catch (e) {
        // Ignore token parsing errors
      }
      if (
        file &&
        String(itemParentId) === String(currentFolder) &&
        String(createdBy) !== String(currentUserId)
      ) {
        const fileData = {
          id: String(file._id || file.id),
          _id: file._id,
          name: file.originalName || file.name,
          originalName: file.originalName || file.name,
          type: file.type || "file",
          size: file.size,
          date: file.createdAt,
          folderId: file.folderId ? String(file.folderId) : null,
          parentId: file.parentId ? String(file.parentId) : null,
          permissions: file.permissions || [],
          mimeType: file.mimeType,
          url: file.url,
          driveUrl: file.driveUrl,
          tempDownloadUrl: file.tempDownloadUrl,
          tempFileStatus: file.tempFileStatus,
          driveUploadStatus: file.driveUploadStatus,
          driveFileId: file.driveFileId,
          extension: file.originalName
            ? file.originalName.split(".").pop()?.toLowerCase()
            : undefined,
        };

        setData((prevData) => {
          const exists = prevData.some(
            (item) => String(item.id || item._id) === String(fileData.id)
          );
          if (exists) {
            return prevData.map((item) =>
              String(item.id || item._id) === String(fileData.id)
                ? fileData
                : item
            );
          }
          return [fileData, ...prevData];
        });

        // Update cache
        const cacheKey = currentFolder;
        const cached = folderDataCache.current.get(cacheKey);
        if (cached) {
          folderDataCache.current.set(cacheKey, {
            ...cached,
            data: [fileData, ...cached.data],
            timestamp: Date.now(),
          });
        }
      }
    };

    // Handle Drive upload completed
    const handleDriveUploadCompleted = (payload) => {
      const { file, folderId } = payload;

      if (String(folderId || "root") === String(currentFolderId || "root")) {
        setData((prevData) => {
          return prevData.map((item) => {
            if (String(item.id || item._id) === String(file._id || file.id)) {
              return {
                ...item,
                url: file.url,
                driveUrl: file.driveUrl,
                driveUploadStatus: file.driveUploadStatus,
                driveFileId: file.driveFileId,
                tempDownloadUrl: file.tempDownloadUrl,
                tempFileStatus: file.tempFileStatus,
              };
            }
            return item;
          });
        });
      }
    };

    // Handle file/folder moved
    const handleFileMoved = (payload) => {
      const { item, oldFolderId, newFolderId } = payload;
      const currentFolder = currentFolderId || "root";

      // Remove from old folder if we're viewing it
      if (String(oldFolderId || "root") === String(currentFolder)) {
        setData((prevData) => {
          const updated = prevData.filter(
            (i) => String(i.id || i._id) !== String(item.id || item._id)
          );

          // Update cache
          const cacheKey = currentFolder;
          const cached = folderDataCache.current.get(cacheKey);
          if (cached) {
            folderDataCache.current.set(cacheKey, {
              ...cached,
              data: updated,
              timestamp: Date.now(),
            });
          }

          return updated;
        });
      }

      // Add to new folder if we're viewing it
      if (String(newFolderId || "root") === String(currentFolder)) {
        const itemData = {
          id: String(item._id || item.id),
          _id: item._id,
          name: item.name || item.originalName,
          originalName: item.name || item.originalName,
          type: item.type,
          size: item.size || 0,
          date: item.createdAt || item.date,
          folderId: item.folderId ? String(item.folderId) : null,
          parentId: item.parentId ? String(item.parentId) : null,
          permissions: item.permissions || [],
        };

        setData((prevData) => {
          const exists = prevData.some(
            (i) => String(i.id || i._id) === String(itemData.id)
          );
          if (exists) {
            return prevData.map((i) =>
              String(i.id || i._id) === String(itemData.id) ? itemData : i
            );
          }
          return [itemData, ...prevData];
        });
      }
    };

    // Handle file/folder deleted
    const handleFileDeleted = (payload) => {
      const { item } = payload;
      const currentFolder = currentFolderId || "root";

      // Remove from current folder if we're viewing it
      if (
        String(item.folderId || item.parentId || "root") ===
        String(currentFolder)
      ) {
        setData((prevData) => {
          const updated = prevData.filter(
            (i) => String(i.id || i._id) !== String(item.id || item._id)
          );

          // Update cache
          const cacheKey = currentFolder;
          const cached = folderDataCache.current.get(cacheKey);
          if (cached) {
            folderDataCache.current.set(cacheKey, {
              ...cached,
              data: updated,
              timestamp: Date.now(),
            });
          }

          return updated;
        });
      }
    };

    // Handle file/folder renamed
    const handleFileRenamed = (payload) => {
      const { item } = payload;
      const currentFolder = currentFolderId || "root";

      // Update in current folder if we're viewing it
      if (
        String(item.folderId || item.parentId || "root") ===
        String(currentFolder)
      ) {
        setData((prevData) => {
          return prevData.map((i) => {
            if (String(i.id || i._id) === String(item.id || item._id)) {
              return {
                ...i,
                name: item.name,
                originalName: item.name,
              };
            }
            return i;
          });
        });
      }
    };

    // Handle file/folder restored
    const handleFileRestored = (payload) => {
      const { item } = payload;
      const currentFolder = currentFolderId || "root";

      // Only add if we're viewing the parent folder
      const itemParentId = item.folderId || item.parentId || "root";
      if (String(itemParentId) === String(currentFolder)) {
        const itemData = {
          id: String(item._id || item.id),
          _id: item._id,
          name: item.name || item.originalName,
          originalName: item.name || item.originalName,
          type: item.type,
          size: item.size || 0,
          date: item.createdAt || item.date,
          folderId: item.folderId ? String(item.folderId) : null,
          parentId: item.parentId ? String(item.parentId) : null,
          permissions: item.permissions || [],
        };

        setData((prevData) => {
          const exists = prevData.some(
            (i) => String(i.id || i._id) === String(itemData.id)
          );
          if (exists) {
            return prevData.map((i) =>
              String(i.id || i._id) === String(itemData.id) ? itemData : i
            );
          }
          return [itemData, ...prevData];
        });

        // Update cache
        const cacheKey = currentFolder;
        const cached = folderDataCache.current.get(cacheKey);
        if (cached) {
          folderDataCache.current.set(cacheKey, {
            ...cached,
            data: [itemData, ...cached.data],
            timestamp: Date.now(),
          });
        }
      }
    };

    // Handle file/folder created (for folder creation)
    const handleFileCreated = (payload) => {
      const { item } = payload;
      const currentFolder = currentFolderId || "root";

      // Only add if we're viewing the parent folder
      if (String(item.parentId || "root") === String(currentFolder)) {
        const itemData = {
          id: String(item._id || item.id),
          _id: item._id,
          name: item.name,
          originalName: item.name,
          type: item.type,
          size: item.size || 0,
          date: item.createdAt || item.date,
          folderId: item.folderId ? String(item.folderId) : null,
          parentId: item.parentId ? String(item.parentId) : null,
          permissions: item.permissions || [],
        };

        setData((prevData) => {
          const exists = prevData.some(
            (i) => String(i.id || i._id) === String(itemData.id)
          );
          if (exists) {
            return prevData.map((i) =>
              String(i.id || i._id) === String(itemData.id) ? itemData : i
            );
          }
          return [itemData, ...prevData];
        });

        // Update cache
        const cacheKey = currentFolder;
        const cached = folderDataCache.current.get(cacheKey);
        if (cached) {
          folderDataCache.current.set(cacheKey, {
            ...cached,
            data: [itemData, ...cached.data],
            timestamp: Date.now(),
          });
        }
      }
    };

    // Handle permission granted event
    const handlePermissionGranted = (payload) => {
      const { folder } = payload;
      // Refresh folder list if user is viewing root or the parent folder
      const currentFolder = currentFolderId || "root";
      if (String(folder.parentId || "root") === String(currentFolder)) {
        // Invalidate cache and reload to show new folder
        const cacheKey = currentFolder;
        folderDataCache.current.delete(cacheKey);
        resetAndReload(true);
      }
    };

    // Register event listeners
    socket.on("file:uploaded", handleFileUploaded);
    socket.on("file:driveUploadCompleted", handleDriveUploadCompleted);
    socket.on("file:moved", handleFileMoved);
    socket.on("file:deleted", handleFileDeleted);
    socket.on("file:renamed", handleFileRenamed);
    socket.on("file:created", handleFileCreated);
    socket.on("file:restored", handleFileRestored);
    socket.on("file:permissionGranted", handlePermissionGranted);

    return () => {
      socket.off("file:uploaded", handleFileUploaded);
      socket.off("file:driveUploadCompleted", handleDriveUploadCompleted);
      socket.off("file:moved", handleFileMoved);
      socket.off("file:deleted", handleFileDeleted);
      socket.off("file:renamed", handleFileRenamed);
      socket.off("file:created", handleFileCreated);
      socket.off("file:restored", handleFileRestored);
      socket.off("file:permissionGranted", handlePermissionGranted);
    };
  }, [socketRef.current, currentFolderId]);

  const resetAndReload = useCallback(
    (forceRefresh = true) => {
      setPage(1);
      // Invalidate cache for current folder if force refresh
      if (forceRefresh) {
        const cacheKey = currentFolderId || "root";
        folderDataCache.current.delete(cacheKey);
      }
      fetchData(1, forceRefresh);
    },
    [fetchData, currentFolderId]
  );

  // Optimistically update data after move without refetching
  const updateDataAfterMove = useCallback(
    (movedItems, targetFolderId) => {
      if (!movedItems || movedItems.length === 0) return;

      // Get IDs of moved items
      const movedIds = new Set(
        movedItems.map((item) => String(item.id || item._id))
      );

      // Remove moved items from current data
      setData((prevData) => {
        const updatedData = prevData.filter(
          (item) => !movedIds.has(String(item.id || item._id))
        );

        // Update cache for current folder
        const cacheKey = currentFolderId || "root";
        const cached = folderDataCache.current.get(cacheKey);
        if (cached) {
          folderDataCache.current.set(cacheKey, {
            ...cached,
            data: updatedData,
            timestamp: Date.now(),
          });
        }

        return updatedData;
      });

      // Invalidate cache for target folder if different from current
      if (
        targetFolderId !== undefined &&
        String(targetFolderId) !== String(currentFolderId)
      ) {
        const targetCacheKey = targetFolderId || "root";
        folderDataCache.current.delete(targetCacheKey);
      }
    },
    [currentFolderId]
  );

  // Optimistically update data after delete without refetching
  const updateDataAfterDelete = useCallback(
    (deletedItems) => {
      if (!deletedItems || deletedItems.length === 0) return;

      // Get IDs of deleted items
      const deletedIds = new Set(
        deletedItems.map((item) => String(item.id || item._id))
      );

      // Remove deleted items from current data
      setData((prevData) => {
        const updatedData = prevData.filter(
          (item) => !deletedIds.has(String(item.id || item._id))
        );

        // Update cache for current folder
        const cacheKey = currentFolderId || "root";
        const cached = folderDataCache.current.get(cacheKey);
        if (cached) {
          folderDataCache.current.set(cacheKey, {
            ...cached,
            data: updatedData,
            timestamp: Date.now(),
          });
        }

        return updatedData;
      });
    },
    [currentFolderId]
  );

  // Update data directly from chat response (without reload)
  const updateDataFromChat = useCallback(
    (updatedData) => {
      if (!updatedData || !Array.isArray(updatedData)) return;

      // Update data state directly
      setData(updatedData);

      // Update cache for current folder
      const cacheKey = currentFolderId || "root";
      folderDataCache.current.set(cacheKey, {
        data: updatedData,
        hasMore: false,
        lastPage: 1,
        timestamp: Date.now(),
      });

      // Reset pagination
      setPage(1);
      setHasMore(false);
    },
    [currentFolderId]
  );

  // Add uploaded file to data state (optimistically)
  const addUploadedFile = useCallback(
    async (uploadId) => {
      if (!uploadId) return;

      try {
        // Try to get file immediately first (file should be created when last chunk is sent)
        let res = null;
        let retries = 0;
        const maxRetries = 3; // Reduced to 3 retries for faster response
        const retryDelay = 800; // 800ms between retries

        while (retries < maxRetries) {
          try {
            res = await axiosClient.get("/api/upload/file-by-upload-id", {
              params: { uploadId },
              headers: tokenRef.current
                ? { Authorization: `Bearer ${tokenRef.current}` }
                : {},
            });

            if (res.data?.success && res.data?.file) {
              break; // File found, exit retry loop
            }
          } catch (error) {
            // If 404, file might still be creating, retry
            if (error.response?.status === 404 && retries < maxRetries - 1) {
              retries++;
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
              continue;
            }
            // If other error, stop retrying and try fallback
            console.warn(
              "Failed to fetch uploaded file:",
              error.response?.status,
              error.response?.data?.error || error.message
            );
            break;
          }
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }

        // If still not found after retries, try to find it from the list API as fallback
        // This is especially important for member uploads where permission checks might delay file visibility
        if (!res?.data?.success || !res.data?.file) {
          console.log(
            `[addUploadedFile] File not found by uploadId (${uploadId}), trying to find from list API...`
          );
          try {
            // Wait a bit more before checking list API to ensure file is committed to DB
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Get the most recent files from the current folder
            const listRes = await axiosClient.get(
              isMember ? "/api/member/folders" : "/api/upload",
              {
                params: {
                  page: 1,
                  limit: 100, // Increased limit to find recently uploaded files
                  parentId: currentFolderId || null,
                },
                headers: tokenRef.current
                  ? { Authorization: `Bearer ${tokenRef.current}` }
                  : {},
              }
            );

            if (listRes.data?.success) {
              let allFiles = [];

              if (isMember) {
                // Member API returns different structure
                const sourceItems = listRes.data.sourceItems || [];
                allFiles = sourceItems
                  .filter((item) => item.type === "file")
                  .map((item) => ({
                    _id: item._id,
                    id: item._id,
                    originalName: item.name,
                    name: item.name,
                    size: item.size,
                    mimeType: item.mimeType,
                    createdAt: item.createdAt,
                    folderId: item.folderId,
                    url: item.url,
                    driveUrl: item.driveUrl,
                    tempDownloadUrl: item.tempDownloadUrl,
                    tempFileStatus: item.tempFileStatus,
                    driveUploadStatus: item.driveUploadStatus,
                    driveFileId: item.driveFileId,
                    permissions: item.permissions || [],
                  }));
              } else {
                allFiles = [
                  ...(listRes.data.files || []),
                  ...(listRes.data.folders || []),
                ];
              }

              // Find file by tempDownloadUrl (most recent file with matching tempDownloadUrl)
              const tempDownloadUrl = `/api/download/temp/${uploadId}`;
              let foundFile = allFiles.find(
                (f) =>
                  f.tempDownloadUrl === tempDownloadUrl ||
                  (f.tempDownloadUrl && f.tempDownloadUrl.includes(uploadId))
              );

              // If not found by exact match, try partial match (uploadId might have suffix)
              if (!foundFile) {
                // Extract base uploadId (remove last random part)
                const uploadIdParts = uploadId.split("-");
                if (uploadIdParts.length > 4) {
                  // Remove last part (random suffix like 'k0kf6ahef')
                  const baseUploadId = uploadIdParts.slice(0, -1).join("-");
                  foundFile = allFiles.find(
                    (f) =>
                      f.tempDownloadUrl &&
                      f.tempDownloadUrl.includes(baseUploadId)
                  );
                  if (foundFile) {
                    console.log(
                      `[addUploadedFile] Found file by partial uploadId match: ${foundFile._id}`
                    );
                  }
                }
              }

              // If still not found, try to find the most recently created file
              // This is a fallback for when tempDownloadUrl doesn't match (shouldn't happen but just in case)
              if (!foundFile && allFiles.length > 0) {
                // Sort by createdAt descending and take the first one (most recent)
                const sortedFiles = [...allFiles].sort((a, b) => {
                  const dateA = new Date(a.createdAt || 0).getTime();
                  const dateB = new Date(b.createdAt || 0).getTime();
                  return dateB - dateA;
                });

                // Check if the most recent file was created within the last 10 seconds
                const mostRecent = sortedFiles[0];
                if (mostRecent && mostRecent.createdAt) {
                  const fileAge =
                    Date.now() - new Date(mostRecent.createdAt).getTime();
                  const tenSeconds = 10 * 1000;
                  if (fileAge < tenSeconds) {
                    console.log(
                      `[addUploadedFile] Using most recent file as fallback: ${mostRecent._id} (created ${fileAge}ms ago)`
                    );
                    foundFile = mostRecent;
                  }
                }
              }

              if (foundFile) {
                console.log(
                  `[addUploadedFile] Found file from list API: ${foundFile._id}`
                );
                // Transform to match expected format
                res = {
                  data: {
                    success: true,
                    file: {
                      _id: foundFile._id || foundFile.id,
                      id: foundFile._id || foundFile.id,
                      originalName: foundFile.originalName || foundFile.name,
                      name: foundFile.originalName || foundFile.name,
                      size: foundFile.size,
                      mimeType: foundFile.mimeType,
                      createdAt: foundFile.createdAt,
                      folderId: foundFile.folderId,
                      url: foundFile.url,
                      driveUrl: foundFile.driveUrl,
                      tempDownloadUrl: foundFile.tempDownloadUrl,
                      tempFileStatus: foundFile.tempFileStatus,
                      driveUploadStatus: foundFile.driveUploadStatus,
                      driveFileId: foundFile.driveFileId,
                      permissions: foundFile.permissions || [],
                    },
                  },
                };
              } else {
                console.warn(
                  `[addUploadedFile] File not found in list API either. uploadId: ${uploadId}, tempDownloadUrl: ${tempDownloadUrl}, totalFiles: ${allFiles.length}`
                );
              }
            }
          } catch (listError) {
            console.warn(
              "[addUploadedFile] Failed to find file from list API:",
              listError
            );
          }
        }

        if (res?.data?.success && res.data?.file) {
          const file = res.data.file;

          // Transform to match data format
          const fileData = {
            id: String(file._id || file.id),
            _id: file._id,
            name: file.originalName || file.name,
            originalName: file.originalName || file.name,
            type: "file",
            size: file.size,
            date: file.createdAt,
            folderId: file.folderId ? String(file.folderId) : null,
            permissions: file.permissions || [],
            mimeType: file.mimeType,
            url: file.url,
            driveUrl: file.driveUrl,
            tempDownloadUrl: file.tempDownloadUrl,
            tempFileStatus: file.tempFileStatus,
            driveUploadStatus: file.driveUploadStatus,
            driveFileId: file.driveFileId,
            extension: file.originalName
              ? file.originalName.split(".").pop()?.toLowerCase()
              : undefined,
          };

          // Add file to data state
          setData((prevData) => {
            // Check if file already exists
            const exists = prevData.some(
              (item) => String(item.id || item._id) === String(fileData.id)
            );
            if (exists) {
              // Update existing file
              return prevData.map((item) =>
                String(item.id || item._id) === String(fileData.id)
                  ? fileData
                  : item
              );
            } else {
              // Add new file
              const updatedData = [fileData, ...prevData];

              // Update cache
              const cacheKey = currentFolderId || "root";
              const cached = folderDataCache.current.get(cacheKey);
              if (cached) {
                folderDataCache.current.set(cacheKey, {
                  ...cached,
                  data: updatedData,
                  timestamp: Date.now(),
                });
              }

              return updatedData;
            }
          });

          // Start polling for drive upload status if still pending
          if (file.driveUploadStatus === "pending") {
            startPollingFileStatus(fileData.id, uploadId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch uploaded file:", error);
      }
    },
    [currentFolderId, isMember]
  );

  // Polling mechanism to check drive upload status
  const fileStatusPollers = useRef(new Map()); // key: fileId, value: { intervalId, uploadId, fileId }

  const startPollingFileStatus = useCallback(
    (fileId, uploadId) => {
      // Clear existing poller if any
      if (fileStatusPollers.current.has(fileId)) {
        const existing = fileStatusPollers.current.get(fileId);
        clearInterval(existing.intervalId);
      }

      let pollCount = 0;
      const maxPollCount = 60; // Stop after 2 minutes (60 * 2 seconds)

      const pollInterval = setInterval(async () => {
        pollCount++;

        // Stop polling if max count reached
        if (pollCount > maxPollCount) {
          clearInterval(pollInterval);
          fileStatusPollers.current.delete(fileId);
          return;
        }

        try {
          // Try to get file by uploadId first (for files still being created)
          // If that fails, try by fileId (for files that already exist)
          let res = null;
          let file = null;

          // First try: by uploadId
          try {
            res = await axiosClient.get("/api/upload/file-by-upload-id", {
              params: { uploadId },
              headers: tokenRef.current
                ? { Authorization: `Bearer ${tokenRef.current}` }
                : {},
            });

            if (res.data?.success && res.data?.file) {
              file = res.data.file;
            }
          } catch (error) {
            // If 404, file might have been updated and tempDownloadUrl removed
            // Try to get file by fileId instead
            if (error.response?.status === 404 && fileId) {
              try {
                // Use the file list API to get file by ID
                const listRes = await axiosClient.get("/api/upload", {
                  params: {
                    page: 1,
                    limit: 1000,
                    parentId: currentFolderId || null,
                  },
                  headers: tokenRef.current
                    ? { Authorization: `Bearer ${tokenRef.current}` }
                    : {},
                });

                if (listRes.data?.success) {
                  const allFiles = [
                    ...(listRes.data.files || []),
                    ...(listRes.data.folders || []),
                  ];
                  file = allFiles.find(
                    (f) => String(f._id || f.id) === String(fileId)
                  );

                  if (file) {
                    // Transform to match expected format
                    file = {
                      _id: file._id || file.id,
                      id: file._id || file.id,
                      originalName: file.name || file.originalName,
                      name: file.name || file.originalName,
                      size: file.size,
                      mimeType: file.mimeType,
                      createdAt: file.createdAt,
                      folderId: file.folderId,
                      url: file.url,
                      driveUrl: file.driveUrl,
                      tempDownloadUrl: file.tempDownloadUrl,
                      tempFileStatus: file.tempFileStatus,
                      driveUploadStatus: file.driveUploadStatus,
                      driveFileId: file.driveFileId,
                      permissions: file.permissions || [],
                    };
                  }
                }
              } catch (listError) {
                // If still can't find, stop polling
                console.warn("Failed to find file by ID:", listError);
                clearInterval(pollInterval);
                fileStatusPollers.current.delete(fileId);
                return;
              }
            } else {
              // Other errors, stop polling
              console.error("Failed to poll file status:", error);
              clearInterval(pollInterval);
              fileStatusPollers.current.delete(fileId);
              return;
            }
          }

          if (file) {
            // Update file in data state
            setData((prevData) => {
              const updatedData = prevData.map((item) => {
                if (String(item.id || item._id) === String(fileId)) {
                  return {
                    ...item,
                    url: file.url || item.url,
                    driveUrl: file.driveUrl || item.driveUrl,
                    driveUploadStatus: file.driveUploadStatus,
                    driveFileId: file.driveFileId,
                    tempDownloadUrl:
                      file.tempDownloadUrl || item.tempDownloadUrl,
                    tempFileStatus: file.tempFileStatus,
                  };
                }
                return item;
              });

              // Update cache
              const cacheKey = currentFolderId || "root";
              const cached = folderDataCache.current.get(cacheKey);
              if (cached) {
                folderDataCache.current.set(cacheKey, {
                  ...cached,
                  data: updatedData,
                  timestamp: Date.now(),
                });
              }

              return updatedData;
            });

            // Stop polling if drive upload is completed
            if (file.driveUploadStatus === "completed") {
              clearInterval(pollInterval);
              fileStatusPollers.current.delete(fileId);
            }
          } else {
            // File not found, stop polling after a few more tries
            if (pollCount > 10) {
              clearInterval(pollInterval);
              fileStatusPollers.current.delete(fileId);
            }
          }
        } catch (error) {
          console.error("Failed to poll file status:", error);
          // Stop polling on error after a few retries
          if (pollCount > 5) {
            clearInterval(pollInterval);
            fileStatusPollers.current.delete(fileId);
          }
        }
      }, 2000); // Poll every 2 seconds

      fileStatusPollers.current.set(fileId, {
        intervalId: pollInterval,
        uploadId,
        fileId,
      });
    },
    [currentFolderId]
  );

  // Restore upload status for files that are still uploading to Drive
  // This handles the case when user reloads page while files are uploading
  // Run after data is loaded (either from API or cache)
  useEffect(() => {
    // Only restore when we have data and haven't restored for this folder yet
    const folderKey = currentFolderId || "root";
    if (
      !loading &&
      data &&
      data.length > 0 &&
      startPollingFileStatus &&
      !hasRestoredUploadsRef.current.has(folderKey)
    ) {
      // Mark this folder as restored
      hasRestoredUploadsRef.current.add(folderKey);

      // Find all files that are still uploading to Drive
      const uploadingFiles = data.filter(
        (item) =>
          item.type === "file" &&
          (item.driveUploadStatus === "pending" ||
            item.driveUploadStatus === "uploading") &&
          item.tempDownloadUrl
      );

      // Start polling for each uploading file
      uploadingFiles.forEach((file) => {
        // Extract uploadId from tempDownloadUrl (format: /api/download/temp/${uploadId})
        const uploadIdMatch = file.tempDownloadUrl.match(
          /\/api\/download\/temp\/(.+)/
        );
        if (uploadIdMatch && uploadIdMatch[1]) {
          const uploadId = uploadIdMatch[1];
          const fileId = file.id || file._id;

          // Check if polling is already active for this file
          if (!fileStatusPollers.current.has(fileId)) {
            console.log(
              `[Upload Recovery] Starting polling for file ${fileId} (uploadId: ${uploadId}) in folder ${folderKey}`
            );
            startPollingFileStatus(fileId, uploadId);
          }
        }
      });
    }
  }, [loading, data, currentFolderId, startPollingFileStatus]);

  // Clear restored flags when folder changes
  useEffect(() => {
    hasRestoredUploadsRef.current.clear();
  }, [currentFolderId]);

  // Batch function to add multiple uploaded files at once
  const addUploadedFilesBatch = useCallback(
    async (uploadIds) => {
      if (!uploadIds || uploadIds.length === 0) return;

      try {
        // Get the most recent files from the current folder immediately
        const listRes = await axiosClient.get(
          isMember ? "/api/member/folders" : "/api/upload",
          {
            params: {
              page: 1,
              limit: 1000, // Get more files to find all newly uploaded ones
              parentId: currentFolderId || null,
            },
            headers: tokenRef.current
              ? { Authorization: `Bearer ${tokenRef.current}` }
              : {},
          }
        );

        if (!listRes.data?.success) {
          console.warn(
            "[addUploadedFilesBatch] Failed to fetch files from list API"
          );
          // Fallback: try individual files
          uploadIds.forEach((uploadId) => {
            addUploadedFile(uploadId);
          });
          return;
        }

        let allFiles = [];

        if (isMember) {
          // Member API returns different structure
          const sourceItems = listRes.data.sourceItems || [];
          allFiles = sourceItems
            .filter((item) => item.type === "file")
            .map((item) => ({
              _id: item._id,
              id: item._id,
              originalName: item.name,
              name: item.name,
              size: item.size,
              mimeType: item.mimeType,
              createdAt: item.createdAt,
              folderId: item.folderId,
              url: item.url,
              driveUrl: item.driveUrl,
              tempDownloadUrl: item.tempDownloadUrl,
              tempFileStatus: item.tempFileStatus,
              driveUploadStatus: item.driveUploadStatus,
              driveFileId: item.driveFileId,
              permissions: item.permissions || [],
            }));
        } else {
          allFiles = [
            ...(listRes.data.files || []),
            ...(listRes.data.folders || []),
          ];
        }

        // Find all files that match any of the uploadIds OR are recently created
        const foundFiles = [];
        const now = Date.now();
        const thirtySeconds = 30 * 1000; // Increased to 30 seconds to catch all files
        const foundFileIds = new Set(); // Track found files to avoid duplicates

        // First, try to find files by uploadId match
        for (const uploadId of uploadIds) {
          const tempDownloadUrl = `/api/download/temp/${uploadId}`;

          // Try exact match first
          let foundFile = allFiles.find((f) => {
            const fileId = String(f._id || f.id);
            if (foundFileIds.has(fileId)) return false; // Skip if already found
            return (
              f.tempDownloadUrl === tempDownloadUrl ||
              (f.tempDownloadUrl && f.tempDownloadUrl.includes(uploadId))
            );
          });

          // If not found, try partial match
          if (!foundFile) {
            const uploadIdParts = uploadId.split("-");
            if (uploadIdParts.length > 4) {
              const baseUploadId = uploadIdParts.slice(0, -1).join("-");
              foundFile = allFiles.find((f) => {
                const fileId = String(f._id || f.id);
                if (foundFileIds.has(fileId)) return false;
                return (
                  f.tempDownloadUrl && f.tempDownloadUrl.includes(baseUploadId)
                );
              });
            }
          }

          if (foundFile) {
            const fileId = String(foundFile._id || foundFile.id);
            foundFileIds.add(fileId);
            foundFiles.push(foundFile);
          }
        }

        // Second, find all recently created files that haven't been found yet
        // This ensures we catch all files even if uploadId matching fails
        const recentFiles = allFiles.filter((f) => {
          if (!f.createdAt) return false;
          const fileId = String(f._id || f.id);
          if (foundFileIds.has(fileId)) return false; // Skip if already found

          const fileAge = now - new Date(f.createdAt).getTime();
          return fileAge < thirtySeconds; // Files created within last 30 seconds
        });

        // Sort by creation time (newest first) and take up to the number of uploadIds
        // This ensures we get the most recent files that match the upload count
        const sortedRecentFiles = recentFiles
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, uploadIds.length); // Take at most as many as we uploaded

        // Add recent files that aren't already in foundFiles
        for (const file of sortedRecentFiles) {
          const fileId = String(file._id || file.id);
          if (!foundFileIds.has(fileId)) {
            foundFileIds.add(fileId);
            foundFiles.push(file);
          }
        }

        // Add all found files to data state
        if (foundFiles.length > 0) {
          setData((prevData) => {
            const existingIds = new Set(
              prevData.map((item) => String(item.id || item._id))
            );
            const newFiles = foundFiles
              .filter((f) => !existingIds.has(String(f._id)))
              .map((f) => ({
                id: String(f._id || f.id),
                _id: f._id,
                name: f.originalName || f.name,
                originalName: f.originalName || f.name,
                type: "file",
                size: f.size,
                date: f.createdAt,
                folderId: f.folderId ? String(f.folderId) : null,
                permissions: f.permissions || [],
                mimeType: f.mimeType,
                url: f.url,
                driveUrl: f.driveUrl,
                tempDownloadUrl: f.tempDownloadUrl,
                tempFileStatus: f.tempFileStatus,
                driveUploadStatus: f.driveUploadStatus,
                driveFileId: f.driveFileId,
                extension: f.originalName
                  ? f.originalName.split(".").pop()?.toLowerCase()
                  : undefined,
              }));

            if (newFiles.length > 0) {
              const updatedData = [...newFiles, ...prevData];

              // Update cache
              const cacheKey = currentFolderId || "root";
              const cached = folderDataCache.current.get(cacheKey);
              if (cached) {
                folderDataCache.current.set(cacheKey, {
                  ...cached,
                  data: updatedData,
                  timestamp: Date.now(),
                });
              }

              // Start polling for files that are still uploading to Drive
              newFiles.forEach((file) => {
                if (
                  file.driveUploadStatus === "pending" &&
                  file.tempDownloadUrl
                ) {
                  // Extract uploadId from tempDownloadUrl
                  const uploadIdMatch = file.tempDownloadUrl.match(
                    /\/api\/download\/temp\/(.+)/
                  );
                  if (uploadIdMatch && uploadIdMatch[1]) {
                    const uploadId = uploadIdMatch[1];
                    startPollingFileStatus(file.id, uploadId);
                  }
                }
              });

              return updatedData;
            }

            return prevData;
          });
        } else {
          // If no files found, fallback to individual calls
          console.warn(
            "[addUploadedFilesBatch] No files found, falling back to individual calls"
          );
          uploadIds.forEach((uploadId) => {
            addUploadedFile(uploadId);
          });
        }
      } catch (error) {
        console.error("[addUploadedFilesBatch] Error:", error);
        // Fallback: try individual files
        uploadIds.forEach((uploadId) => {
          addUploadedFile(uploadId);
        });
      }
    },
    [
      isMember,
      currentFolderId,
      tokenRef,
      startPollingFileStatus,
      addUploadedFile,
    ]
  );

  // Cleanup pollers on unmount
  useEffect(() => {
    return () => {
      fileStatusPollers.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      fileStatusPollers.current.clear();
    };
  }, []);

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

  // Note: Upload completion is now handled in FileManagemant.jsx via onComplete callback
  // This event listener is kept for backward compatibility but no longer triggers reload
  useEffect(() => {
    const handler = (e) => {
      const { batchId } = e.detail || {};
      setUploadBatches((prev) => prev.filter((b) => b.id !== batchId));
      // Don't reload - files are added optimistically via addUploadedFile
    };
    window.addEventListener("d2m:upload-completed", handler);
    return () => window.removeEventListener("d2m:upload-completed", handler);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    // Only fetch members for leader
    if (!isMember) {
      api
        .getMember(tokenRef.current, ac.signal)
        .then((json) => setMembers(json.members || []))
        .catch((error) => {
          // Ignore abort errors
          if (error.name !== "AbortError" && error.name !== "CanceledError") {
            console.error("Failed to fetch members:", error);
          }
          setMembers([]);
        });
    } else {
      // Member doesn't need members list
      setMembers([]);
    }
    return () => {
      if (!ac.signal.aborted) {
        ac.abort();
      }
    };
  }, [api, isMember]);

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
  const sortItems = useCallback(
    (items) => {
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
    },
    [filter.sortBy]
  );

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

    // Always sort folders alphabetically by name (case-insensitive)
    const sorted = [...result];
    sorted.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return sorted;
  }, [foldersAfterFavoriteFilter, searchLower]);

  const filesToShowFiltered = useMemo(() => {
    let result = searchLower
      ? filesAfterFavoriteFilter.filter((f) =>
          (f.name || "").toLowerCase().includes(searchLower)
        )
      : filesAfterFavoriteFilter;
    return sortItems(result);
  }, [filesAfterFavoriteFilter, searchLower, sortItems]);

  const handlePreview = useCallback((file) => {
    // Check if file is still uploading
    if (isFileUploading(file)) {
      toast.error("File đang được upload lên Google Drive. Vui lòng đợi upload hoàn thành để xem trước.");
      return;
    }
    setPreviewFile(file);
    setPreviewUrl(file.url || "");
  }, [isFileUploading]);

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
        currentFolderName =
          folderNamesRef.current.get(String(currentFolderId)) || "Unknown";

        // If not in ref, try to find in current data (visible folders)
        if (currentFolderName === "Unknown") {
          const currentFolderData = visibleFolders.find(
            (item) => String(item.id || item._id) === String(currentFolderId)
          );
          if (currentFolderData) {
            currentFolderName = currentFolderData.name || "Unknown";
            // Save to ref for future use
            folderNamesRef.current.set(
              String(currentFolderId),
              currentFolderName
            );
          } else {
            // If still not found, try all data
            const currentFolderInAllData = data.find(
              (item) =>
                item.type === "folder" &&
                String(item.id || item._id) === String(currentFolderId)
            );
            if (currentFolderInAllData) {
              currentFolderName = currentFolderInAllData.name || "Unknown";
              folderNamesRef.current.set(
                String(currentFolderId),
                currentFolderName
              );
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
        const filteredHistory = h.filter(
          (item) => String(item.id) !== String(currentFolderId)
        );

        // Check if current folder is already the last item in filtered history
        const lastItem = filteredHistory[filteredHistory.length - 1];
        if (lastItem && String(lastItem.id) === String(currentFolderId)) {
          // Already in history as last item, don't add again
          return filteredHistory;
        }

        // Add current folder to history with proper name
        return [
          ...filteredHistory,
          { id: currentFolderId, name: currentFolderName },
        ];
      });

      // Update current folder
      setCurrentFolderId(folderId);
    },
    [currentFolderId, data, visibleFolders]
  );

  const navigateToFolder = useCallback(
    (targetFolderId) => {
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
    },
    [folderHistory]
  );

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
      
      // Check for uploading files
      const uploadingFiles = items.filter(isFileUploading);
      if (uploadingFiles.length > 0) {
        const fileNames = uploadingFiles.map(f => f.name || f.originalName).join(", ");
        const confirmMessage = uploadingFiles.length === 1
          ? `File "${fileNames}" đang được upload lên Google Drive. Xóa file này sẽ hủy upload và xóa vĩnh viễn file tạm. Bạn có chắc chắn muốn xóa?`
          : `${uploadingFiles.length} file đang được upload. Xóa các file này sẽ hủy upload và xóa vĩnh viễn file tạm. Bạn có chắc chắn muốn xóa?`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }
      
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
    // Priority 1: If file has tempDownloadUrl and tempFileStatus is completed, use temp file
    // This allows downloading from temp even if Drive upload is still in progress
    if (item?.tempDownloadUrl && item?.tempFileStatus === "completed") {
      return item.tempDownloadUrl;
    }
    
    // Priority 2: If file has driveUrl/url (uploaded to Drive), use that
    if (item?.driveUrl || item?.url) {
      const url = item.driveUrl || item.url;
      const m = url.match(/\/d\/([\w-]+)\//);
      return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : url;
    }
    
    // Priority 3: If file has _id and driveUploadStatus is completed, use API endpoint
    if (item?._id && item?.driveUploadStatus === "completed") {
      return `/api/download/file/${item._id}`;
    }
    
    // Priority 4: If file is still uploading to Drive but has tempDownloadUrl, allow temp download
    const isUploadingToDrive = item?.driveUploadStatus === "uploading" || 
                               item?.driveUploadStatus === "pending";
    if (isUploadingToDrive && item?.tempDownloadUrl) {
      return item.tempDownloadUrl; // Allow download from temp while Drive upload is in progress
    }
    
    return null; // File not ready for download
  }
  
  // Check if file is uploading
  function isFileUploading(item) {
    if (!item || item.type !== "file") return false;
    return item?.driveUploadStatus === "uploading" || 
           item?.driveUploadStatus === "pending" ||
           (!item?.driveFileId && (item?.tempDownloadUrl || item?.tempFilePath));
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
      
      // Check for files that are not ready (no temp file and no Drive file)
      const notReadyFiles = items.filter((item) => {
        if (item.type !== "file") return false;
        // Allow download from temp even if Drive upload is still in progress
        const hasTemp = item.tempDownloadUrl && item.tempFileStatus === "completed";
        const hasTempUploading = item.tempDownloadUrl && item.driveUploadStatus === "uploading";
        const hasDrive = item.driveFileId || item.driveUrl || item.url;
        return !hasTemp && !hasTempUploading && !hasDrive;
      });
      
      if (notReadyFiles.length > 0) {
        toast.error(
          notReadyFiles.length === 1
            ? "File chưa sẵn sàng để tải xuống. Vui lòng đợi upload hoàn thành."
            : `${notReadyFiles.length} file chưa sẵn sàng để tải xuống. Vui lòng đợi upload hoàn thành.`
        );
        return;
      }
      
      for (const item of items) {
        const rawUrl = getPreferredDownloadUrl(item);
        if (!rawUrl) {
          toast.error(`File "${item.name || item.originalName}" chưa sẵn sàng để tải xuống.`);
          continue;
        }

        if (isTempApi(rawUrl)) {
          try {
            // Check if file is still uploading to Drive
            const isUploadingToDrive = item.driveUploadStatus === "uploading" ||
                                     item.driveUploadStatus === "pending";

            if (isUploadingToDrive) {
              toast.info(`Đang tải xuống file "${item.name || item.originalName}" từ bộ nhớ tạm. File vẫn đang được upload lên Google Drive.`, {
                duration: 3000,
              });
            }

            const res = await api.downloadInternal(rawUrl, tokenRef.current);
            const cd = res.headers?.["content-disposition"] || "";
            const fileNameHeader = res.headers?.["x-file-name"] || "";
            const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
              cd
            );
            const headerName = decodeURIComponent(m?.[1] || m?.[2] || fileNameHeader || "");
            const fileName =
              headerName || item?.name || item?.originalName || "download";

            // Check upload status from headers
            const driveUploadStatus = res.headers?.["x-drive-upload-status"];
            const allowTempDownload = res.headers?.["x-allow-temp-download"];

            if (driveUploadStatus === "uploading" && allowTempDownload) {
              console.log(`[Download] File "${fileName}" downloaded from temp while Drive upload in progress`);
            }

            const objectUrl = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);

            toast.success(`Đã tải xuống "${fileName}" thành công!`);
          } catch (error) {
            // Handle error from download API
            const errorMessage = error?.response?.data?.error || error?.message || "Lỗi tải xuống file";
            toast.error(`Tải xuống thất bại: ${errorMessage}`);
          }
          continue;
        }

        // For Drive URLs or API endpoints, try to download via API first
        if (rawUrl.startsWith("/api/download/file/")) {
          try {
            const res = await api.downloadInternal(rawUrl, tokenRef.current);
            const fileNameHeader = res.headers?.["x-file-name"] || "";
            const fileName = fileNameHeader 
              ? decodeURIComponent(fileNameHeader)
              : item?.name || item?.originalName || "download";
            const objectUrl = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
          } catch (error) {
            // Handle error from download API
            const errorMessage = error?.response?.data?.error || error?.message || "Lỗi tải xuống file";
            toast.error(errorMessage);
          }
        } else {
          // For external URLs (Google Drive), open in new tab
        const a = document.createElement("a");
        a.href = rawUrl;
        a.rel = "noopener";
        a.target = "_blank";
        a.download = item?.name || item?.originalName || "";
        document.body.appendChild(a);
        a.click();
        a.remove();
        }
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
    updateDataAfterMove,
    updateDataAfterDelete,
    updateDataFromChat,
    addUploadedFile,
    addUploadedFilesBatch,
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
    isFileUploading, // Export helper function
  };
};

export default useFileManagementPage;
