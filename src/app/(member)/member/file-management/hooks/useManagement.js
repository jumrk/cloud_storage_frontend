import React, { useCallback, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";
import useHomeTableActions from "@/features/file-management/hooks/useHomeTableActions";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export default function useManagement() {
  const t = useTranslations();

  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [view, setView] = useState("grid");
  const [data, setData] = useState([]);
  const [uploadBatches, setUploadBatches] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
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

  const handlePreview = useCallback((file) => {
    setPreviewFile(file);
    setPreviewUrl(file.url || "");
  }, []);
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

  return {
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
  };
}
