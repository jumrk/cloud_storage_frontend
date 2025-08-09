"use client";
import React, { useState, useEffect, useRef } from "react";
import { getFileIcon } from "@/utils/getFileIcon";
import {
  FiLayers,
  FiUser,
  FiLink,
  FiFilter,
  FiX,
  FiSearch,
  FiPlus,
  FiList,
  FiGrid,
  FiChevronDown,
  FiUpload,
  FiFolderPlus,
  FiArrowLeft,
} from "react-icons/fi";
import useHomeTableActions from "@/hook/useHomeTableActions";
import Table from "@/components/ui/Table_custom";
import Card_file from "@/components/card_file";
import UploadModal from "@/components/Upload_component";
import UploadMiniStatus from "@/components/UploadMiniStatus";
import { v4 as uuidv4 } from "uuid";
import ActionZone from "@/components/ui/ActionZone";
import PermissionModal from "@/components/client/file_management/PermissionModal";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonTable from "@/components/ui/SkeletonTable";
import axiosClient from "@/lib/axiosClient";
import EmptyState from "@/components/ui/EmptyState";
import FilePreviewModal from "./FilePreviewModal";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

// Lấy tất cả ext từ extMap trong getFileIcon
const extMap = {
  png: "png.png",
  jpg: "png.png",
  jpeg: "png.png",
  gif: "png.png",
  mp4: "mp4.png",
  mp3: "mp3.png",
  pdf: "pdf.png",
  doc: "word.png",
  docx: "word.png",
  xls: "xls.png",
  xlsx: "xls.png",
  ppt: "ppt.png",
  pptx: "ppt.png",
  zip: "zip.png",
  rar: "zip.png",
  txt: "txt.png",
  sql: "sql.png",
  html: "html.png",
  fig: "fig.png",
  ico: "png.png",
  psd: "psd.png",
  ai: "Ai.png",
  eml: "eml.png",
  cal: "cal.png",
  folder: "file.png",
  sketch: "sketch.png",
  inndd: "inndd.png",
  "3d": "3d.png",
  ae: "ae.png",
  locked: "locked.png",
};

// Hàm lấy icon cho file, nếu không có thì trả về word.png
function getIconForFile(name) {
  if (!name) return "/images/icon/word.png";
  const ext = name.split(".").pop().toLowerCase();
  return `/images/icon/${extMap[ext] || "word.png"}`;
}

const fileTypes = Object.keys(extMap).map((ext) => ({
  key: ext,
  label: ext.toUpperCase(),
}));

function SidebarFilter({
  isMobile,
  open,
  onClose,
  loading,
  filter,
  onChangeFilter,
  members,
}) {
  const t = useTranslations();
  // Nếu là mobile và chưa open thì không render
  if (isMobile && !open) return null;
  return (
    <>
      {/* Overlay cho mobile */}
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-screen w-[270px] bg-white border-l border-gray-100 flex flex-col px-0 py-6 gap-2 z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out transform ${
          isMobile
            ? open
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
            : "lg:translate-x-0 lg:opacity-100 hidden lg:flex"
        }`}
        style={{
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderBottomLeftRadius: isMobile ? 16 : 0,
          boxShadow: isMobile ? "0 0 20px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {/* Nút đóng trên mobile */}
        {isMobile && (
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-primary text-2xl z-10 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={onClose}
            aria-label={t("file.sidebar.close_filter")}
          >
            <FiX />
          </button>
        )}
        {/* Loại */}
        <div className="px-4 mb-2 mt-2">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[14px] mb-1">
            <FiLayers className="text-primary text-lg" />
            {t("file.sidebar.type")}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={60} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-800 group text-[13px] ${
                    filter.type === "all"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "all" })}
                >
                  {t("file.sidebar.all")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-700 group text-[13px] ${
                    filter.type === "file"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "file" })}
                >
                  {t("file.sidebar.file")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-700 group text-[13px] ${
                    filter.type === "folder"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "folder" })}
                >
                  {t("file.sidebar.folder")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
              </>
            )}
          </ul>
        </div>
        {/* Tài khoản */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[14px] mb-1">
            <FiUser className="text-primary text-lg" />
            {t("file.sidebar.account")}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={60} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-800 group text-[13px] ${
                    !filter.memberId
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, memberId: null })}
                >
                  {t("file.sidebar.all")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                {members &&
                  members.map((m) => (
                    <li
                      key={m._id || m.id}
                      className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-700 group text-[13px] ${
                        filter.memberId === (m._id || m.id)
                          ? "bg-blue-100 border border-blue-400 font-bold"
                          : ""
                      }`}
                      onClick={() =>
                        onChangeFilter({ ...filter, memberId: m._id || m.id })
                      }
                    >
                      {m.fullName || m.name || m.email || m.username}
                      <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                    </li>
                  ))}
              </>
            )}
          </ul>
        </div>
        {/* Các loại tệp */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[14px] mb-1">
            <FiLink className="text-primary text-lg" />
            {t("file.sidebar.file_types")}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={100} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium group text-[13px] ${
                    !filter.fileType || filter.fileType === "all"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, fileType: "all" })}
                >
                  <span className="font-medium">{t("file.sidebar.all")}</span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                {fileTypes.map((type) => (
                  <li
                    key={type.key}
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg group text-[13px] ${
                      filter.fileType === type.key
                        ? "bg-blue-100 border border-blue-400 font-bold"
                        : ""
                    }`}
                    onClick={() =>
                      onChangeFilter({ ...filter, fileType: type.key })
                    }
                  >
                    <img
                      src={getFileIcon({
                        type: type.key === "folder" ? "folder" : "file",
                        name: `file.${type.key}`,
                      })}
                      alt={type.label}
                      className="w-5 h-5 object-contain"
                    />
                    <span className="font-medium">{type.label}</span>
                    <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}

// Helper lấy link download Google Drive
function getGoogleDriveDownloadUrl(url) {
  if (!url) return "";
  const match = url.match(/\/d\/([\w-]+)\//);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

export default function YourFolder() {
  const t = useTranslations();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  // Xác định có phải mobile không (dùng matchMedia)
  const [isMobile, setIsMobile] = React.useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' hoặc 'list'
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Thay thế state uploadStatus bằng uploadBatches
  const [uploadBatches, setUploadBatches] = useState([]); // [{id, files, folders}]

  // Dữ liệu thực tế
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;
  const isFirstLoad = useRef(true);

  // Infinite scroll fetchData
  const fetchData = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await axiosClient.get(
        `/api/upload?page=${pageNum}&limit=${limit}`
      );
      const json = res.data;
      const files = (json.files || []).map((f) => ({
        id: f._id ? String(f._id) : String(f.id),
        name: f.originalName || f.name,
        type: "file",
        size: f.size,
        date: f.createdAt || f.date,
        folderId: f.folderId ? String(f.folderId) : null,
        permissions: f.permissions || [],
        extension: f.originalName
          ? f.originalName.split(".").pop().toLowerCase()
          : undefined,
        mimeType: f.mimeType,
        url: f.url, // Thêm dòng này để truyền url từ backend
      }));
      const folders = (json.folders || []).map((f) => ({
        id: f._id ? String(f._id) : String(f.id),
        name: f.name,
        type: "folder",
        size: 0,
        date: f.createdAt || f.date,
        parentId: f.parentId ? String(f.parentId) : null,
        permissions: f.permissions || [],
      }));
      if (pageNum === 1) setData([...folders, ...files]);
      else setData((prev) => [...prev, ...folders, ...files]);
      setHasMore(pageNum < (json.totalPages || 1));
    } catch (e) {
      if (pageNum === 1) setData([]);
    }
    if (pageNum === 1) setLoading(false);
    else setLoadingMore(false);
  };

  // Initial load and on page change
  useEffect(() => {
    fetchData(page);
  }, [page]);

  // Reset page/data on reload (e.g. after upload)
  const resetAndReload = () => {
    setPage(1);
    fetchData(1);
  };

  // After upload, refresh data
  useEffect(() => {
    if (uploadBatches.length === 0) return;
    const lastBatch = uploadBatches[uploadBatches.length - 1];
    if (lastBatch && lastBatch.status === "done") {
      resetAndReload();
    }
  }, [uploadBatches]);

  // Infinite scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || loading || !hasMore) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - (scrollY + windowHeight) < 200) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, loading, hasMore]);

  const handleStartUpload = (batches) => {
    const newBatches = batches.map((batch) => ({
      ...batch,
      id: uuidv4(),
      // Thêm thông tin chunked upload cho các file lớn (>5MB)
      useChunkedUpload:
        batch.type === "file" &&
        batch.files.some((file) => file.size > 5 * 1024 * 1024),
    }));
    setUploadBatches((prev) => [...prev, ...newBatches]);
  };

  const tableHeader = [
    t("file.table.name"),
    t("file.table.size"),
    t("file.table.date"),
    t("file.table.downloads"),
  ];
  const tableActions = useHomeTableActions({ data, setData });

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [currentFolderId, setCurrentFolderId] = useState(null); // null = root

  // Build visible data for current folder
  const visibleFolders = data.filter(
    (item) =>
      item.type === "folder" &&
      ((item.parentId && String(item.parentId) === String(currentFolderId)) ||
        (!item.parentId && !currentFolderId))
  );
  const visibleFiles = data.filter(
    (item) =>
      item.type === "file" &&
      ((item.folderId && String(item.folderId) === String(currentFolderId)) ||
        (!item.folderId && !currentFolderId))
  );

  // Helper: get parentId of current folder
  const getParentOfCurrent = () => {
    if (!currentFolderId) return null;
    const currentFolder = data.find(
      (item) =>
        item.type === "folder" && String(item.id) === String(currentFolderId)
    );
    return currentFolder ? currentFolder.parentId || null : null;
  };

  // Handle back button
  const handleBack = () => {
    setCurrentFolderId(getParentOfCurrent());
  };

  // Handle folder click (enter folder)
  const handleFolderClick = (folder) => {
    setCurrentFolderId(folder.id);
  };

  // Handle create folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setUploadBatches((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type: "create_folder",
        name: newFolderName.trim(),
        parentId: currentFolderId,
      },
    ]);
    setShowCreateFolderModal(false);
    setNewFolderName("");
  };

  // Xử lý di chuyển file/folder
  const handleMoveItems = async (items, targetFolderId) => {
    if (!items || items.length === 0 || typeof targetFolderId === "undefined")
      return;
    // Luôn truyền id là _id (MongoDB id) cho backend
    const mappedItems = items.map((item) => ({
      id: item._id || item.id,
      type: item.type,
      name: item.name || item.originalName,
    }));
    const batchId = uuidv4();
    setUploadBatches((prev) => [
      ...prev,
      {
        id: batchId,
        type: "move",
        items: mappedItems,
        targetFolderId,
      },
    ]);
    // Reset draggedItems after move
    if (tableActions.handleDragEnd) tableActions.handleDragEnd();
    tableActions.setSelectedItems([]); // Reset chọn sau khi move
  };

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [pendingMoveItems, setPendingMoveItems] = useState([]);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);

  const handleShowMoveModal = (items) => {
    setPendingMoveItems(items);
    setShowMoveModal(true);
    setMoveTargetFolder(null);
  };
  const handleConfirmMove = () => {
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
        // Reset draggedItems after modal move
        if (tableActions.handleDragEnd) tableActions.handleDragEnd();
      }, 100); // Đảm bảo state reset sau khi batch được thêm
    }
  };

  // Xử lý xóa file/folder
  const handleDeleteItems = async (items) => {
    if (!items || items.length === 0) return;
    const mappedItems = items.map((item) => ({
      id: item._id || item.id,
      type: item.type,
      name: item.name || item.originalName,
    }));
    const batchId = uuidv4();
    setUploadBatches((prev) => [
      ...prev,
      {
        id: batchId,
        type: "delete",
        items: mappedItems,
      },
    ]);
    tableActions.setSelectedItems([]); // Reset chọn sau khi xóa
  };

  // State cho modal cấp quyền
  const [showGrantPermissionModal, setShowGrantPermissionModal] =
    useState(false);
  const [grantPermissionTarget, setGrantPermissionTarget] = useState(null); // file/folder

  // Hàm callback khi ActionZone gọi cấp quyền
  const handleGrantPermission = (items) => {
    if (!items || items.length === 0) return;
    let target = items[0];
    // Nếu chỉ có id mà không có _id, thì gán _id = id
    if (target && !target._id && target.id) {
      target = { ...target, _id: target.id };
    }
    if (!target || !target._id) {
      alert(t("file.error.cannot_identify_permission_target"));
      return;
    }
    setGrantPermissionTarget(target);
    setShowGrantPermissionModal(true);
    // Reset draggedItems nếu cần
    if (tableActions.handleDragEnd) tableActions.handleDragEnd();
  };

  // Filter state
  const [filter, setFilter] = useState({
    type: "all",
    memberId: null,
    fileType: null,
  });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch members (API call sẽ thêm sau)
  useEffect(() => {
    axiosClient
      .get("/api/user/members")
      .then((res) => res.data)
      .then((json) => {
        if (json.members) setMembers(json.members);
      })
      .catch(() => setMembers([]));
  }, []);

  // Lọc data theo filter
  const filteredFolders = data.filter((item) => {
    if (item.type !== "folder") return false;
    // Lọc theo member: chỉ hiện folder có permissions chứa memberId
    if (filter.memberId) {
      if (
        !Array.isArray(item.permissions) ||
        !item.permissions.some(
          (p) => String(p.memberId) === String(filter.memberId)
        )
      )
        return false;
    }
    // Lọc theo loại
    if (filter.type === "folder" || filter.type === "all") return true;
    return false;
  });
  const filteredFiles = data.filter((item) => {
    if (item.type !== "file") return false;
    // Lọc theo member: chỉ hiện file có permissions chứa memberId
    if (filter.memberId) {
      if (
        !Array.isArray(item.permissions) ||
        !item.permissions.some(
          (p) => String(p.memberId) === String(filter.memberId)
        )
      )
        return false;
    }
    // Lọc theo loại
    if (filter.type === "file" || filter.type === "all") {
      // Lọc theo loại tệp
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
  // Nếu không filter thì dùng visibleFolders/visibleFiles cũ
  const foldersToShow =
    filter.type === "all" &&
    !filter.memberId &&
    (!filter.fileType || filter.fileType === "all")
      ? visibleFolders
      : filteredFolders;
  const filesToShow =
    filter.type === "all" &&
    !filter.memberId &&
    (!filter.fileType || filter.fileType === "all")
      ? visibleFiles
      : filteredFiles;

  // Lọc theo searchTerm
  const searchTermLower = searchTerm.trim().toLowerCase();
  const foldersToShowFiltered = searchTermLower
    ? foldersToShow.filter((f) =>
        (f.name || "").toLowerCase().includes(searchTermLower)
      )
    : foldersToShow;
  const filesToShowFiltered = searchTermLower
    ? filesToShow.filter((f) =>
        (f.name || "").toLowerCase().includes(searchTermLower)
      )
    : filesToShow;

  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handlePreview = async (file) => {
    setPreviewFile(file);
    setPreviewUrl(file.url || "");
  };

  function getPreferredDownloadUrl(item) {
    if (item?.tempDownloadUrl && item?.tempFileStatus === "completed") {
      return item.tempDownloadUrl; // /api/download/temp/:uploadId
    }
    if (item?.driveUrl || item?.url) {
      // link xem/tải của Google Drive
      const url = item.driveUrl || item.url;
      const m = url.match(/\/d\/([\w-]+)\//);
      return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : url;
    }
    if (item?._id) return `/api/download/file/${item._id}`; // BE tự quyết định
    return null;
  }

  function isTempApi(url) {
    // tải qua API nội bộ -> dùng axios lấy blob
    return (
      typeof url === "string" &&
      (url.startsWith("/api/download/temp/") ||
        url.startsWith("/api/download/file/"))
    );
  }

  // Tải xuống 1 hoặc nhiều item
  async function handleDownload(items) {
    if (!Array.isArray(items)) items = [items];

    for (const item of items) {
      const rawUrl = getPreferredDownloadUrl(item);
      if (!rawUrl) {
        console.warn("Không có URL tải xuống cho item:", item);
        continue;
      }

      // Nếu là API nội bộ -> lấy blob rồi save (tránh CORS, đảm bảo tên file)
      if (isTempApi(rawUrl)) {
        try {
          const url = rawUrl.startsWith("http")
            ? rawUrl
            : `${process.env.NEXT_PUBLIC_API_BASE || ""}${rawUrl}`;

          const res = await axiosClient.get(url, {
            responseType: "blob",
            // tránh axios cố parse JSON
            transformResponse: [(data) => data],
          });

          // Lấy tên file: ưu tiên header Content-Disposition, sau đó tới name/originalName
          const cd = res.headers?.["content-disposition"] || "";
          const m = /filename\*?=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
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
        } catch (err) {
          console.error("Download (temp/api) failed:", err);
        }
        continue;
      }

      // Nếu là Google Drive/public URL -> mở thẳng bằng <a> (tránh CORS/4096 cookie)
      const a = document.createElement("a");
      a.href = rawUrl;
      a.rel = "noopener";
      a.target = "_blank"; // phòng trường hợp Drive cần confirm virus scan
      a.download = item?.name || item?.originalName || ""; // trình duyệt có thể bỏ qua với cross-origin
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  return (
    <div className="flex w-full min-h-screen bg-[#f7f8fa] relative">
      <div className="flex-1 flex flex-col items-start px-2 md:px-8 py-6">
        {/* Thanh search + Add + View mode */}
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

          {/* Dropdown Upload Button */}
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

            {/* Dropdown Menu */}
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
              </div>
            )}
          </div>

          {/* Icon chuyển đổi view - chỉ hiện trên desktop */}
          <div className="hidden items-center gap-2 ml-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-gray-200  lg:flex">
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
        </div>

        {/* Table hoặc Card phía dưới */}
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

      {/* Sidebar desktop */}
      <SidebarFilter
        isMobile={false}
        open
        loading={loading}
        filter={filter}
        onChangeFilter={setFilter}
        members={members}
      />
      {/* Sidebar mobile */}
      <SidebarFilter
        isMobile={isMobile}
        open={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        loading={loading}
        filter={filter}
        onChangeFilter={setFilter}
        members={members}
      />
      {/* Nút mở sidebar mobile */}
      {isMobile && !isSidebarOpen && (
        <button
          className="fixed bottom-6 right-6 z-40 bg-primary text-white p-3 rounded-full shadow-lg md:hidden hover:bg-[#189ec6] transition-all duration-200 hover:scale-110 active:scale-95"
          onClick={() => setSidebarOpen(true)}
          aria-label={t("file.sidebar.open_filter")}
        >
          <FiFilter className="text-2xl" />
        </button>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onStartUpload={handleStartUpload}
        parentId={currentFolderId}
      />

      {/* Create Folder Modal - sẽ implement sau */}
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
                onClick={handleCreateFolder}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
              >
                {t("file.button.create")}
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

      {/* Upload Mini Status */}
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
          // Thêm props cho move/delete
          moveItems={
            batch.type === "move" || batch.type === "delete"
              ? batch.items
              : undefined
          }
          moveTargetFolderId={
            batch.type === "move" ? batch.targetFolderId : undefined
          }
          // Thêm prop cho chunked upload
          useChunkedUpload={batch.useChunkedUpload}
          onComplete={() => {
            setUploadBatches((prev) => prev.filter((b) => b.id !== batch.id));
            resetAndReload();
          }}
          style={{ marginBottom: idx > 0 ? 12 : 12 }}
        />
      ))}

      {/* ActionZone cho mobile/desktop */}
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

      {/* Modal chọn thư mục đích khi di chuyển */}
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

      {/* Click outside để đóng dropdown */}
      {showUploadDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUploadDropdown(false)}
        />
      )}

      {/* Modal cấp quyền */}
      <PermissionModal
        isOpen={showGrantPermissionModal}
        onClose={() => setShowGrantPermissionModal(false)}
        folder={grantPermissionTarget}
        onPermissionChange={resetAndReload}
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
