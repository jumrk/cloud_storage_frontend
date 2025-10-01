"use client";
import React, { useState, useEffect } from "react";
import Table from "@/components/ui/TableCustom";
import Card_file from "@/components/CardFile";
import Upload_component from "@/components/Upload_component";
import UploadMiniStatus from "@/components/UploadMiniStatus";
import { FiUpload, FiPlus, FiGrid, FiList } from "react-icons/fi";
import ActionZone from "@/components/ui/ActionZone";
import Modal from "@/components/Modal";
import axiosClient from "@/lib/axiosClient";
import useHomeTableActions from "@/lib/hook/useHomeTableActions";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/ui/EmptyState";
import toast from "react-hot-toast";

export default function MemberFileManager() {
  const t = useTranslations();

  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [view, setView] = useState("grid");
  const [data, setData] = useState([]);
  const [uploadBatches, setUploadBatches] = useState([]);

  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [pendingMoveItems, setPendingMoveItems] = useState([]);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);

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

  useEffect(() => {
    fetchFolders();
  }, []);

  const current = currentFolder ? findFolderById(folders, currentFolder) : null;

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
      // ?id=<id>
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

  const handleDownload = async (items) => {
    const list =
      Array.isArray(items) && items.length ? items : tableActions.selectedItems;
    if (!list || !list.length) return;

    const getNameFromCD = (cd = "") => {
      const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
      const raw = decodeURIComponent(m?.[1] || m?.[2] || "");
      return raw || "download";
    };

    for (const item of list) {
      const rawUrl = getPreferredDownloadUrl(item);
      if (!rawUrl) continue;

      if (isTempApi(rawUrl)) {
        try {
          const res = await axiosClient.get(rawUrl, { responseType: "blob" });
          const cd = res.headers?.["content-disposition"] || "";
          const headerName = getNameFromCD(cd);
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
        } catch (e) {
          toast.error("Tải xuống thất bại");
        }
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
  };

  const tableHeader = [
    t("member.table.name"),
    t("member.table.size"),
    t("member.table.date"),
    t("member.table.share"),
  ];

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

  return (
    <div className="container w-full mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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

      {loading && (
        <div className="text-center text-gray-400 py-12">
          {t("member.page.loading")}
        </div>
      )}
      {error && <div className="text-center text-red-500 py-12">{error}</div>}

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
              onPreviewFile={() => {}}
              handleChecked={() => {}}
              loadingMore={false}
            />
          ) : (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.length === 0 && (
                <div className="col-span-full text-center text-gray-400 py-8">
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
                  onPreviewFile={() => {}}
                />
              ))}
            </div>
          )}

          <Upload_component
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
            onStartUpload={handleStartUpload}
            parentId={currentFolder}
          />

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
                    onClick={queueCreateFolder}
                    className="px-4 py-2 rounded bg-green-600 text-white"
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
                    onClick={handleConfirmMove}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
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
            <UploadMiniStatus
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
    </div>
  );
}
