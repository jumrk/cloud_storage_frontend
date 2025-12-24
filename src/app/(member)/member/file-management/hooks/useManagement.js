"use client";

import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
  const [hasFetched, setHasFetched] = useState(false); // Track if data has been fetched at least once
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize with default "grid" to avoid hydration mismatch
  const [view, setViewState] = useState("grid");

  // Load view preference from localStorage after mount (client-side only)
  // Wait for isMobile to be set before loading
  useEffect(() => {
    if (typeof window !== "undefined" && !isMobile) {
      const saved = localStorage.getItem("memberFileManagementView");
      if (saved === "list" || saved === "grid") {
        setViewState(saved);
      }
    }
  }, [isMobile]); // Run when isMobile is determined

  // Wrapper function to save to localStorage and update state
  const setView = useCallback(
    (mode) => {
      if (typeof window !== "undefined" && !isMobile) {
        localStorage.setItem("memberFileManagementView", mode);
      }
      setViewState(mode);
    },
    [isMobile]
  );
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadBatch, setDownloadBatch] = useState(null);
  const downloadBatchIdRef = useRef(0);
  const isDownloadingRef = useRef(false);
  const downloadingFileIdsRef = useRef(new Set()); // Track đang download file nào
  const downloadControllerRef = useRef(null); // Store AbortController for cancel (single file)
  const downloadControllersRef = useRef(new Map()); // Store AbortControllers for multiple files (fileId -> AbortController)

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

  // Force grid view on mobile, restore from localStorage when switching to desktop
  useEffect(() => {
    if (isMobile) {
      // Force grid view on mobile
      if (view !== "grid") {
        setViewState("grid");
      }
    } else {
      // Restore from localStorage when switching to desktop
      const saved = localStorage.getItem("memberFileManagementView");
      if (saved === "list" || saved === "grid") {
        setViewState(saved);
      }
    }
  }, [isMobile]);

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
      // console.error("Failed to load favorites", err);
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

  const handleDownload = useCallback(
    async (items) => {
      // Log stack trace để debug
      console.log("handleDownload called", new Error().stack);

      // Prevent duplicate downloads - CHECK FIRST, BEFORE ANYTHING ELSE
      if (isDownloadingRef.current) {
        console.warn(
          "Download already in progress, ignoring duplicate request",
          new Error().stack
        );
        return;
      }

      // Handle single item (from table row click) or array of items
      let list;
      if (Array.isArray(items)) {
        // If array is passed, use it (from ActionZone)
        list = items.length ? items : [];
      } else if (items && (items.id || items._id)) {
        // Single item passed (e.g., from table row download button)
        // IMPORTANT: Only download the clicked item, ignore selectedItems
        const itemId = String(items.id || items._id);

        // Check if this file is already being downloaded
        if (downloadingFileIdsRef.current.has(itemId)) {
          console.warn("File already downloading, ignoring:", itemId);
          return;
        }

        // Add to downloading set IMMEDIATELY
        downloadingFileIdsRef.current.add(itemId);
        list = [items];
      } else {
        // Fallback: use selectedItems only if no item was passed
        list = tableActions.selectedItems || [];
      }

      if (!list || !list.length) {
        isDownloadingRef.current = false;
        return;
      }

      // Set downloading flag IMMEDIATELY before any async operations
      isDownloadingRef.current = true;

      console.log(
        "Download triggered with items:",
        list.map((i) => ({ id: i.id || i._id, name: i.name || i.originalName }))
      );

      // Filter out folders - only download files
      const filesOnly = list.filter((item) => item.type === "file");
      if (!filesOnly.length) {
        toast.error("Chỉ có thể tải xuống file, không thể tải xuống thư mục");
        isDownloadingRef.current = false; // Reset flag on early return
        return;
      }

      // For single file, show download progress
      if (filesOnly.length === 1) {
        const item = filesOnly[0];
        const fileId = String(item._id || item.id);

        if (!item._id && !item.id) {
          downloadingFileIdsRef.current.delete(fileId);
          toast.error("Không thể tải xuống file này");
          isDownloadingRef.current = false;
          return;
        }

        // Always use API endpoint for downloads
        const downloadUrl = `/api/download/file/${item._id || item.id}`;

        // Create batch download for progress tracking
        const batchId = `member-download-${Date.now()}-${++downloadBatchIdRef.current}`;
        setDownloadBatch({
          batchId,
          files: [
            {
              name: item?.name || item?.originalName || "download",
              id: item._id || item.id,
              size: item.size || 0,
              status: "pending",
              progress: 0,
            },
          ],
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
              // Keep existing progress, don't reset to 0
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
          let isRealProgressStarted = false;
          simulatedProgressInterval = setInterval(() => {
            // Don't update if real progress has started
            if (isRealProgressStarted) {
              clearInterval(simulatedProgressInterval);
              return;
            }
            simulatedProgress = Math.min(simulatedProgress + 0.5, 5);
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              // Only update if progress is still 0 or less than simulated progress
              return {
                ...prev,
                files: prev.files.map((f) => ({
                  ...f,
                  progress: Math.max(f.progress || 0, simulatedProgress),
                })),
              };
            });
            if (simulatedProgress >= 5) {
              clearInterval(simulatedProgressInterval);
            }
          }, 200);
        }

        // Helper function to get Google Drive download URL
        const getDriveDownloadUrl = (item) => {
          if (!item) return null;
          const driveUrl = item.driveUrl || item.url;
          if (!driveUrl) return null;

          const patterns = [
            /\/d\/([\w-]+)\//,
            /[?&]id=([\w-]+)/,
            /\/file\/d\/([\w-]+)/,
          ];

          for (const pattern of patterns) {
            const match = driveUrl.match(pattern);
            if (match && match[1]) {
              return `https://drive.google.com/uc?export=download&id=${match[1]}`;
            }
          }

          return driveUrl;
        };

        const downloadViaDriveUrl = (driveUrl, fileName) => {
          const a = document.createElement("a");
          a.href = driveUrl;
          a.rel = "noopener noreferrer";
          a.target = "_blank";
          a.download =
            fileName || item?.name || item?.originalName || "download";
          document.body.appendChild(a);
          a.click();
          a.remove();
        };

        let downloadTimeout = null;
        let progressStalledTimeout = null;
        let lastProgressTime = Date.now();
        let lastProgressValue = 0;

        try {
          const timeoutMs =
            fileSize > 100 * 1024 * 1024 ? 5 * 60 * 1000 : 2 * 60 * 1000;

          const downloadController = new AbortController();
          downloadControllerRef.current = downloadController; // Store for cancel
          downloadTimeout = setTimeout(() => {
            downloadController.abort();
          }, timeoutMs);

          // Monitor for stalled progress
          const checkProgressStall = () => {
            const now = Date.now();
            const timeSinceLastProgress = now - lastProgressTime;
            const progressDelta = Math.abs(
              lastProgressValue - (downloadBatch?.files?.[0]?.progress || 0)
            );

            if (timeSinceLastProgress > 30000 && progressDelta < 1) {
              downloadController.abort();
              throw new Error(
                "Download stalled - switching to direct download"
              );
            }
          };

          progressStalledTimeout = setInterval(checkProgressStall, 5000);

          const res = await axiosClient.get(downloadUrl, {
            responseType: "blob",
            signal: downloadController.signal,
            onDownloadProgress: (progressEvent) => {
              // Clear simulated progress when real progress starts
              if (simulatedProgressInterval) {
                clearInterval(simulatedProgressInterval);
                simulatedProgressInterval = null;
              }

              lastProgressTime = Date.now();

              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                lastProgressValue = percentCompleted;
                setDownloadBatch((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    files: prev.files.map((f) => ({
                      ...f,
                      // Only update if new progress is greater than current to avoid reset
                      progress: Math.max(f.progress || 0, percentCompleted),
                    })),
                  };
                });
              } else if (progressEvent.loaded > 0 && fileSize > 0) {
                // Fallback: calculate progress from loaded bytes and known file size
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / fileSize
                );
                lastProgressValue = percentCompleted;
                setDownloadBatch((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    files: prev.files.map((f) => ({
                      ...f,
                      // Only update if new progress is greater than current to avoid reset
                      progress: Math.max(
                        f.progress || 0,
                        Math.min(percentCompleted, 99)
                      ), // Cap at 99% until complete
                    })),
                  };
                });
              }
            },
          });

          // Clear timeouts on success
          if (downloadTimeout) clearTimeout(downloadTimeout);
          if (progressStalledTimeout) clearInterval(progressStalledTimeout);

          // Try to get filename from custom header first, then Content-Disposition as fallback
          const fileNameFromHeader = res.headers?.["x-file-name"];
          let fileName = fileNameFromHeader
            ? decodeURIComponent(fileNameFromHeader)
            : null;

          if (!fileName) {
            const cd = res.headers?.["content-disposition"] || "";
            const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
              cd
            );
            fileName = decodeURIComponent(m?.[1] || m?.[2] || "");
          }

          fileName = fileName || item?.name || item?.originalName || "download";

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

          // Remove from downloading set on success
          downloadingFileIdsRef.current.delete(fileId);
          downloadControllerRef.current = null; // Clear controller

          setTimeout(() => {
            setDownloadBatch(null);
            toast.success("Tải xuống thành công!");
            isDownloadingRef.current = false;
          }, 1500);

          return; // IMPORTANT: Return here to prevent continuing to multiple files download
        } catch (e) {
          // Clear timeouts on error
          if (downloadTimeout) clearTimeout(downloadTimeout);
          if (progressStalledTimeout) clearInterval(progressStalledTimeout);
          if (simulatedProgressInterval)
            clearInterval(simulatedProgressInterval);

          // Check if cancelled
          const isCancelled =
            e?.name === "AbortError" || e?.code === "ECONNABORTED";
          if (isCancelled) {
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f) => ({
                  ...f,
                  status: "cancelled",
                })),
              };
            });
            downloadingFileIdsRef.current.delete(fileId);
            downloadControllerRef.current = null;
            setTimeout(() => {
              setDownloadBatch(null);
              isDownloadingRef.current = false;
            }, 1500);
            return;
          }

          // Check if we should fallback to Google Drive URL
          const driveUrl = getDriveDownloadUrl(item);
          const isTimeoutOrStalled =
            e?.code === "ECONNABORTED" ||
            e?.name === "AbortError" ||
            e?.message?.includes("stalled") ||
            e?.message?.includes("timeout");

          if (driveUrl && (isTimeoutOrStalled || e?.response?.status >= 500)) {
            // Fallback to Google Drive direct download
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f) => ({
                  ...f,
                  status: "downloading",
                  progress: 50,
                  error: null,
                })),
              };
            });

            toast.info("Đang chuyển sang tải trực tiếp từ Google Drive...", {
              duration: 2000,
            });

            setTimeout(() => {
              downloadViaDriveUrl(
                driveUrl,
                item?.name || item?.originalName || "download"
              );

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
                toast.success("Đã mở link tải xuống từ Google Drive!");
              }, 1500);
            }, 500);

            // Remove from downloading set when using fallback
            downloadingFileIdsRef.current.delete(fileId);
            return;
          }

          // No fallback available or other error
          const errorMsg =
            e?.response?.data?.error || e.message || "Lỗi tải xuống";
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

          // Remove from downloading set on error
          downloadingFileIdsRef.current.delete(fileId);

          setTimeout(() => {
            setDownloadBatch(null);
            toast.error(errorMsg);
            isDownloadingRef.current = false;
          }, 2000);

          return; // IMPORTANT: Return here to prevent continuing to multiple files download
        }
      }

      // Multiple files download - tạo downloadBatch cho nhiều file
      const batchId = `member-download-${Date.now()}-${++downloadBatchIdRef.current}`;
      const downloadFiles = filesOnly.map((item) => ({
        name: item.name || item.originalName || "download",
        id: item._id || item.id,
        size: item.size || 0,
        status: "pending",
        progress: 0,
      }));

      setDownloadBatch({
        batchId,
        files: downloadFiles,
        folderName: null,
        status: "downloading",
      });

      // Đảm bảo downloadBatch được set trước khi bắt đầu tải
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Helper functions
      const getNameFromCD = (cd = "") => {
        const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
        const raw = decodeURIComponent(m?.[1] || m?.[2] || "");
        return raw || "download";
      };

      const getDriveDownloadUrl = (item) => {
        if (!item) return null;
        const driveUrl = item.driveUrl || item.url;
        if (!driveUrl) return null;

        const patterns = [
          /\/d\/([\w-]+)\//,
          /[?&]id=([\w-]+)/,
          /\/file\/d\/([\w-]+)/,
        ];

        for (const pattern of patterns) {
          const match = driveUrl.match(pattern);
          if (match && match[1]) {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
          }
        }

        return driveUrl;
      };

      const downloadViaDriveUrl = (driveUrl, fileName) => {
        const a = document.createElement("a");
        a.href = driveUrl;
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        a.download = fileName || "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      // Download từng file và update progress
      for (let index = 0; index < filesOnly.length; index++) {
        const item = filesOnly[index];
        const fileId = String(item._id || item.id);
        if (!item._id && !item.id) {
          downloadingFileIdsRef.current.delete(fileId);
          continue;
        }

        // Check if already downloading
        if (downloadingFileIdsRef.current.has(fileId)) {
          console.warn("Skipping duplicate download for:", fileId);
          continue;
        }

        downloadingFileIdsRef.current.add(fileId);

        // Update file status to downloading
        setDownloadBatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: prev.files.map((f, i) =>
              i === index ? { ...f, status: "downloading" } : f
            ),
          };
        });

        try {
          const downloadUrl = `/api/download/file/${item._id || item.id}`;
          const fileSize = item.size || 0;
          const timeoutMs =
            fileSize > 100 * 1024 * 1024 ? 5 * 60 * 1000 : 2 * 60 * 1000;

          const downloadController = new AbortController();
          downloadControllersRef.current.set(fileId, downloadController); // Store controller for cancel

          const timeout = setTimeout(() => {
            downloadController.abort();
          }, timeoutMs);

          const res = await axiosClient.get(downloadUrl, {
            responseType: "blob",
            signal: downloadController.signal,
            onDownloadProgress: (progressEvent) => {
              // Update progress for this specific file
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setDownloadBatch((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    files: prev.files.map((f, i) =>
                      i === index
                        ? {
                            ...f,
                            progress: Math.max(
                              f.progress || 0,
                              percentCompleted
                            ),
                          }
                        : f
                    ),
                  };
                });
              } else if (progressEvent.loaded > 0 && fileSize > 0) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / fileSize
                );
                setDownloadBatch((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    files: prev.files.map((f, i) =>
                      i === index
                        ? {
                            ...f,
                            progress: Math.max(
                              f.progress || 0,
                              Math.min(percentCompleted, 99)
                            ),
                          }
                        : f
                    ),
                  };
                });
              }
            },
          });

          clearTimeout(timeout);

          const fileName =
            getNameFromCD(res.headers?.["content-disposition"] || "") ||
            item?.name ||
            item?.originalName ||
            "download";

          const objectUrl = URL.createObjectURL(res.data);
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(objectUrl);

          // Update file status to success
          setDownloadBatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map((f, i) =>
                i === index ? { ...f, status: "success", progress: 100 } : f
              ),
            };
          });

          // Remove from downloading set and controller map on success
          downloadingFileIdsRef.current.delete(fileId);
          downloadControllersRef.current.delete(fileId);
        } catch (e) {
          // Remove from downloading set and controller map on error
          downloadingFileIdsRef.current.delete(fileId);
          downloadControllersRef.current.delete(fileId);

          // Check if cancelled
          const isCancelled =
            e?.name === "AbortError" || e?.code === "ECONNABORTED";
          if (isCancelled) {
            // Update file status to cancelled
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f, i) =>
                  i === index ? { ...f, status: "cancelled" } : f
                ),
              };
            });
            continue; // Skip to next file
          }

          // Update file status to error
          const errorMsg =
            e?.response?.data?.error || e.message || "Lỗi tải xuống";
          setDownloadBatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map((f, i) =>
                i === index
                  ? { ...f, status: "error", error: errorMsg, progress: 0 }
                  : f
              ),
            };
          });

          // Fallback to Google Drive URL if available
          const driveUrl = getDriveDownloadUrl(item);
          const isTimeout =
            e?.code === "ECONNABORTED" || e?.name === "AbortError";

          if (driveUrl && (isTimeout || e?.response?.status >= 500)) {
            downloadViaDriveUrl(
              driveUrl,
              item?.name || item?.originalName || "download"
            );
            // Update to success after fallback
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f, i) =>
                  i === index ? { ...f, status: "success", progress: 100 } : f
                ),
              };
            });
            toast.info(
              `Đã mở link tải xuống từ Google Drive: ${item?.name || "file"}`
            );
          } else {
            toast.error(
              `Tải xuống thất bại: ${
                item?.name || item?.originalName || "file"
              }`
            );
          }
        }
      }

      // Reset downloading flag after all downloads complete
      isDownloadingRef.current = false;

      // Check if all files are done (success or error)
      setTimeout(() => {
        setDownloadBatch((prev) => {
          if (!prev) return prev;
          const allDone = prev.files.every(
            (f) =>
              f.status === "success" ||
              f.status === "error" ||
              f.status === "cancelled"
          );
          if (allDone) {
            const successCount = prev.files.filter(
              (f) => f.status === "success"
            ).length;
            if (successCount > 0) {
              toast.success(
                `Đã tải xuống ${successCount}/${prev.files.length} file thành công!`
              );
            }
            // Auto close after 2 seconds
            setTimeout(() => {
              setDownloadBatch(null);
            }, 2000);
          }
          return prev;
        });
      }, 500);
    },
    [tableActions.selectedItems]
  );

  const tableHeader = [
    t("member.table.name"),
    t("member.table.size"),
    t("member.table.fileCount"),
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
    downloadControllerRef,
    downloadControllersRef,
    downloadingFileIdsRef,
    isDownloadingRef,
    favoriteIds,
    favoriteLoadingId,
    hasFetched,
    setHasFetched,
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
