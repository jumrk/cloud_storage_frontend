"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import useHomeTableActions from "@/lib/hook/useHomeTableActions";
import FileManagementService from "@/lib/services/fileManagementService";

const useFileManagementPage = () => {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  const tokenRef = useRef(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderHistory, setFolderHistory] = useState([]);

  const [uploadBatches, setUploadBatches] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
  });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const tableActions = useHomeTableActions({ data, setData });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
        }));

        if (pageNum === 1) setData([...folders, ...files]);
        else setData((prev) => [...prev, ...folders, ...files]);

        setHasMore(pageNum < (json.totalPages || 1));
      } catch {
        if (pageNum === 1) setData([]);
      } finally {
        if (pageNum === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [api, currentFolderId]
  );

  useEffect(() => {
    fetchData(page);
    return () => acRef.current?.abort?.();
  }, [fetchData, page]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

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
        return true;
      }
      return false;
    });
  }, [data, filter]);

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

  const searchLower = searchTerm.trim().toLowerCase();

  const foldersToShowFiltered = useMemo(
    () =>
      searchLower
        ? foldersBase.filter((f) =>
            (f.name || "").toLowerCase().includes(searchLower)
          )
        : foldersBase,
    [foldersBase, searchLower]
  );

  const filesToShowFiltered = useMemo(
    () =>
      searchLower
        ? filesBase.filter((f) =>
            (f.name || "").toLowerCase().includes(searchLower)
          )
        : filesBase,
    [filesBase, searchLower]
  );

  const handlePreview = useCallback((file) => {
    setPreviewFile(file);
    setPreviewUrl(file.url || "");
  }, []);

  const handleBack = useCallback(() => {
    setFolderHistory((h) => {
      const prev = h[h.length - 1] ?? null;
      setCurrentFolderId(prev);
      return h.slice(0, -1);
    });
  }, []);

  const handleFolderClick = useCallback(
    (folder) => {
      setFolderHistory((h) => [...h, currentFolderId]);
      setCurrentFolderId(folder?.id ?? null);
    },
    [currentFolderId]
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
    t("file.table.date"),
    t("file.table.downloads"),
  ];

  return {
    t,
    isSidebarOpen,
    isMobile,
    viewMode,
    showUploadDropdown,
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
    dedupeById,
    areAllVisibleSelected,
  };
};

export default useFileManagementPage;
