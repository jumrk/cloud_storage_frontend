import axiosClient from "@/shared/lib/axiosClient";
import axios from "axios";

// Global lock để tránh duplicate requests
const pendingDownloads = new Map();

const FileManagementService = () => {
  // ✅ No need for authHeaders - cookies sent automatically

  // ✅ PAGINATION FIX: Support sorting parameters
  const getUploads = (
    { page = 1, limit = 20, parentId = null, sortBy = "date", sortDir = "desc" } = {},
    signal,
  ) => {
    const params = { page, limit, sortBy, sortDir };
    if (parentId !== null && parentId !== undefined) params.parentId = parentId;
    return axiosClient
      .get("/api/upload", { params, signal })
      .then((r) => r.data);
  };

  const getMember = (signal) =>
    axiosClient
      .get("/api/user/members", { signal })
      .then((r) => r.data);

  const createFolder = ({ name, parentId = null }, signal) =>
    axiosClient
      .post(
        "/api/upload/create_folder",
        { name, parentId },
        { signal },
      )
      .then((r) => r.data);

  const getCurrentPermissions = (folderId, signal) =>
    axiosClient
      .get(`/api/folders/${folderId}/permissions`, { signal })
      .then((r) => r.data);

  const postPermission = (folderId, memberId, locked, signal) =>
    axiosClient
      .post(
        "/api/folders/permissions",
        { folderId, memberId, locked },
        {
          headers: { "Content-Type": "application/json" },
          signal,
        },
      )
      .then((r) => r.data);

  const deletePermission = (folderId, memberId, signal) =>
    axiosClient
      .delete("/api/folders/permissions", {
        headers: { "Content-Type": "application/json" },
        data: { folderId, memberId },
        signal,
      })
      .then((r) => r.data);

  const downloadInternal = (rawUrl, signal, onDownloadProgress) => {
    const url = rawUrl?.startsWith("http")
      ? rawUrl
      : `${process.env.NEXT_PUBLIC_API_BASE || ""}${rawUrl}`;

    // Check if this URL is already being downloaded
    if (pendingDownloads.has(url)) {
      const existing = pendingDownloads.get(url);
      const existingPromise = existing?.promise || existing;
      if (signal?.aborted) {
        if (existing?.source) {
          existing.source.cancel("Download cancelled by user");
        }
        pendingDownloads.delete(url);
        const abortError = new Error("Download cancelled");
        abortError.name = "AbortError";
        abortError.isCancelled = true;
        return Promise.reject(abortError);
      }
      return existingPromise;
    }

    const requestController = new AbortController();
    const finalSignal = signal || requestController.signal;

    if (finalSignal.aborted) {
      const abortError = new Error("Download cancelled");
      abortError.name = "AbortError";
      abortError.isCancelled = true;
      return Promise.reject(abortError);
    }

    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    const downloadPromise = axiosClient
      .get(url, {
        responseType: "blob",
        signal: finalSignal,
        cancelToken: source.token,
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onDownloadProgress: (progressEvent) => {
          if (finalSignal?.aborted || source.token.reason) return;
          if (onDownloadProgress) onDownloadProgress(progressEvent);
        },
      })
      .then((response) => {
        if (finalSignal?.aborted || source.token.reason) {
          pendingDownloads.delete(url);
          const abortError = new Error("Download cancelled");
          abortError.name = "AbortError";
          abortError.isCancelled = true;
          throw abortError;
        }
        pendingDownloads.delete(url);
        return response;
      })
      .catch((error) => {
        pendingDownloads.delete(url);
        if (
          error.name === "AbortError" ||
          error.code === "ECONNABORTED" ||
          axios.isCancel(error) ||
          finalSignal?.aborted ||
          source.token.reason
        ) {
          const abortError = new Error("Download cancelled");
          abortError.name = "AbortError";
          abortError.isCancelled = true;
          throw abortError;
        }
        throw error;
      });

    pendingDownloads.set(url, { promise: downloadPromise, source });

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          try {
            source.cancel("Download cancelled by user");
          } catch (err) {}
          pendingDownloads.delete(url);
        },
        { once: true },
      );
    }

    return downloadPromise;
  };

  const getDeletedItems = (
    {
      page = 1,
      limit = 20,
      search = "",
      type = "",
      fileType = "",
      sortBy = "newest",
    } = {},
    signal,
  ) => {
    const params = { page, limit, sortBy };
    if (search) params.search = search;
    if (type) params.type = type;
    if (fileType) params.fileType = fileType;
    return axiosClient
      .get("/api/upload/deleted", { params, signal })
      .then((r) => r.data);
  };

  const restoreItems = (items, signal) =>
    axiosClient
      .post("/api/upload/restore", { items }, { signal })
      .then((r) => r.data);

  const permanentDeleteItems = (items, signal) =>
    axiosClient
      .post("/api/upload/permanent-delete", { items }, { signal })
      .then((r) => r.data);

  // ================= NEW FEATURES =================

  // --- SEARCH ---
  const searchFiles = (params, signal) =>
    axiosClient
      .get("/api/files/search", { params, signal })
      .then((r) => r.data);

  const searchAll = (params, signal) =>
    axiosClient
      .get("/api/files/search/all", { params, signal })
      .then((r) => r.data);

  const getSearchSuggestions = (q, signal) =>
    axiosClient
      .get("/api/files/search/suggestions", { params: { q }, signal })
      .then((r) => r.data);

  // --- TAGS ---
  const getTags = (signal) =>
    axiosClient
      .get("/api/tags", { signal })
      .then((r) => r.data);

  const createTag = (data) =>
    axiosClient
      .post("/api/tags", data)
      .then((r) => r.data);

  const updateTag = (tagId, data) =>
    axiosClient
      .put(`/api/tags/${tagId}`, data)
      .then((r) => r.data);

  const deleteTag = (tagId) =>
    axiosClient
      .delete(`/api/tags/${tagId}`)
      .then((r) => r.data);

  const assignTagToFile = (itemId, tagId, type = "file") =>
    axiosClient
      .post("/api/tags/assign", { itemId, tagId, type })
      .then((r) => r.data);

  const removeTagFromFile = (itemId, tagId, type = "file") =>
    axiosClient
      .post("/api/tags/remove", { itemId, tagId, type })
      .then((r) => r.data);

  // --- ACTIVITY ---
  const getFileActivity = (fileId, params, signal) =>
    axiosClient
      .get(`/api/activity/file/${fileId}`, { params, signal })
      .then((r) => r.data);

  const getFolderActivity = (folderId, params, signal) =>
    axiosClient
      .get(`/api/activity/folder/${folderId}`, { params, signal })
      .then((r) => r.data);

  const getUserActivity = (params, signal) =>
    axiosClient
      .get("/api/activity/user/recent", { params, signal })
      .then((r) => r.data);

  const getUserActivityStats = (days, signal) =>
    axiosClient
      .get("/api/activity/user/stats", { params: { days }, signal })
      .then((r) => r.data);

  // --- PREVIEW ---
  const getFilePreview = (fileId, signal) =>
    axiosClient
      .get(`/api/files/${fileId}/preview`, { signal })
      .then((r) => r.data);

  const getPreviewCapabilities = (fileId, signal) =>
    axiosClient
      .get(`/api/files/${fileId}/preview/capabilities`, { signal })
      .then((r) => r.data);

  // --- VERSIONING ---
  const getFileVersions = (fileId, signal) =>
    axiosClient
      .get(`/api/files/${fileId}/versions`, { signal })
      .then((r) => r.data);

  const restoreVersion = (fileId, versionId) =>
    axiosClient
      .post(`/api/files/${fileId}/restore`, { versionId })
      .then((r) => r.data);

  // --- LOCKING ---
  const lockFile = (fileId, data) =>
    axiosClient
      .post(`/api/files/${fileId}/lock`, data)
      .then((r) => r.data);

  const unlockFile = (fileId) =>
    axiosClient
      .delete(`/api/files/${fileId}/lock`)
      .then((r) => r.data);

  const getLockStatus = (fileId, signal) =>
    axiosClient
      .get(`/api/files/${fileId}/lock-status`, { signal })
      .then((r) => r.data);

  // --- BATCH OPERATIONS ---
  const batchOperation = (operation, data) =>
    axiosClient
      .post(`/api/batch/${operation}`, data)
      .then((r) => r.data);

  // ✅ FIX: Add moveItems function
  const moveItems = (itemsData, targetFolderId) => {
    // itemsData can be either:
    // 1. Array of objects with id and type: [{ id, type, name }]
    // 2. Array of IDs: ["id1", "id2"]
    const items = itemsData.map(item => {
      if (typeof item === "string") {
        // Just ID - assume file (backend will validate)
        return { id: item, type: "file" };
      }
      // Object with id, type, name
      return { 
        id: item.id || item._id, 
        type: item.type || "file",
        name: item.name || item.originalName 
      };
    });
    
    return axiosClient
      .post("/api/batch/move", { items, targetFolderId })
      .then((r) => r.data);
  };

  return {
    getUploads,
    getMember,
    createFolder,
    getCurrentPermissions,
    postPermission,
    deletePermission,
    downloadInternal,
    getDeletedItems,
    restoreItems,
    permanentDeleteItems,
    // New
    searchFiles,
    searchAll,
    getSearchSuggestions,
    getTags,
    createTag,
    updateTag,
    deleteTag,
    assignTagToFile,
    removeTagFromFile,
    getFileActivity,
    getFolderActivity,
    getUserActivity,
    getUserActivityStats,
    getFilePreview,
    getPreviewCapabilities,
    getFileVersions,
    restoreVersion,
    lockFile,
    unlockFile,
    getLockStatus,
    batchOperation,
    moveItems,
  };
};

export default FileManagementService;
