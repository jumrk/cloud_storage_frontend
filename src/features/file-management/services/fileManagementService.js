import axiosClient from "@/shared/lib/axiosClient";
import axios from "axios";

// Global lock để tránh duplicate requests
const pendingDownloads = new Map();

const FileManagementService = () => {
  const authHeaders = (token) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const getUploads = (
    { page = 1, limit = 20, parentId = null } = {},
    token,
    signal,
  ) => {
    const params = { page, limit };
    if (parentId !== null && parentId !== undefined) params.parentId = parentId;
    return axiosClient
      .get("/api/upload", { params, signal, headers: authHeaders(token) })
      .then((r) => r.data);
  };

  const getMember = (token, signal) =>
    axiosClient
      .get("/api/user/members", { headers: authHeaders(token), signal })
      .then((r) => r.data);

  const createFolder = ({ name, parentId = null }, token, signal) =>
    axiosClient
      .post(
        "/api/upload/create_folder",
        { name, parentId },
        { headers: authHeaders(token), signal },
      )
      .then((r) => r.data);

  const getCurrentPermissions = (folderId, token, signal) =>
    axiosClient
      .get(`/api/folders/${folderId}/permissions`, {
        headers: authHeaders(token),
        signal,
      })
      .then((r) => r.data);

  const postPermission = (folderId, memberId, locked, token, signal) =>
    axiosClient
      .post(
        "/api/folders/permissions",
        { folderId, memberId, locked },
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          signal,
        },
      )
      .then((r) => r.data);

  const deletePermission = (folderId, memberId, token, signal) =>
    axiosClient
      .delete("/api/folders/permissions", {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        data: { folderId, memberId },
        signal,
      })
      .then((r) => r.data);

  const downloadInternal = (rawUrl, token, signal, onDownloadProgress) => {
    const url = rawUrl?.startsWith("http")
      ? rawUrl
      : `${process.env.NEXT_PUBLIC_API_BASE || ""}${rawUrl}`;

    // Check if this URL is already being downloaded
    if (pendingDownloads.has(url)) {
      const existing = pendingDownloads.get(url);
      const existingPromise = existing?.promise || existing;
      // If signal is aborted, cancel the existing promise
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

    // Create abort controller for this specific request
    const requestController = new AbortController();
    const finalSignal = signal || requestController.signal;

    // If signal is already aborted, reject immediately
    if (finalSignal.aborted) {
      const abortError = new Error("Download cancelled");
      abortError.name = "AbortError";
      abortError.isCancelled = true;
      return Promise.reject(abortError);
    }

    // Create cancel token for axios (for older axios versions compatibility)
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    // Create the download promise
    const downloadPromise = axiosClient
      .get(url, {
        responseType: "blob",
        signal: finalSignal, // Primary method for cancellation
        cancelToken: source.token, // Fallback for compatibility
        headers: authHeaders(token),
        timeout: 300000, // 5 minutes timeout for large files
        maxContentLength: Infinity, // Allow large files
        maxBodyLength: Infinity, // Allow large files
        onDownloadProgress: (progressEvent) => {
          // Check if aborted before processing progress
          if (finalSignal?.aborted || source.token.reason) {
            return;
          }
          if (onDownloadProgress) {
            onDownloadProgress(progressEvent);
          }
        },
      })
      .then((response) => {
        // Check if aborted before processing response
        if (finalSignal?.aborted || source.token.reason) {
          pendingDownloads.delete(url);
          const abortError = new Error("Download cancelled");
          abortError.name = "AbortError";
          abortError.isCancelled = true;
          throw abortError;
        }
        // Remove from pending when done
        pendingDownloads.delete(url);
        return response;
      })
      .catch((error) => {
        // Remove from pending on error or abort
        pendingDownloads.delete(url);

        // If aborted, don't throw error to avoid console noise
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

    // Add to pending downloads with cancel source
    pendingDownloads.set(url, { promise: downloadPromise, source });

    // Handle abort signal to cancel request
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          // Cancel axios request using CancelToken as well
          try {
            source.cancel("Download cancelled by user");
          } catch (err) {
            // Ignore cancel errors
          }
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
    token,
    signal,
  ) => {
    const params = { page, limit, sortBy };
    if (search) params.search = search;
    if (type) params.type = type;
    if (fileType) params.fileType = fileType;
    return axiosClient
      .get("/api/upload/deleted", {
        params,
        headers: authHeaders(token),
        signal,
      })
      .then((r) => r.data);
  };

  const restoreItems = (items, token, signal) =>
    axiosClient
      .post(
        "/api/upload/restore",
        { items },
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          signal,
        },
      )
      .then((r) => r.data);

  const permanentDeleteItems = (items, token, signal) =>
    axiosClient
      .post(
        "/api/upload/permanent-delete",
        { items },
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          signal,
        },
      )
      .then((r) => r.data);

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
  };
};

export default FileManagementService;
