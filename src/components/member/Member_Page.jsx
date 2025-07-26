"use client";
import React, { useState, useEffect, useRef } from "react";
import Table from "@/components/ui/Table_custom";
import Card_file from "@/components/card_file";
import Upload_component from "@/components/Upload_component";
import UploadMiniStatus from "@/components/UploadMiniStatus";
import toast from "react-hot-toast";
import { FiUpload, FiPlus, FiGrid, FiList, FiArrowLeft } from "react-icons/fi";
import ActionZone from "@/components/ui/ActionZone";
import Modal from "@/components/Modal";
import axiosClient from "@/lib/axiosClient";
import EmptyState from "../ui/EmptyState";
import useHomeTableActions from "@/hook/useHomeTableActions";
import { useTranslations } from "next-intl";

export default function MemberFileManager() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const t = useTranslations();
  const [currentFolder, setCurrentFolder] = useState(null); // object
  const [breadcrumb, setBreadcrumb] = useState([]); // [{id, name}]
  const [view, setView] = useState("grid"); // 'grid' | 'table'
  const [showUpload, setShowUpload] = useState(false);
  const [uploadBatches, setUploadBatches] = useState([]);
  const [uploadingBatchId, setUploadingBatchId] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pendingDeleteItems, setPendingDeleteItems] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [pendingMoveItems, setPendingMoveItems] = useState([]);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Helper: tìm folder theo id trong toàn bộ cây (đưa lên trên để tránh lỗi hoisting)
  const findFolderById = (folders, id) => {
    for (const folder of folders) {
      if (String(folder._id) === String(id)) return folder;
      if (folder.children && folder.children.length > 0) {
        const found = findFolderById(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Dùng chung hook với leader
  const tableActions = useHomeTableActions({
    data: (currentFolder
      ? findFolderById(folders, currentFolder)?.children || []
      : folders
    )
      .filter((item) => !item.locked)
      .map((item) => ({
        id: item._id,
        name: item.originalName || item.name,
        type: item.type || "folder",
        size: item.size,
        date: item.createdAt,
        parentId: item.parentId,
        locked: item.locked,
        permissions: item.permissions,
      })),
    setData: () => {}, // Không cần setData ở member, chỉ dùng để đồng bộ API
  });

  // Fetch folders tree
  const fetchFolders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/api/member/folders");
      const data = res.data;
      setFolders(data.folders || []);
    } catch {
      setError(t("member.page.load_folders_error"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Helper: build breadcrumb
  const buildBreadcrumb = (folders, id, path = []) => {
    for (const folder of folders) {
      if (String(folder._id) === String(id)) {
        return [...path, { id: folder._id, name: folder.name }];
      }
      if (folder.children) {
        const res = buildBreadcrumb(folder.children, id, [
          ...path,
          { id: folder._id, name: folder.name },
        ]);
        if (res) return res;
      }
    }
    return null;
  };

  // Xác định folder hiện tại
  const current = currentFolder ? findFolderById(folders, currentFolder) : null;
  const folderChildren = current ? current.children || [] : folders;

  // Breadcrumb
  useEffect(() => {
    if (currentFolder && folders.length > 0) {
      const bc = buildBreadcrumb(folders, currentFolder) || [];
      setBreadcrumb(bc);
    } else {
      setBreadcrumb([]);
    }
  }, [currentFolder, folders]);

  // Xử lý upload
  const handleStartUpload = (batches) => {
    // Thêm thông tin chunked upload cho các file lớn
    const enhancedBatches = batches.map((batch) => ({
      ...batch,
      useChunkedUpload:
        batch.type === "file" &&
        batch.files.some((file) => file.size > 5 * 1024 * 1024), // 5MB
    }));
    setUploadBatches(enhancedBatches);
    setUploadingBatchId(Date.now().toString());
    setShowUpload(false);
  };

  // Xử lý chọn item (multi-select)
  const handleSelectItem = (item) => {
    setSelectedItems((prev) => {
      // So sánh cả id và _id để chắc chắn
      if (prev.find((i) => (i.id || i._id) === (item.id || item._id))) {
        return prev.filter((i) => (i.id || i._id) !== (item.id || item._id));
      } else {
        return [...prev, item];
      }
    });
  };
  const handleSelectAll = () => {
    if (selectedItems.length === folderChildren.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(folderChildren);
    }
  };

  // Xử lý drag
  const handleDragStart = (item) => setDraggedItems([item]);
  const handleDragEnd = () => setDraggedItems([]);

  // Đổi tên file/folder
  const handleRename = (id, type, newName) => {
    setRenameTarget({ id, type });
    setRenameValue(newName || "");
    setShowRenameModal(true);
  };
  const handleConfirmRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      const res = await axiosClient.post("/api/upload/rename", {
        id: renameTarget.id,
        type: renameTarget.type,
        newName: renameValue.trim(),
      });
      if (res.data && res.data.success) {
        fetchFolders();
      } else if (res.data && res.data.error) {
        toast.error(res.data.error);
      }
    } catch {
      // Không thông báo cứng, chỉ log nếu cần
    }
    setShowRenameModal(false);
    setRenameTarget(null);
    setRenameValue("");
  };

  // Di chuyển file/folder
  const handleMoveItems = async (items, targetFolderId) => {
    try {
      const res = await axiosClient.post("/api/upload/move", {
        items: items.map((item) => ({
          id: item.id || item._id,
          type: item.type === "folder" ? "folder" : "file",
        })),
        targetFolderId,
      });
      if (res.data && res.data.success) {
        fetchFolders();
        setShowMoveModal(false);
        setPendingMoveItems([]);
        setMoveTargetFolder(null);
        tableActions.setSelectedItems([]);
      } else if (res.data && res.data.error) {
        toast.error(res.data.error);
        setShowMoveModal(false);
        setPendingMoveItems([]);
        setMoveTargetFolder(null);
      }
    } catch (err) {
      setShowMoveModal(false);
      setPendingMoveItems([]);
      setMoveTargetFolder(null);
    }
  };

  // Xử lý xóa file/folder
  const handleDelete = (items) => {
    if (!items || items.length === 0) return;
    setPendingDeleteItems(items);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteItems || pendingDeleteItems.length === 0) return;
    setShowConfirmDelete(false);
    try {
      const res = await axiosClient.post("/api/upload/delete", {
        items: pendingDeleteItems.map((item) => ({
          id: item.id || item._id,
          type: item.type === "folder" ? "folder" : "file",
        })),
      });
      const data = res.data;
      if (data.success) {
        fetchFolders();
        setSelectedItems && setSelectedItems([]); // reset sau khi xóa
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err) {
      // Không thông báo cứng, chỉ log nếu cần
    }
    setPendingDeleteItems([]);
  };

  // Xử lý di chuyển file/folder
  const handleMove = (items) => {
    if (!items || items.length === 0) return;
    setPendingMoveItems(items);
    setShowMoveModal(true);
    setMoveTargetFolder(null);
  };

  // Table header
  const tableHeader = [
    t("member.table.name"),
    t("member.table.size"),
    t("member.table.date"),
    t("member.table.share"),
  ];

  // Chuẩn hóa data cho Table_custom và Card_file
  const normalizedData = folderChildren
    .filter((item) => !item.locked)
    .map((item) => ({
      id: item._id,
      name: item.originalName || item.name,
      type: item.type || "folder",
      size: item.size,
      date: item.createdAt,
      parentId: item.parentId,
      locked: item.locked,
      permissions: item.permissions,
      // ... các trường khác nếu cần
    }));

  // Đệ quy render cây thư mục cho modal chọn folder đích
  const renderFolderTree = (folders, level = 0) => {
    return folders
      .filter((item) => item._id !== undefined)
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
              setMoveTargetFolder({
                id: folder._id,
                name: folder.name,
              })
            }
          >
            📁 {folder.name}
          </div>
          {folder.children &&
            folder.children.length > 0 &&
            renderFolderTree(folder.children, level + 1)}
        </React.Fragment>
      ));
  };

  return (
    <>
      {/* Header + Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t("member.page.title")}
          </h1>
          <p className="text-gray-500 text-sm">
            {t("member.page.description")}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {currentFolder && (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm shadow-sm hover:bg-blue-700"
                onClick={() => setShowUpload(true)}
              >
                <FiUpload className="text-lg" /> {t("member.page.upload")}
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm shadow-sm hover:bg-green-700"
                onClick={() => setShowCreateFolder(true)}
              >
                <FiPlus className="text-lg" /> {t("member.page.create_folder")}
              </button>
            </>
          )}
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm ${
              view === "grid" ? "bg-primary text-white" : "hover:bg-gray-50"
            }`}
            onClick={() => setView("grid")}
            title={t("member.page.view_grid")}
          >
            <FiGrid />
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm ${
              view === "table" ? "bg-primary text-white" : "hover:bg-gray-50"
            }`}
            onClick={() => setView("table")}
            title={t("member.page.view_table")}
          >
            <FiList />
          </button>
        </div>
      </div>
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
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
      {/* Loading/error state */}
      {loading && (
        <div className="text-center text-gray-400 py-12">
          {t("member.page.loading")}
        </div>
      )}
      {error && <div className="text-center text-red-500 py-12">{error}</div>}
      {/* Main content */}
      {!loading && !error && (
        <>
          {view === "table" ? (
            <Table
              header={tableHeader}
              data={normalizedData}
              selectedItems={tableActions.selectedItems}
              onSelectItem={tableActions.handleSelectItem}
              onSelectAll={tableActions.handleSelectAll}
              draggedItems={tableActions.draggedItems}
              onDragStart={tableActions.handleDragStart}
              onDragEnd={tableActions.handleDragEnd}
              onRename={handleRename}
              onMoveItem={handleMoveItems}
              onRowClick={(item) => {
                if (item.type === "folder" && !item.locked) {
                  setCurrentFolder(item.id);
                }
              }}
              onPreviewFile={(item) => {
                // Không thông báo cứng
              }}
              handleChecked={() => {}}
              loadingMore={false}
            />
          ) : (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {normalizedData.length === 0 && (
                <div className="col-span-full text-center text-gray-400 py-8">
                  <EmptyState message={t("member.page.no_folders")} />
                </div>
              )}
              {normalizedData.map((item) => (
                <Card_file
                  key={item.id}
                  data={item}
                  selectedItems={tableActions.selectedItems}
                  onSelectItem={tableActions.handleSelectItem}
                  draggedItems={tableActions.draggedItems}
                  onDragStart={tableActions.handleDragStart}
                  onDragEnd={tableActions.handleDragEnd}
                  onRename={handleRename}
                  onMoveItem={handleMoveItems}
                  onClick={
                    item.type === "folder" && !item.locked
                      ? () => setCurrentFolder(item.id)
                      : undefined
                  }
                  onPreviewFile={() => {
                    // Không thông báo cứng
                  }}
                />
              ))}
            </div>
          )}
          {/* Upload Modal */}
          <Upload_component
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
            onStartUpload={handleStartUpload}
            parentId={currentFolder}
          />
          {/* Modal tạo thư mục */}
          {showCreateFolder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-2xl relative">
                <h3 className="font-bold text-lg mb-4">
                  {t("member.modal.create_folder_title")}
                </h3>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                  placeholder={t("member.modal.folder_name_placeholder")}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCreateFolder(false)}
                    className="px-4 py-2 rounded bg-gray-200"
                  >
                    {t("member.modal.cancel")}
                  </button>
                  <button
                    onClick={async () => {
                      if (!newFolderName.trim()) return;
                      try {
                        const res = await axiosClient.post(
                          "/api/member/folders",
                          {
                            name: newFolderName.trim(),
                            parentId: currentFolder,
                          }
                        );
                        if (res.data && res.data.success) {
                          setShowCreateFolder(false);
                          setNewFolderName("");
                          fetchFolders();
                        } else if (res.data && res.data.error) {
                          toast.error(res.data.error);
                        }
                      } catch {}
                    }}
                    className="px-4 py-2 rounded bg-green-600 text-white"
                  >
                    {t("member.modal.create")}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Upload status */}
          {uploadBatches.length > 0 && (
            <UploadMiniStatus
              key={uploadingBatchId}
              files={uploadBatches.find((b) => b.type === "file")?.files}
              folders={uploadBatches.find((b) => b.type === "folder")?.files}
              emptyFolders={
                uploadBatches.find((b) => b.type === "folder")?.emptyFolders
              }
              batchId={uploadingBatchId}
              parentId={currentFolder}
              useChunkedUpload={
                uploadBatches.find((b) => b.type === "file")?.useChunkedUpload
              }
              onComplete={() => {
                setUploadBatches([]);
                setUploadingBatchId(null);
                fetchFolders();
              }}
            />
          )}
          {/* ActionZone cho mobile/desktop */}
          <ActionZone
            isMobile={typeof window !== "undefined" && window.innerWidth < 640}
            selectedItems={tableActions.selectedItems}
            draggedItems={tableActions.draggedItems}
            onMove={(items) => {
              setPendingMoveItems(items);
              setShowMoveModal(true);
              setMoveTargetFolder(null);
            }}
            onDownload={() => {}}
            onDelete={handleDelete}
            onShare={() => {}}
            onGrantPermission={() => {}}
            canGrantPermission={false}
          />
          {/* Modal đổi tên */}
          {showRenameModal && (
            <Modal onClose={() => setShowRenameModal(false)}>
              <div className="p-6 min-w-[320px] flex flex-col items-center">
                <div className="text-xl font-semibold mb-2 text-blue-600">
                  {t("member.modal.rename_title")}
                </div>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                  placeholder={t("member.modal.new_name_placeholder")}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRenameModal(false)}
                    className="px-4 py-2 rounded bg-gray-200"
                  >
                    {t("member.modal.cancel")}
                  </button>
                  <button
                    onClick={handleConfirmRename}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                    disabled={!renameValue.trim()}
                  >
                    {t("member.modal.rename")}
                  </button>
                </div>
              </div>
            </Modal>
          )}
          {/* Modal chọn thư mục đích khi di chuyển (sửa lại gọi handleMoveItems) */}
          {showMoveModal && (
            <Modal onClose={() => setShowMoveModal(false)}>
              <div className="p-6 min-w-[320px] flex flex-col items-center">
                <div className="text-xl font-semibold mb-2 text-blue-600">
                  {t("member.modal.select_destination_title")}
                </div>
                <div className="mb-4 text-gray-700 text-center">
                  {t("member.modal.select_destination_description")}:
                </div>
                <div className="max-h-60 overflow-y-auto w-full mb-4">
                  <div
                    className={`p-2 rounded cursor-pointer mb-1 ${
                      moveTargetFolder && moveTargetFolder.id === null
                        ? "bg-blue-200"
                        : "hover:bg-blue-100"
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
                    className="px-4 py-2 rounded bg-gray-200"
                  >
                    {t("member.modal.cancel")}
                  </button>
                  <button
                    onClick={() =>
                      handleMoveItems(pendingMoveItems, moveTargetFolder?.id)
                    }
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                    disabled={!moveTargetFolder}
                  >
                    {t("member.modal.move")}
                  </button>
                </div>
              </div>
            </Modal>
          )}
          {/* Modal xác nhận xóa */}
          {showConfirmDelete && (
            <Modal onClose={() => setShowConfirmDelete(false)}>
              <div className="p-6 flex flex-col items-center">
                <div className="text-xl font-semibold mb-2 text-red-600">
                  {t("member.modal.confirm_delete_title")}
                </div>
                <div className="mb-4 text-gray-700 text-center">
                  {t("member.modal.confirm_delete_message", {
                    count: pendingDeleteItems.length,
                  })}
                  <br />
                  {t("member.modal.confirm_delete_warning")}
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-4 py-2 rounded bg-gray-200"
                  >
                    {t("member.modal.cancel")}
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded bg-red-600 text-white"
                  >
                    {t("member.modal.delete")}
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </>
  );
}
