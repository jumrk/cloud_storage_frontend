import React from "react";
import { getFileIcon } from "@/shared/utils/getFileIcon";
import { FiEdit2, FiCheck, FiX, FiShare2, FiLock } from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import Image from "next/image";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";
function renderDragPreviewHTML(draggedItems) {
  if (!draggedItems || draggedItems.length === 0) return "";
  const isMulti = draggedItems.length > 1;
  const first = draggedItems[0];
  return ` <div style=" padding:10px 18px; background:#2563eb; color:white; border-radius:12px; font-weight:600; font-size:16px; box-shadow:0 4px 16px rgba(0,0,0,0.18); display:flex; align-items:center; gap:10px; min-width:120px; pointer-events:none;"> <span style="font-size:22px;margin-right:8px;"> ${
    first.type === "folder" ? "📁" : "📄"
  } </span> <span> ${
    isMulti ? `Kéo ${draggedItems.length} mục` : first.name
  } </span> </div> `;
}

// Tiện ích xóa drag preview
export function cleanupDragPreview() {
  if (window && window._customDragEl) {
    window._customDragEl.remove();
    window._customDragEl = null;
  }
}

export function LoadingCard() {
  return (
    <div className="flex flex-col items-center justify-center py-8 w-full">
      <div className="w-10 h-10 rounded-full border-4 border-blue-300 border-t-transparent animate-spin mb-2"></div>
      <div className="text-gray-500 text-sm">Đang tải thêm...</div>
    </div>
  );
}

function Card_file({
  data,
  onClick,
  onMoveItem,
  onRename,
  selectedItems = [],
  onSelectItem,
  draggedItems = [],
  onDragStart,
  onDragEnd,
  onPreviewFile,
  onShare,
  isFavorite = false,
  onToggleFavorite,
  favoriteLoading = false,
  isFileUploading,
}) {
  const isFolder = data.type === "folder";
  const icon = getFileIcon({ type: data.type, name: data.name });
  const checked = !!selectedItems.find((i) => i.id === data.id);
  const [editing, setEditing] = React.useState(false);
  const [newName, setNewName] = React.useState(data.name);
  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent,
      ));
  const [copied, setCopied] = React.useState(false);
  const [drivePct, setDrivePct] = React.useState(null);
  const statusPollerRef = React.useRef(null);
  
  // Check if file is uploading
  const uploading = isFileUploading ? isFileUploading(data) : (
    !isFolder && (
      data.driveUploadStatus === "uploading" || 
      data.driveUploadStatus === "pending" ||
      (!data.driveFileId && (data.tempDownloadUrl || data.tempFilePath))
    )
  );

  // Extract uploadId from tempDownloadUrl if available
  const extractUploadId = React.useCallback(() => {
    if (data.tempDownloadUrl) {
      // Format: /api/download/temp/{uploadId}
      const match = data.tempDownloadUrl.match(/\/temp\/([^/?]+)/);
      if (match) return match[1];
    }
    // Try to get from data.uploadId if available
    if (data.uploadId) return data.uploadId;
    return null;
  }, [data.tempDownloadUrl, data.uploadId]);

  const handleRetryDriveUpload = async (e) => {
    if (e) e.stopPropagation();
    const uploadId = extractUploadId();
    if (!uploadId) {
      toast.error("Không tìm thấy uploadId để retry");
      return;
    }
    const toastId = toast.loading("Đang retry upload lên Drive...");
    try {
      const res = await axiosClient.post("/api/upload/retry", { uploadId });
      if (res.data?.success) {
        toast.success("Đã gửi yêu cầu retry upload", { id: toastId });
      } else {
        toast.error(res.data?.error || "Retry upload thất bại", { id: toastId });
      }
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || "Retry upload thất bại";
      toast.error(msg, { id: toastId });
    }
  };

  // Poll upload status to get Drive progress
  React.useEffect(() => {
    if (!uploading || isFolder) {
      if (statusPollerRef.current) {
        clearInterval(statusPollerRef.current);
        statusPollerRef.current = null;
      }
      setDrivePct(null);
      return;
    }

    const uploadId = extractUploadId();
    if (!uploadId) return;

    const pollStatus = async () => {
      try {
        const res = await axiosClient.get("/api/upload/status", {
          params: { uploadId },
        });
        const statusData = res.data;
        if (statusData?.success && statusData.drivePct != null) {
          setDrivePct(statusData.drivePct);
          // Stop polling if completed
          if (statusData.state === "COMPLETED" || statusData.drivePct >= 100) {
            if (statusPollerRef.current) {
              clearInterval(statusPollerRef.current);
              statusPollerRef.current = null;
            }
          }
        }
      } catch (e) {
        // Ignore errors, will retry next interval
        console.log("[CardFile] Status poll error:", e?.message);
      }
    };

    // Poll immediately, then every 3 seconds
    pollStatus();
    statusPollerRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (statusPollerRef.current) {
        clearInterval(statusPollerRef.current);
        statusPollerRef.current = null;
      }
    };
  }, [uploading, isFolder, extractUploadId]);

  // Tách tên và đuôi file
  function splitFileName(name) {
    const lastDot = name.lastIndexOf(".");
    if (lastDot === -1) return { base: name, ext: "" };
    return { base: name.slice(0, lastDot), ext: name.slice(lastDot) };
  }

  // Bắt đầu sửa tên
  const startEdit = (e) => {
    if (e) e.stopPropagation();
    setEditing(true);
    setNewName(isFile ? splitFileName(data.name).base : data.name);
  };

  // Xác nhận đổi tên
  const confirmEdit = () => {
    if (isFile) {
      const ext = splitFileName(data.name).ext;
      if (newName.trim() && onRename) {
        onRename(data.id, data.type, newName.trim() + ext);
      }
    } else {
      if (newName.trim() && onRename) {
        onRename(data.id, data.type, newName.trim());
      }
    }
    setEditing(false);
  };

  // Huỷ đổi tên
  const cancelEdit = () => {
    setEditing(false);
    setNewName(isFile ? splitFileName(data.name).base : data.name);
  };

  const isFile = data.type === "file";

  // Custom drag preview
  const handleDragStart = (e) => {
    if (onDragStart) onDragStart(data);
    const items = selectedItems.find((i) => i.id === data.id)
      ? selectedItems
      : [data];
    const dragEl = document.createElement("div");
    dragEl.style.position = "absolute";
    dragEl.style.top = "-9999px";
    dragEl.style.left = "-9999px";
    dragEl.innerHTML = renderDragPreviewHTML(items);
    document.body.appendChild(dragEl);
    if (e.dataTransfer) {
      e.dataTransfer.setDragImage(dragEl, 20, 20);
    }
    window._customDragEl = dragEl;
  };

  const handleDragEnd = () => {
    if (onDragEnd) onDragEnd();
    if (window && window._customDragEl) {
      window._customDragEl.remove();
      window._customDragEl = null;
    }
  };

  // Click vào card: mobile thì 1 lần, desktop thì double click
  const handleCardClick = () => {
    if (isMobile) {
      if (data.type === "folder") {
        onClick && onClick();
      } else {
        onPreviewFile && onPreviewFile(data);
      }
    }
  };

  const handleDoubleClick = () => {
    if (!isMobile) {
      if (data.type === "folder") {
        onClick && onClick();
      } else {
        onPreviewFile && onPreviewFile(data);
      }
    }
  };

  return (
    <div
      className={`group relative w-full max-w-[180px] flex-1 basis-1/2 sm:basis-auto overflow-hidden m-2 bg-white rounded-2xl p-4 h-[140px] transition-all duration-300 shadow hover:shadow-xl hover:-translate-y-1 flex flex-col justify-center items-center cursor-pointer border border-gray-100 ${
        isFolder ? "hover:bg-blue-50" : "hover:bg-gray-50"
      }${data.locked ? " cursor-not-allowed opacity-60" : ""}${uploading ? " opacity-90" : ""}`}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
      tabIndex={isFolder ? 0 : -1}
      role={isFolder ? "button" : undefined}
      title={data.name}
      draggable={!data.locked}
      onDragStart={data.locked ? undefined : handleDragStart}
      onDragEnd={data.locked ? undefined : handleDragEnd}
      onDragOver={(e) => {
        if (
          isFolder &&
          draggedItems.length > 0 &&
          !draggedItems.find((i) => i.id === data.id)
        )
          e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (
          isFolder &&
          draggedItems.length > 0 &&
          !draggedItems.find((i) => i.id === data.id) &&
          onMoveItem
        ) {
          onMoveItem(draggedItems, data.id);
          cleanupDragPreview();
        }
      }}
    >
      {/* Icon khóa nếu bị locked */}
      {data.locked && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-gray-400 text-xs z-10">
          <FiLock />
        </div>
      )}
      {/* Icon chia sẻ / yêu thích desktop */}
      {!isMobile && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-30 opacity-0 translate-x-3 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto">
          <button
            className="text-blue-500 hover:text-blue-700 bg-white rounded-full p-1.5 shadow-sm transition-colors"
            title="Chia sẻ file/thư mục"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onShare) {
                onShare(data);
              } else {
                console.warn("onShare prop is not provided");
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            type="button"
          >
            <FiShare2 size={16} />
          </button>
          {!isFolder && data.driveUploadStatus === "failed" && (
            <button
              className="text-orange-500 hover:text-orange-700 bg-white rounded-full p-1.5 shadow-sm transition-colors"
              title="Retry upload lên Drive"
              onClick={handleRetryDriveUpload}
              onMouseDown={(e) => e.stopPropagation()}
              type="button"
            >
              ⟳
            </button>
          )}
          {!isFolder && (
            <button
              className={`bg-white rounded-full p-1.5 shadow-sm transition-colors ${
                isFavorite
                  ? "text-amber-500"
                  : "text-gray-400 hover:text-amber-500"
              } ${favoriteLoading ? "opacity-60 cursor-wait" : ""}`}
              title={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!favoriteLoading && onToggleFavorite) {
                  onToggleFavorite(data);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              type="button"
              disabled={favoriteLoading}
            >
              {favoriteLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              ) : isFavorite ? (
                <FaStar size={14} />
              ) : (
                <FaRegStar size={14} />
              )}
            </button>
          )}
        </div>
      )}
      {/* Checkbox chọn file/folder - custom label giống Table */}
      <input
        type="checkbox"
        id={`card_check_${data.id}`}
        className="peer hidden"
        checked={checked}
        onChange={() => onSelectItem && onSelectItem(data)}
        onClick={(e) => e.stopPropagation()}
      />
      <label
        htmlFor={`card_check_${data.id}`}
        className="card-checkbox absolute top-2 left-2 w-5 h-5 rounded-sm bg-[#C7C7C7] cursor-pointer flex items-center justify-center peer-checked:bg-primary peer-checked:after:content-['✔'] peer-checked:after:text-white peer-checked:after:text-[13px] peer-checked:after:absolute peer-checked:after:top-[2px] peer-checked:after:left-[5px]"
        style={{ zIndex: 10 }}
        onClick={(e) => e.stopPropagation()}
      ></label>
      <div className="relative">
      <Image
        src={icon}
        alt="icon"
        className="w-14 h-14 mb-2 object-contain drop-shadow"
        width={56}
        height={56}
        placeholder="blur"
        blurDataURL="data:image/png;base64,..."
        priority
      />
        {uploading && (
          <div className="absolute -top-1 -right-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center w-full justify-center gap-1 flex-col">
        {editing ? (
          <>
            {isFile ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  value={newName}
                  autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={cancelEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="bg-white px-2 py-1 text-black rounded border border-gray-300 w-full max-w-[120px] text-sm"
                  style={{ minWidth: 0 }}
                />
                <span className="text-xs text-gray-500 select-none">
                  {splitFileName(data.name).ext}
                </span>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    confirmEdit();
                  }}
                  className="ml-1 text-green-600"
                >
                  <FiCheck size={16} />
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    cancelEdit();
                  }}
                  className="ml-1 text-gray-400"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={newName}
                  autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={cancelEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="bg-white px-2 py-1 text-black rounded border border-gray-300 w-full max-w-[120px] text-sm"
                  style={{ minWidth: 0 }}
                />
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    confirmEdit();
                  }}
                  className="ml-1 cursor-pointer text-green-600"
                >
                  <FiCheck size={16} />
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    cancelEdit();
                  }}
                  className="ml-1 text-gray-400"
                >
                  <FiX size={16} />
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p
              className="text-center text-sm font-sm truncate w-full mt-1 text-gray-800 select-none"
              // Desktop mới cho click vào tên để đổi tên
              onClick={(e) => {
                if (!isMobile) startEdit(e);
              }}
              style={{ cursor: "pointer" }}
              title="Click để đổi tên"
            >
              {isFile ? splitFileName(data.name).base : data.name}
              {isFile && (
                <span className="text-xs text-gray-400">
                  {splitFileName(data.name).ext}
                </span>
              )}
            </p>
            {uploading && (
              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Drive pending
                {drivePct != null && (
                  <span className="ml-1 text-gray-600">
                    ({drivePct}%)
                  </span>
                )}
              </span>
            )}
            {!isFolder && data.driveUploadStatus === "failed" && (
              <div className="mt-1 inline-flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Drive failed
                </span>
                <button
                  className="text-xs text-orange-600 hover:text-orange-700"
                  onClick={handleRetryDriveUpload}
                >
                  Retry
                </button>
              </div>
            )}
            {isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(e);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-primary bg-white rounded-full p-1"
                title="Đổi tên"
                style={{ zIndex: 20 }}
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Card_file;
