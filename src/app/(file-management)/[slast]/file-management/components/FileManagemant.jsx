"use client";
import { FiFilter, FiArrowLeft } from "react-icons/fi";
import Table from "@/features/file-management/components/TableFile";
import Card_file from "@/features/file-management/components/CardFile";
import UploadModal from "@/features/file-management/components/UploadModal";
import ActionZone from "@/features/file-management/components/ActionZone";
import PermissionModal from "./PermissionModal";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonTable from "@/shared/skeletons/SkeletonTable";
import EmptyState from "@/shared/ui/EmptyState";
import SidebarFilter from "@/features/file-management/components/SidebarFilter";
import FilePreviewModal from "@/features/file-management/components/FilePreviewModal";
import ImportByLinkModal from "./ImportByLinkModal";
import MiniStatus from "@/features/file-management/components/MiniStatus";
import ShareModal from "@/features/file-management/components/ShareModal";
import DownloadStatus from "@/features/share/components/DownloadStatus";
import useFileManagementPage from "@/app/(file-management)/[slast]/file-management/hooks/useFileManagementPage";
import FileManagementService from "@/features/file-management/services/fileManagementService";
import { useState, useRef, useMemo, useCallback } from "react";
import toast from "react-hot-toast";

import FileManagerHeader from "@/features/file-management/components/Header";

export default function FileManagement() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [downloadBatch, setDownloadBatch] = useState(null);
  const downloadBatchIdRef = useRef(0);
  const isDownloadingRef = useRef(false);
  const downloadingFileIdsRef = useRef(new Set()); // Track đang download file nào

  const {
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
    openImport,
    isItemFavorite,
    handleToggleFavorite,
    favoriteLoadingId,
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
    handleDownload: originalHandleDownload,
    dedupeById,
    areAllVisibleSelected,
    setOpenImport,
  } = useFileManagementPage();

  const api = useMemo(() => FileManagementService(), []);
  const tokenRef = useRef(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );
  const lastDownloadRef = useRef({ itemId: null, timestamp: 0 });

  // Hàm download với progress tracking - memoized với useCallback
  const handleDownload = useCallback(async (items) => {
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
      return;
    }

    // Filter out folders - only download files
    const filesOnly = list.filter(item => item.type === "file");
    if (!filesOnly.length) {
      // Remove from downloading set if no files
      filesOnly.forEach(item => {
        const id = String(item.id || item._id);
        downloadingFileIdsRef.current.delete(id);
      });
      toast.error("Chỉ có thể tải xuống file, không thể tải xuống thư mục");
      return;
    }

    // Set downloading flag IMMEDIATELY before any async operations
    isDownloadingRef.current = true;
    
    console.log("Download triggered with items:", filesOnly.map(i => ({ id: i.id || i._id, name: i.name || i.originalName })));

    // For single file, show download progress
    if (filesOnly.length === 1) {
      const item = filesOnly[0];
      const fileId = String(item._id || item.id);
      if (!item._id && !item.id) {
        toast.error("Không thể tải xuống file này");
        return;
      }

    // Tạo batch download
    const batchId = `file-download-${Date.now()}-${++downloadBatchIdRef.current}`;
    const downloadFiles = [{
      name: item.name || item.originalName || "download",
      id: item._id,
      size: item.size || 0,
      status: "pending",
      progress: 0,
    }];

    setDownloadBatch({
      batchId,
      files: downloadFiles,
      folderName: null,
      status: "downloading",
    });

    // Đảm bảo downloadBatch được set trước khi bắt đầu tải
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

    // Helper function to get Google Drive download URL
    const getDriveDownloadUrl = (item) => {
      if (!item) return null;
      const driveUrl = item.driveUrl || item.url;
      if (!driveUrl) return null;
      
      // Extract file ID from various Google Drive URL formats
      const patterns = [
        /\/d\/([\w-]+)\//,  // https://drive.google.com/file/d/FILE_ID/view
        /[?&]id=([\w-]+)/,  // https://drive.google.com/uc?id=FILE_ID
        /\/file\/d\/([\w-]+)/,  // Alternative format
      ];
      
      for (const pattern of patterns) {
        const match = driveUrl.match(pattern);
        if (match && match[1]) {
          return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
      }
      
      return driveUrl;
    };

    // Helper function to download via Google Drive URL
    const downloadViaDriveUrl = (driveUrl, fileName) => {
      const a = document.createElement("a");
      a.href = driveUrl;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.download = fileName || item?.name || item?.originalName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    let downloadTimeout = null;
    let progressStalledTimeout = null;
    let lastProgressTime = Date.now();
    let lastProgressValue = 0;

    try {
      // Tải file qua API với progress tracking và timeout
      const downloadUrl = `/api/download/file/${item._id}`;
      
      // Set timeout: 5 minutes for large files, 2 minutes for small files
      const timeoutMs = fileSize > 100 * 1024 * 1024 ? 5 * 60 * 1000 : 2 * 60 * 1000;
      
      const downloadController = new AbortController();
      downloadTimeout = setTimeout(() => {
        downloadController.abort();
      }, timeoutMs);

      // Monitor for stalled progress (no progress for 30 seconds)
      const checkProgressStall = () => {
        const now = Date.now();
        const timeSinceLastProgress = now - lastProgressTime;
        const progressDelta = Math.abs(lastProgressValue - (downloadBatch?.files?.[0]?.progress || 0));
        
        // If no progress for 30 seconds and we're stuck at same value, consider stalled
        if (timeSinceLastProgress > 30000 && progressDelta < 1) {
          downloadController.abort();
          throw new Error("Download stalled - switching to direct download");
        }
      };

      progressStalledTimeout = setInterval(checkProgressStall, 5000);

      console.log("About to call api.downloadInternal for:", downloadUrl);
      const res = await api.downloadInternal(
        downloadUrl,
        tokenRef.current,
        downloadController.signal,
        (progressEvent) => {
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
                  progress: percentCompleted,
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
                  progress: Math.min(percentCompleted, 99), // Cap at 99% until complete
                })),
              };
            });
          }
        }
      );
      
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
        const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
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

      // Cập nhật trạng thái thành công
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

      // Remove from downloading set
      downloadingFileIdsRef.current.delete(fileId);
      
      setTimeout(() => {
        setDownloadBatch(null);
        toast.success("Tải xuống thành công!");
        isDownloadingRef.current = false;
      }, 1500);
      
      return; // IMPORTANT: Return here to prevent continuing to multiple files download
    } catch (err) {
      // Clear timeouts on error
      if (downloadTimeout) clearTimeout(downloadTimeout);
      if (progressStalledTimeout) clearInterval(progressStalledTimeout);
      if (simulatedProgressInterval) clearInterval(simulatedProgressInterval);

      // Check if we should fallback to Google Drive URL
      const driveUrl = getDriveDownloadUrl(item);
      const isTimeoutOrStalled = err?.code === "ECONNABORTED" || 
                                  err?.name === "AbortError" ||
                                  err?.message?.includes("stalled") ||
                                  err?.message?.includes("timeout");

      if (driveUrl && (isTimeoutOrStalled || err?.response?.status >= 500)) {
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

        toast.info("Đang chuyển sang tải trực tiếp từ Google Drive...", { duration: 2000 });
        
        setTimeout(() => {
          downloadViaDriveUrl(driveUrl, item?.name || item?.originalName || "download");
          
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
        return;
      }

      // No fallback available or other error
      const errorMsg = err?.response?.data?.error || err.message || "Lỗi tải xuống";
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
    
    // Remove from downloading set on success (single file)
    downloadingFileIdsRef.current.delete(fileId);
    return; // IMPORTANT: Return here to prevent continuing to multiple files download
    } // End of single file download

    // Multiple files download - only reached if filesOnly.length > 1
    // Reset downloading flag after multiple files download
    isDownloadingRef.current = false;

    // Multiple files - download one by one with fallback
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

    for (const item of filesOnly) {
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
      
      try {
        const downloadUrl = `/api/download/file/${item._id || item.id}`;
        const fileSize = item.size || 0;
        const timeoutMs = fileSize > 100 * 1024 * 1024 ? 5 * 60 * 1000 : 2 * 60 * 1000;
        
        const downloadController = new AbortController();
        const timeout = setTimeout(() => {
          downloadController.abort();
        }, timeoutMs);

        const res = await api.downloadInternal(
          downloadUrl, 
          tokenRef.current,
          downloadController.signal
        );
        
        clearTimeout(timeout);
        
        const cd = res.headers?.["content-disposition"] || "";
        const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
        const headerName = decodeURIComponent(m?.[1] || m?.[2] || "");
        const fileName = headerName || item?.name || item?.originalName || "download";
        
        const objectUrl = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        // Remove from downloading set on success
        downloadingFileIdsRef.current.delete(fileId);
      } catch (e) {
        // Remove from downloading set on error
        downloadingFileIdsRef.current.delete(fileId);
        
        // Fallback to Google Drive URL if available
        const driveUrl = getDriveDownloadUrl(item);
        const isTimeout = e?.code === "ECONNABORTED" || e?.name === "AbortError";
        
        if (driveUrl && (isTimeout || e?.response?.status >= 500)) {
          downloadViaDriveUrl(driveUrl, item?.name || item?.originalName || "download");
          toast.info(`Đã mở link tải xuống từ Google Drive: ${item?.name || "file"}`);
        } else {
          toast.error(`Tải xuống thất bại: ${item?.name || item?.originalName || "file"}`);
        }
      }
    }
    
    // Reset downloading flag after all downloads complete
    isDownloadingRef.current = false;
  }, [api, tokenRef, tableActions.selectedItems]);

  return (
    <div className="flex w-full min-h-screen bg-surface-50 relative">
      <div className="flex-1 flex flex-col items-start px-2 md:px-8 py-6">
        <FileManagerHeader
          t={t}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showUploadDropdown={showUploadDropdown}
          setShowUploadDropdown={setShowUploadDropdown}
          setShowUploadModal={setShowUploadModal}
          setShowCreateFolderModal={setShowCreateFolderModal}
          setOpenImport={setOpenImport}
          viewMode={viewMode}
          setViewMode={setViewMode}
          areAllVisibleSelected={areAllVisibleSelected}
          tableActions={tableActions}
          foldersToShowFiltered={foldersToShowFiltered}
          filesToShowFiltered={filesToShowFiltered}
          dedupeById={dedupeById}
        />

        <div className="w-full lg:pr-[240px]">
          {loading ? (
            <>
              {viewMode === "list" ? (
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
          ) : (
            <>
              {currentFolderId && (
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow border border-border text-brand text-2xl mb-4 transition-all duration-150 hover:opacity-90"
                  onClick={handleBack}
                  title={t("file.button.back")}
                  style={{ outline: "none" }}
                >
                  <FiArrowLeft />
                </button>
              )}

              {isMobile ? (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {foldersToShowFiltered.length === 0 &&
                  filesToShowFiltered.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16">
                      <EmptyState />
                    </div>
                  ) : (
                    [...foldersToShowFiltered, ...filesToShowFiltered].map(
                      (item) => (
                        <Card_file
                          key={item.id}
                          data={item}
                          selectedItems={tableActions.selectedItems}
                          onSelectItem={tableActions.handleSelectItem}
                          draggedItems={tableActions.draggedItems}
                          onDragStart={tableActions.handleDragStart}
                          onDragEnd={tableActions.handleDragEnd}
                          onRename={tableActions.handleRename}
                          onMoveItem={handleMoveItems}
                          onClick={
                            item.type === "folder"
                              ? () => handleFolderClick(item)
                              : undefined
                          }
                          onPreviewFile={
                            item.type === "file"
                              ? () => handlePreview(item)
                              : undefined
                          }
                          onShare={() => {
                            setShareItem(item);
                            setShowShareModal(true);
                          }}
                          isFavorite={isItemFavorite(item)}
                          onToggleFavorite={() => handleToggleFavorite(item)}
                          favoriteLoading={
                            favoriteLoadingId === String(item._id || item.id)
                          }
                        />
                      )
                    )
                  )}
                </div>
              ) : viewMode === "list" ? (
                <Table
                  header={tableHeader}
                  data={[...foldersToShowFiltered, ...filesToShowFiltered]}
                  selectedItems={tableActions.selectedItems}
                  onSelectItem={tableActions.handleSelectItem}
                  onSelectAll={tableActions.handleSelectAll}
                  draggedItems={tableActions.draggedItems}
                  onDragStart={tableActions.handleDragStart}
                  onDragEnd={tableActions.handleDragEnd}
                  onRename={tableActions.handleRename}
                  handleChecked={() => {}}
                  onRowClick={handleFolderClick}
                  onMoveItem={handleMoveItems}
                  onMove={handleMoveItems}
                  onPreviewFile={handlePreview}
                  loadingMore={loadingMore}
                  onClearSelection={() => tableActions.setSelectedItems([])}
                  onShare={(item) => {
                    setShareItem(item);
                    setShowShareModal(true);
                  }}
                  onDownload={handleDownload}
                  isFavoriteItem={isItemFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteLoadingId={favoriteLoadingId}
                />
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {foldersToShowFiltered.length === 0 &&
                  filesToShowFiltered.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center">
                      <EmptyState />
                    </div>
                  ) : (
                    [...foldersToShowFiltered, ...filesToShowFiltered].map(
                      (item) => (
                        <Card_file
                          key={item.id}
                          data={item}
                          selectedItems={tableActions.selectedItems}
                          onSelectItem={tableActions.handleSelectItem}
                          draggedItems={tableActions.draggedItems}
                          onDragStart={tableActions.handleDragStart}
                          onDragEnd={tableActions.handleDragEnd}
                          onRename={tableActions.handleRename}
                          onMoveItem={handleMoveItems}
                          onClick={
                            item.type === "folder"
                              ? () => handleFolderClick(item)
                              : undefined
                          }
                          onPreviewFile={
                            item.type === "file"
                              ? () => handlePreview(item)
                              : undefined
                          }
                          onShare={() => {
                            setShareItem(item);
                            setShowShareModal(true);
                          }}
                          isFavorite={isItemFavorite(item)}
                          onToggleFavorite={() => handleToggleFavorite(item)}
                          favoriteLoading={
                            favoriteLoadingId === String(item._id || item.id)
                          }
                        />
                      )
                    )
                  )}
                </div>
              )}

              {loadingMore && (
                <div className="text-center py-4 text-text-muted">
                  {t("file.toast.loading_more")}
                </div>
              )}

              {hasMore && !loadingMore && (
                <div className="flex justify-center py-4">
                  <button
                    className="px-4 py-1.5 text-sm rounded-md shadow transition min-w-[100px] bg-brand text-white hover:opacity-95"
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    {t("file.button.view_more")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SidebarFilter
        isMobile={false}
        open
        loading={loading}
        filter={filter}
        onChangeFilter={setFilter}
        members={members}
      />
      <SidebarFilter
        isMobile={isMobile}
        open={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        loading={loading}
        filter={filter}
        onChangeFilter={setFilter}
        members={members}
      />

      {isMobile && !isSidebarOpen && (
        <button
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg md:hidden transition-all duration-200 hover:scale-110 active:scale-95 bg-brand text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label={t("file.sidebar.open_filter")}
        >
          <FiFilter className="text-2xl" />
        </button>
      )}

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onStartUpload={handleStartUpload}
        parentId={currentFolderId}
      />

      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2">
          <div className="bg-white rounded-xl p-4 w-full max-w-xs md:max-w-md mx-auto shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center text-text-strong">
              {t("file.modal.create_folder_title")}
            </h3>
            <input
              type="text"
              className="w-full border border-border rounded px-3 py-2 mb-4"
              placeholder={t("file.modal.create_folder_placeholder")}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                disabled={loading}
                onClick={handleCreateFolder}
                aria-busy={loading}
                className="relative flex-1 text-white py-2 rounded-lg disabled:cursor-not-allowed bg-brand hover:opacity-95"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {t("file.button.create")}
              </button>

              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="flex-1 bg-surface-50 text-text-strong py-2 rounded-lg hover:bg-white border border-border"
              >
                {t("file.button.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadBatches.map((batch, idx) => (
        <MiniStatus
          key={batch.id}
          files={batch.type === "file" ? batch.files : []}
          folders={batch.type === "folder" ? batch.files : []}
          emptyFolders={batch.type === "folder" ? batch.emptyFolders : []}
          batchId={batch.id}
          batchType={batch.type}
          folderName={batch.name}
          parentId={currentFolderId}
          moveItems={
            batch.type === "move" || batch.type === "delete"
              ? batch.items
              : undefined
          }
          moveTargetFolderId={
            batch.type === "move" ? batch.targetFolderId : undefined
          }
          useChunkedUpload={batch.useChunkedUpload}
          onComplete={() => {
            setUploadBatches((prev) => prev.filter((b) => b.id !== batch.id));
            resetAndReload();
          }}
          style={{ marginBottom: idx > 0 ? 12 : 12 }}
        />
      ))}

      <ActionZone
        isMobile={isMobile}
        selectedItems={tableActions.selectedItems}
        draggedItems={tableActions.draggedItems}
        onMove={handleShowMoveModal}
        onDelete={handleDeleteItems}
        onShare={(item) => {
          setShareItem(item);
          setShowShareModal(true);
        }}
        onDownload={handleDownload}
        onGrantPermission={handleGrantPermission}
      />

      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-2xl relative">
            <h3 className="font-bold text-lg mb-4 text-text-strong">
              {t("file.modal.move_folder_title")}
            </h3>
            <div className="max-h-60 overflow-y-auto mb-4">
              <div
                className={`p-2 rounded cursor-pointer mb-1 ${
                  moveTargetFolder && moveTargetFolder.id === null
                    ? "bg-brand-200"
                    : "hover:bg-brand-50"
                }`}
                onClick={() =>
                  setMoveTargetFolder({
                    id: null,
                    name: t("file.modal.move_outside_all"),
                  })
                }
              >
                {t("file.modal.move_outside_all")}
              </div>
              {data
                .filter((item) => item.type === "folder")
                .map((folder) => (
                  <div
                    key={folder.id}
                    className={`p-2 rounded cursor-pointer mb-1 ${
                      moveTargetFolder && moveTargetFolder.id === folder.id
                        ? "bg-brand-200"
                        : "hover:bg-brand-50"
                    }`}
                    onClick={() =>
                      setMoveTargetFolder({ id: folder.id, name: folder.name })
                    }
                  >
                    {t("file.modal.move_folder_option", {
                      folderName: folder.name,
                    })}
                  </div>
                ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 rounded bg-surface-50 text-text-strong border border-border"
              >
                {t("file.button.cancel")}
              </button>
              <button
                onClick={handleConfirmMove}
                className="px-4 py-2 rounded text-white bg-brand disabled:opacity-50"
                disabled={!moveTargetFolder}
              >
                {t("file.button.move")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUploadDropdown(false)}
        />
      )}

      <PermissionModal
        isOpen={showGrantPermissionModal}
        onClose={() => setShowGrantPermissionModal(false)}
        folder={grantPermissionTarget}
        onPermissionChange={resetAndReload}
      />

      <ImportByLinkModal
        isOpen={openImport}
        onClose={() => setOpenImport(false)}
        onImported={resetAndReload}
      />

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          fileUrl={previewUrl}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareItem(null);
        }}
        item={shareItem}
      />

      {/* DownloadStatus cho download progress */}
      {downloadBatch && (
        <DownloadStatus
          files={downloadBatch.files}
          folderName={downloadBatch.folderName}
          onComplete={() => {
            setDownloadBatch(null);
          }}
        />
      )}
    </div>
  );
}
