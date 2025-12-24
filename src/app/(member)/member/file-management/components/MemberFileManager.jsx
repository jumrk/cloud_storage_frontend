"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Table from "@/features/file-management/components/TableFile";
import Card_file from "@/features/file-management/components/CardFile";
import UploadModal from "@/features/file-management/components/UploadModal";
import MiniStatus from "@/features/file-management/components/MiniStatus";
import {
  FiUpload,
  FiPlus,
  FiGrid,
  FiList,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiFolderPlus,
  FiMessageCircle,
} from "react-icons/fi";
import { BiSelectMultiple } from "react-icons/bi";
import ActionZone from "@/features/file-management/components/ActionZone";
import EmptyState from "@/shared/ui/EmptyState";
import useManagement from "../hooks/useManagement";
import FilePreviewModal from "@/features/file-management/components/FilePreviewModal";
import ShareModal from "@/features/file-management/components/ShareModal";
import SidebarFilter from "@/features/file-management/components/SidebarFilter";
import DownloadStatus from "@/features/share/components/DownloadStatus";
import { toast } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonTable from "@/shared/skeletons/SkeletonTable";
import Breadcrumb from "@/shared/ui/Breadcrumb";
import Popover from "@/shared/ui/Popover";
import FileManagerChat from "@/features/file-management/components/FileManagerChat";

export default function MemberFileManager() {
  const searchParams = useSearchParams();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const {
    t,
    folders,
    loading,
    error,
    hasFetched,
    setHasFetched,
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
  } = useManagement();

  // Show toast if redirected from mobile blocked page
  useEffect(() => {
    const mobileBlocked = searchParams.get("mobile_blocked");
    if (mobileBlocked === "video") {
      toast.error(
        "Trình xử lý video chỉ hỗ trợ trên máy tính. Vui lòng sử dụng thiết bị có màn hình lớn hơn.",
        { duration: 5000 }
      );
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (currentFolder && folders.length) {
      setBreadcrumb(buildBreadcrumb(folders, currentFolder) || []);
    } else {
      setBreadcrumb([]);
    }
  }, [currentFolder, folders]);

  useEffect(() => {
    const source = currentFolder
      ? findFolderById(folders, currentFolder)?.children || []
      : folders;

    const next = (source || [])
      .filter((item) => !item.locked)
      .map((item) => ({
        id: item._id,
        _id: item._id,
        name: item.originalName || item.name,
        type: item.type || "folder",
        size: item.size,
        mimeType: item.mimeType,
        url: item.url,
        driveUrl: item.driveUrl,
        tempDownloadUrl: item.tempDownloadUrl,
        tempFileStatus: item.tempFileStatus,
        date: item.createdAt,
        parentId: item.parentId,
        locked: item.locked,
        permissions: item.permissions,
        fileCount: item.fileCount || 0,
      }));

    setData(next);
  }, [folders, currentFolder]);

  // Prepare display data
  const displayData = filteredData || data;

  return (
    <div className="flex w-full min-h-screen bg-surface-50 relative">
      <div className="flex-1 flex flex-col items-start px-2 md:px-6 py-6 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="w-full flex items-center justify-between gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder={t("file.search.placeholder") || "Tìm kiếm..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white shadow-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand text-[15px] text-text-strong placeholder:text-text-muted/60"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Upload Dropdown */}
            {currentFolder && (
              <div className="relative">
                <button
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-card transition-all text-[15px] bg-brand text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-brand"
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                >
                  <FiPlus className="text-lg" />
                  {t("member.page.upload")}
                  <FiChevronDown
                    className={`text-sm transition-transform ${
                      showUploadDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUploadDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUploadDropdown(false)}
                  />
                )}
                <Popover open={showUploadDropdown} className="right-0 left-auto w-64 max-w-[90vw]">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors rounded-t-lg"
                    onClick={() => {
                      setShowUpload(true);
                      setShowUploadDropdown(false);
                    }}
                  >
                    <FiUpload className="text-text-muted" />
                    <span className="text-text-strong">
                      {t("file.button.upload_files_folders") || "Tải lên tệp và thư mục"}
                    </span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors rounded-b-lg"
                    onClick={() => {
                      setShowCreateFolder(true);
                      setShowUploadDropdown(false);
                    }}
                  >
                    <FiFolderPlus className="text-text-muted" />
                    <span className="text-text-strong">
                      {t("file.button.create_folder") || "Tạo thư mục"}
                    </span>
                  </button>
                </Popover>
              </div>
            )}

            {/* View Toggle */}
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
                aria-label={t("member.page.view_grid")}
              >
                <FiGrid />
              </button>
              <button
                className={`p-2 rounded-lg transition-all text-lg ${
                  view === "table"
                    ? "shadow"
                    : "text-text-muted hover:bg-surface-50"
                }`}
                style={
                  view === "table"
                    ? {
                        background:
                          "color-mix(in srgb, var(--color-brand) 15%, transparent)",
                        color: "var(--color-brand)",
                      }
                    : undefined
                }
                onClick={() => setView("table")}
                aria-label={t("member.page.view_table")}
              >
                <FiList />
              </button>
            </div>

            {/* Select All */}
            <div className="bg-white rounded-xl px-1 py-1 shadow-sm border border-border">
              <button
                aria-label="Chọn tất cả"
                title={
                  displayData.length > 0 &&
                  displayData.every((item) =>
                    tableActions.selectedItems.find((i) => i.id === item.id)
                  )
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"
                }
                className="p-2 rounded-lg transition focus:outline-none focus:ring-2"
                style={{
                  color:
                    displayData.length > 0 &&
                    displayData.every((item) =>
                      tableActions.selectedItems.find((i) => i.id === item.id)
                    )
                      ? "var(--color-danger-500)"
                      : "var(--color-brand)",
                  background:
                    displayData.length > 0 &&
                    displayData.every((item) =>
                      tableActions.selectedItems.find((i) => i.id === item.id)
                    )
                      ? "color-mix(in srgb, var(--color-danger) 10%, transparent)"
                      : undefined,
                  boxShadow:
                    displayData.length > 0 &&
                    displayData.every((item) =>
                      tableActions.selectedItems.find((i) => i.id === item.id)
                    )
                      ? "none"
                      : undefined,
                }}
                onClick={() => {
                  const allSelected =
                    displayData.length > 0 &&
                    displayData.every((item) =>
                      tableActions.selectedItems.find((i) => i.id === item.id)
                    );
                  if (allSelected) {
                    tableActions.setSelectedItems([]);
                  } else {
                    tableActions.setSelectedItems(displayData);
                  }
                }}
              >
                <BiSelectMultiple />
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="w-full">
          {/* Breadcrumb - Only show when there are items or in a folder */}
          {(data.length > 0 || currentFolder !== null || breadcrumb.length > 0) && (
            <div className="w-full mb-2" style={{ minHeight: "28px" }}>
              <Breadcrumb
                items={currentFolder ? breadcrumb.map((bc) => ({
                  id: bc.id,
                  label: bc.name || "Unknown",
                })) : []}
                onItemClick={(folderId) => {
                  setHasFetched(false); // Reset hasFetched when folder changes to show loading skeleton
                  if (folderId === null) {
                    setCurrentFolder(null);
                  } else {
                    setCurrentFolder(folderId);
                  }
                }}
              />
            </div>
          )}

          {loading ? (
            <>
              {view === "table" ? (
                <SkeletonTable rows={8} />
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-2 lg:gap-3">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-border"
                    >
                      <Skeleton circle width={48} height={48} className="mb-2" />
                      <Skeleton width={80} height={18} className="mb-1" />
                      <Skeleton width={60} height={14} />
                    </div>
                  ))}
        </div>
      )}
            </>
          ) : error ? (
            <div className="text-center text-danger py-12">{error}</div>
          ) : (
        <>
          {view === "table" ? (
            <Table
              header={tableHeader}
                  data={displayData}
              selectedItems={tableActions.selectedItems}
              onSelectItem={tableActions.handleSelectItem}
              onSelectAll={tableActions.handleSelectAll}
              draggedItems={tableActions.draggedItems}
              onDragStart={tableActions.handleDragStart}
              onDragEnd={tableActions.handleDragEnd}
              onRename={tableActions.handleRename}
              onMoveItem={handleMoveItems}
              onRowClick={(item) => {
                if (item.type === "folder" && !item.locked) {
                  setHasFetched(false); // Reset hasFetched when folder changes to show loading skeleton
                  setCurrentFolder(item.id);
                }
              }}
              handleChecked={() => {}}
              onPreviewFile={handlePreview}
              loadingMore={false}
                  onShare={(item) => {
                    setShareItem(item);
                    setShowShareModal(true);
                  }}
                  onDownload={handleDownload}
                  isFavoriteItem={isItemFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteLoadingId={favoriteLoadingId}
                  hasFetched={hasFetched}
            />
          ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-2 lg:gap-3">
                  {hasFetched && displayData.length === 0 && (
                <div className="col-span-full text-center text-text-muted py-8">
                  <EmptyState message={t("member.page.no_folders")} />
                </div>
              )}
                  {displayData.map((item) => (
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
                    item.type === "folder" && !item.locked
                      ? () => {
                          setHasFetched(false); // Reset hasFetched when folder changes to show loading skeleton
                          setCurrentFolder(item.id);
                        }
                      : undefined
                  }
                  onPreviewFile={
                    item.type === "file" ? () => handlePreview(item) : undefined
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
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Sidebar Filter - Desktop */}
      {!isMobile && (
        <>
          {isSidebarOpen && (
            <div
              className="hidden lg:block fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <SidebarFilter
            isMobile={false}
            open={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            loading={loading}
            filter={filter}
            onChangeFilter={setFilter}
            members={[]} // Member không có danh sách members
            hideMemberFilter={true}
          />
        </>
      )}

      {/* Sidebar Filter - Mobile */}
      {isMobile && (
        <>
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <SidebarFilter
            isMobile={isMobile}
            open={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            loading={loading}
            filter={filter}
            onChangeFilter={setFilter}
            members={[]}
            hideMemberFilter={true}
          />
        </>
      )}

      {/* Toggle Filter Button - Show on both mobile and desktop when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          className={`fixed z-40 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 bg-brand text-white ${
            isMobile
              ? "bottom-6 right-6 md:hidden"
              : "bottom-6 right-6 lg:block hidden"
          }`}
          onClick={() => setSidebarOpen(true)}
          aria-label={t("file.sidebar.open_filter") || "Mở bộ lọc"}
        >
          <FiFilter className="text-2xl" />
        </button>
      )}

      {/* Upload Modal */}
          <UploadModal
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
            onStartUpload={handleStartUpload}
            parentId={currentFolder}
          />

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-md w-full shadow-2xl relative">
            <h3 className="font-bold text-lg mb-4 text-text-strong">
              {t("member.modal.create_folder_title")}
            </h3>
            <input
              type="text"
              className="w-full border border-[var(--color-border)] rounded px-3 py-2 mb-4"
              placeholder={t("member.modal.folder_name_placeholder")}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 rounded bg-surface-soft text-text-strong hover:opacity-90 transition"
              >
                {t("member.modal.cancel")}
              </button>
              <button
                onClick={queueCreateFolder}
                className="px-4 py-2 rounded bg-brand text-[var(--color-surface-50)] hover:opacity-90 transition"
                disabled={!newFolderName.trim()}
              >
                {t("member.modal.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
          {showMoveModal && (
            <Modal onClose={() => setShowMoveModal(false)}>
              <div className="p-6 min-w-[320px] flex flex-col items-center">
                <div className="text-xl font-semibold mb-2 text-brand">
                  {t("member.modal.select_destination_title")}
                </div>
                <div className="mb-4 text-text-strong text-center">
                  {t("member.modal.select_destination_description")}:
                </div>
                <div className="max-h-60 overflow-y-auto w-full mb-4">
                  <div
                    className={`p-2 rounded cursor-pointer mb-1 ${
                      moveTargetFolder && moveTargetFolder.id === null
                        ? "bg-brand/20"
                        : "hover:bg-brand/10"
                    }`}
                    onClick={() =>
                      setMoveTargetFolder({
                        id: null,
                        name: t("member.modal.move_to_root"),
                      })
                    }
                  >
                    📁 {t("member.modal.move_to_root")}
                  </div>
                  {renderFolderTree(folders)}
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 rounded bg-surface-soft text-text-strong hover:opacity-90 transition"
                  >
                    {t("member.modal.cancel")}
                  </button>
                  <button
                    onClick={handleConfirmMove}
                    className="px-4 py-2 rounded bg-brand text-[var(--color-surface-50)] hover:opacity-90 transition"
                    disabled={!moveTargetFolder}
                  >
                    {t("member.modal.move")}
                  </button>
                </div>
              </div>
            </Modal>
          )}

      {/* Action Zone */}
          <ActionZone
        isMobile={isMobile}
            selectedItems={tableActions.selectedItems}
            draggedItems={tableActions.draggedItems}
            onMove={openMoveModal}
            onDownload={handleDownload}
            onDelete={handleDelete}
        onShare={(items) => {
          const item = Array.isArray(items) ? items[0] : items;
          if (item) {
            setShareItem(item);
            setShowShareModal(true);
          }
        }}
            onGrantPermission={() => {}}
            canGrantPermission={false}
          />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareItem(null);
        }}
        item={shareItem}
      />

      {/* Upload Batches */}
          {uploadBatches.map((batch, idx) => (
            <MiniStatus
              key={batch.id}
              files={batch.type === "file" ? batch.files : []}
              folders={batch.type === "folder" ? batch.files : []}
              emptyFolders={batch.type === "folder" ? batch.emptyFolders : []}
              batchId={batch.id}
              onComplete={() => {
            setUploadBatches((prev) => prev.filter((b) => b.id !== batch.id));
                fetchFolders();
              }}
              style={{ marginBottom: idx > 0 ? 12 : 12 }}
              batchType={batch.type}
              folderName={
                batch.type === "create_folder"
                  ? batch.folderName || batch.name
                  : undefined
              }
              parentId={currentFolder}
              moveItems={
                batch.type === "move" || batch.type === "delete"
                  ? batch.items
                  : undefined
              }
              moveTargetFolderId={
                batch.type === "move" ? batch.targetFolderId : undefined
              }
              item={batch.type === "rename" ? batch.item : undefined}
              useChunkedUpload={batch.useChunkedUpload}
            />
          ))}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          fileUrl={previewUrl}
          onClose={() => setPreviewFile(null)}
          onOpen={() => setShowChat(false)}
        />
      )}

      {/* Download Progress */}
      {downloadBatch && (
        <DownloadStatus
          files={downloadBatch.files}
          folderName={downloadBatch.folderName}
          onComplete={() => setDownloadBatch(null)}
          onCancel={(fileIdOrName) => {
            // If no fileIdOrName provided, cancel all (from main cancel button if exists)
            if (!fileIdOrName) {
              // Cancel single file download
              if (downloadControllerRef?.current) {
                downloadControllerRef.current.abort();
                downloadControllerRef.current = null;
              }
              // Cancel multiple file downloads
              if (downloadControllersRef?.current) {
                downloadControllersRef.current.forEach((controller) => {
                  controller.abort();
                });
                downloadControllersRef.current.clear();
              }
              // Update all files to cancelled
              setDownloadBatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: prev.files.map((f) => ({
                    ...f,
                    status: f.status === "downloading" ? "cancelled" : f.status,
                  })),
                };
              });
              // Clear downloading state
              downloadingFileIdsRef.current.clear();
              isDownloadingRef.current = false;
              // Close after 1 second
              setTimeout(() => {
                setDownloadBatch(null);
              }, 1000);
              return;
            }

            // Cancel specific file
            const fileId = String(fileIdOrName);
            
            // Find and cancel the specific controller
            const controller = downloadControllersRef?.current?.get(fileId);
            if (controller) {
              controller.abort();
              downloadControllersRef.current.delete(fileId);
            }

            // Remove from downloading set
            downloadingFileIdsRef.current.delete(fileId);

            // Update only the cancelled file status
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              const updatedFiles = prev.files.map((f) => {
                const fId = String(f.id || f.name);
                if (fId === fileId && f.status === "downloading") {
                  return { ...f, status: "cancelled" };
                }
                return f;
              });

              // Check if all files are done
              const allDone = updatedFiles.every(
                (f) => f.status === "success" || f.status === "error" || f.status === "cancelled"
              );

              // If all done and no files are downloading, reset flag
              if (allDone && !updatedFiles.some((f) => f.status === "downloading")) {
                isDownloadingRef.current = false;
              }

              return {
                ...prev,
                files: updatedFiles,
              };
            });
          }}
        />
      )}

      {/* Toggle Chat Button */}
      <button
        className={`fixed z-40 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 bg-brand text-white ${
          isMobile
            ? "bottom-6 right-6 md:hidden"
            : "bottom-6 right-6 lg:block hidden"
        } ${showChat ? "opacity-0 pointer-events-none" : ""}`}
        onClick={() => setShowChat(true)}
        aria-label={t("file.chat.open_chat") || "Mở trợ lý AI"}
        style={{ bottom: isSidebarOpen ? "calc(6rem + 12px)" : "6rem" }}
      >
        <FiMessageCircle className="text-2xl" />
      </button>

      {/* AI Chat Assistant */}
      <FileManagerChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentFolderId={currentFolder}
        folders={displayData.filter((item) => item.type === "folder")}
        files={displayData.filter((item) => item.type === "file")}
        onNavigateToFile={(file) => {
          handlePreview(file);
          setShowChat(false);
        }}
        onNavigateToFolder={(folder) => {
          setHasFetched(false);
          setCurrentFolder(folder.id || folder._id);
          setShowChat(false);
        }}
      />
    </div>
  );
}
