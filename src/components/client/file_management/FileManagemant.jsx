"use client";
import {
  FiFilter,
  FiSearch,
  FiPlus,
  FiList,
  FiGrid,
  FiChevronDown,
  FiUpload,
  FiFolderPlus,
  FiArrowLeft,
  FiLink,
} from "react-icons/fi";
import { BiSelectMultiple } from "react-icons/bi";
import Table from "@/components/ui/TableCustom";
import Card_file from "@/components/CardFile";
import UploadModal from "@/components/Upload_component";
import UploadMiniStatus from "@/components/UploadMiniStatus";
import ActionZone from "@/components/ui/ActionZone";
import PermissionModal from "@/components/client/file_management/PermissionModal";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonTable from "@/components/skeleton/SkeletonTable";
import EmptyState from "@/components/ui/EmptyState";
import SidebarFilter from "@/components/client/file_management/SidebarFilter";
import FilePreviewModal from "@/components/client/file_management/FilePreviewModal";
import useFileManagementPage from "@/hooks/leader/FileManagement/useFileManagementPage";
import ImportByLinkModal from "./ImportByLinkModal";

export default function YourFolder() {
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
    setOpenImport,
  } = useFileManagementPage();
  return (
    <div className="flex w-full min-h-screen bg-[#f7f8fa] relative">
      <div className="flex-1 flex flex-col items-start px-2 md:px-8 py-6">
        <div className="w-full max-w-2xl flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder={t("file.search.placeholder")}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-[15px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* action add */}
          <div className="relative">
            <button
              className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-[#1cadd9] hover:bg-[#00c3ff] text-white font-semibold shadow-md transition-all text-[15px]"
              onClick={() => setShowUploadDropdown(!showUploadDropdown)}
            >
              <FiPlus className="text-lg" />
              {t("file.button.upload")}
              <FiChevronDown
                className={`text-sm transition-transform ${
                  showUploadDropdown ? "rotate-180" : ""
                }`}
              />
            </button>
            {showUploadDropdown && (
              <div
                className="absolute top-full right-0 left-auto mt-1 w-64 max-w-[90vw] bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                style={{ minWidth: 180 }}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                  onClick={() => {
                    setShowUploadModal(true);
                    setShowUploadDropdown(false);
                  }}
                >
                  <FiUpload className="text-gray-600" />
                  <span className="text-gray-700">
                    {t("file.button.upload_files_folders")}
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-b-lg"
                  onClick={() => {
                    setShowCreateFolderModal(true);
                    setShowUploadDropdown(false);
                  }}
                >
                  <FiFolderPlus className="text-gray-600" />
                  <span className="text-gray-700">
                    {t("file.button.create_folder")}
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-b-lg"
                  onClick={() => {
                    setOpenImport(true);
                    setShowUploadDropdown(false);
                  }}
                >
                  <FiLink className="text-gray-600" />
                  <span className="text-gray-700">Tải bằng liên kết</span>
                </button>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-2 ml-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-gray-200 lg:flex">
            <button
              className={`p-2 rounded-lg transition-all text-lg ${
                viewMode === "grid"
                  ? "bg-[#e6f7fd] text-[#1cadd9] shadow"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              onClick={() => setViewMode("grid")}
              aria-label={t("file.button.view_grid")}
            >
              <FiGrid />
            </button>
            <button
              className={`p-2 rounded-lg transition-all text-lg ${
                viewMode === "list"
                  ? "bg-[#e6f7fd] text-[#1cadd9] shadow"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              onClick={() => setViewMode("list")}
              aria-label={t("file.button.view_list")}
            >
              <FiList />
            </button>
          </div>
          <div className="bg-white cursor-pointer rounded-xl px-1 py-1 shadow-sm border border-gray-200">
            <button
              aria-label="Chọn tất cả"
              title={
                areAllVisibleSelected(
                  tableActions?.selectedItems,
                  foldersToShowFiltered,
                  filesToShowFiltered
                )
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả trong thư mục này"
              }
              className={`p-2 rounded-lg transition ${
                areAllVisibleSelected(
                  tableActions?.selectedItems,
                  foldersToShowFiltered,
                  filesToShowFiltered
                )
                  ? "text-red-500 hover:bg-red-50"
                  : "text-[#1cadd9] hover:bg-gray-100"
              }`}
              onClick={() => {
                const allVisible = dedupeById([
                  ...foldersToShowFiltered,
                  ...filesToShowFiltered,
                ]);

                if (
                  areAllVisibleSelected(
                    tableActions?.selectedItems,
                    foldersToShowFiltered,
                    filesToShowFiltered
                  )
                ) {
                  tableActions.setSelectedItems([]);
                } else {
                  tableActions.setSelectedItems(allVisible);
                }
              }}
            >
              <span className="sr-only">Toggle chọn tất cả</span>
              <BiSelectMultiple />
            </button>
          </div>
        </div>

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
                      className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-gray-200"
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
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow hover:bg-blue-100 border border-gray-200 text-primary text-2xl mb-4 transition-all duration-150"
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
                />
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {foldersToShowFiltered.length === 0 &&
                  filesToShowFiltered.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center ">
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
                        />
                      )
                    )
                  )}
                </div>
              )}
              {loadingMore && (
                <div className="text-center py-4 text-gray-500">
                  {t("file.toast.loading_more")}
                </div>
              )}
              {hasMore && !loadingMore && (
                <div className="flex justify-center py-4">
                  <button
                    className="px-4 py-1.5 text-sm bg-primary text-white rounded-md shadow hover:bg-blue-600 transition min-w-[100px]"
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
          className="fixed bottom-6 right-6 z-40 bg-primary text-white p-3 rounded-full shadow-lg md:hidden hover:bg-[#189ec6] transition-all duration-200 hover:scale-110 active:scale-95"
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
            <h3 className="text-lg font-semibold mb-4 text-center">
              {t("file.modal.create_folder_title")}
            </h3>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
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
                className="relative flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600
               disabled:bg-blue-300 disabled:cursor-not-allowed disabled:hover:bg-blue-300"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>{t("file.button.create")}</span>
                  </span>
                ) : (
                  t("file.button.create")
                )}
              </button>

              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                {t("file.button.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadBatches.map((batch, idx) => (
        <UploadMiniStatus
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
        onDownload={handleDownload}
        onShare={() => {}}
        onGrantPermission={handleGrantPermission}
      />

      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-2xl relative">
            <h3 className="font-bold text-lg mb-4">
              {t("file.modal.move_folder_title")}
            </h3>
            <div className="max-h-60 overflow-y-auto mb-4">
              <div
                className={`p-2 rounded cursor-pointer mb-1 ${
                  moveTargetFolder && moveTargetFolder.id === null
                    ? "bg-blue-200"
                    : "hover:bg-blue-100"
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
                        ? "bg-blue-200"
                        : "hover:bg-blue-100"
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
                className="px-4 py-2 rounded bg-gray-200"
              >
                {t("file.button.cancel")}
              </button>
              <button
                onClick={handleConfirmMove}
                className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
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
    </div>
  );
}
