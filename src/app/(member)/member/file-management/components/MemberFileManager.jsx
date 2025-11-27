"use client";
import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Table from "@/features/file-management/components/TableFile";
import Card_file from "@/features/file-management/components/CardFile";
import UploadModal from "@/features/file-management/components/UploadModal";
import MiniStatus from "@/features/file-management/components/MiniStatus";
import { FiUpload, FiPlus, FiGrid, FiList } from "react-icons/fi";
import ActionZone from "@/features/file-management/components/ActionZone";
import Modal from "@/shared/ui/Modal";
import EmptyState from "@/shared/ui/EmptyState";
import useManagement from "../hooks/useManagement";
import FilePreviewModal from "@/features/file-management/components/FilePreviewModal";
import { toast } from "react-hot-toast";

export default function MemberFileManager() {
  const searchParams = useSearchParams();
  const {
    t,
    folders,
    loading,
    error,
    currentFolder,
    breadcrumb,
    view,
    data,
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
        name: item.originalName || item.name,
        type: item.type || "folder",
        size: item.size,
        mimeType: item.mimeType,
        url: item.url,
        date: item.createdAt,
        parentId: item.parentId,
        locked: item.locked,
        permissions: item.permissions,
      }));

    setData(next);
  }, [folders, currentFolder]);

  return (
    <div className="container w-full mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-strong mb-1">
            {t("member.page.title")}
          </h1>
          <p className="text-text-muted text-sm">
            {t("member.page.description")}
          </p>
        </div>
        <div className="flex gap-2 items-center">
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

      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm text-text-muted">
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

      {loading && (
        <div className="text-center text-text-muted py-12">
          {t("member.page.loading")}
        </div>
      )}
      {error && <div className="text-center text-danger py-12">{error}</div>}

      {!loading && !error && (
        <>
          {view === "table" ? (
            <Table
              header={tableHeader}
              data={data}
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
            />
          ) : (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.length === 0 && (
                <div className="col-span-full text-center text-text-muted py-8">
                  <EmptyState message={t("member.page.no_folders")} />
                </div>
              )}
              {data.map((item) => (
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
                />
              ))}
            </div>
          )}

          <UploadModal
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
            onStartUpload={handleStartUpload}
            parentId={currentFolder}
          />

          {showCreateFolder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-2xl relative">
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

          <ActionZone
            isMobile={typeof window !== "undefined" && window.innerWidth < 640}
            selectedItems={tableActions.selectedItems}
            draggedItems={tableActions.draggedItems}
            onMove={openMoveModal}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onShare={() => {}}
            onGrantPermission={() => {}}
            canGrantPermission={false}
          />

          {uploadBatches.map((batch, idx) => (
            <MiniStatus
              key={batch.id}
              files={batch.type === "file" ? batch.files : []}
              folders={batch.type === "folder" ? batch.files : []}
              emptyFolders={batch.type === "folder" ? batch.emptyFolders : []}
              batchId={batch.id}
              onComplete={() => {
                setUploadBatches((prev) =>
                  prev.filter((b) => b.id !== batch.id)
                );
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
        </>
      )}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          fileUrl={previewUrl}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
