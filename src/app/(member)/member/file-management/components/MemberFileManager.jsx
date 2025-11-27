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
  FiArrowLeft,
} from "react-icons/fi";
import ActionZone from "@/features/file-management/components/ActionZone";
import Modal from "@/shared/ui/Modal";
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

export default function MemberFileManager() {
  const searchParams = useSearchParams();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareItem, setShareItem] = useState(null);

  const {
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
      }));

    setData(next);
  }, [folders, currentFolder]);

  // Prepare display data
  const displayData = filteredData || data;

  return (
    <div className="flex w-full min-h-screen bg-surface-50 relative">
      <div className="flex-1 flex flex-col items-start px-2 md:px-6 py-6 lg:pr-[280px]">
        {/* Header */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-strong mb-1">
            {t("member.page.title")}
          </h1>
          <p className="text-text-muted text-sm">
            {t("member.page.description")}
          </p>
        </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={t("file.search.placeholder") || "Tìm kiếm..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>

          {currentFolder && (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-[var(--color-surface-50)] font-semibold text-sm shadow-sm hover:opacity-90 transition"
                onClick={() => setShowUpload(true)}
              >
                <FiUpload className="text-lg" /> {t("member.page.upload")}
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-[var(--color-surface-50)] font-semibold text-sm shadow-sm hover:opacity-90 transition"
                onClick={() => setShowCreateFolder(true)}
              >
                <FiPlus className="text-lg" /> {t("member.page.create_folder")}
              </button>
            </>
          )}
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-[var(--color-surface-50)] text-text-strong text-sm shadow-sm transition border-[var(--color-border)] ${
              view === "grid"
                ? "bg-brand text-[var(--color-surface-50)] border-brand"
                : "hover:opacity-90"
            }`}
            onClick={() => setView("grid")}
            title={t("member.page.view_grid")}
          >
            <FiGrid />
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-[var(--color-surface-50)] text-text-strong text-sm shadow-sm transition border-[var(--color-border)] ${
              view === "table"
                ? "bg-brand text-[var(--color-surface-50)] border-brand"
                : "hover:opacity-90"
            }`}
            onClick={() => setView("table")}
            title={t("member.page.view_table")}
          >
            <FiList />
          </button>
        </div>
      </div>

        {/* Main content area */}
        <div className="w-full">
          {/* Breadcrumb + Back button */}
          {currentFolder && (
            <div className="flex items-center gap-4 mb-4">
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow border border-border text-brand text-2xl transition-all duration-150 hover:opacity-90"
                onClick={() => setCurrentFolder(null)}
                title={t("file.button.back")}
              >
                <FiArrowLeft />
              </button>
      {breadcrumb.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
          <button
            className="hover:underline"
            onClick={() => setCurrentFolder(null)}
          >
            {t("member.page.root_folder")}
          </button>
          {breadcrumb.map((bc, idx) => (
            <React.Fragment key={bc.id}>
              <span>/</span>
              <button
                className="hover:underline"
                onClick={() => setCurrentFolder(bc.id)}
                disabled={idx === breadcrumb.length - 1}
              >
                {bc.name}
              </button>
            </React.Fragment>
          ))}
                </div>
              )}
        </div>
      )}

          {loading ? (
            <>
              {view === "table" ? (
                <SkeletonTable rows={8} />
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
              onRowClick={(item) =>
                item.type === "folder" &&
                !item.locked &&
                setCurrentFolder(item.id)
              }
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
            />
          ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {displayData.length === 0 && (
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
                      ? () => setCurrentFolder(item.id)
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
      <SidebarFilter
        isMobile={false}
        open
        loading={loading}
        filter={filter}
        onChangeFilter={setFilter}
        members={[]} // Member không có danh sách members
        hideMemberFilter={true}
      />

      {/* Sidebar Filter - Mobile */}
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

      {/* Mobile Filter Button */}
      {isMobile && !isSidebarOpen && (
        <button
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg md:hidden transition-all duration-200 hover:scale-110 active:scale-95 bg-brand text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label={t("file.sidebar.open_filter")}
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
        />
      )}

      {/* Download Progress */}
      {downloadBatch && (
        <DownloadStatus
          files={downloadBatch.files}
          folderName={downloadBatch.folderName}
          onComplete={() => setDownloadBatch(null)}
        />
      )}
    </div>
  );
}
