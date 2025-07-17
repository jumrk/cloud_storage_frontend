import React from "react";
import { getFileIcon } from "@/utils/getFileIcon";
import { FiEdit2, FiCheck, FiX, FiShare2, FiLock } from "react-icons/fi";
import { splitFileName } from "@/utils/driveUtils";
import { useState } from "react";
// import DragPreview from "@/components/client/home/DragPreview";

function renderDragPreviewHTML(draggedItems) {
  if (!draggedItems || draggedItems.length === 0) return "";
  const isMulti = draggedItems.length > 1;
  const first = draggedItems[0];
  return `
    <div style="
      padding:10px 18px;
      background:#2563eb;
      color:white;
      border-radius:12px;
      font-weight:600;
      font-size:16px;
      box-shadow:0 4px 16px rgba(0,0,0,0.18);
      display:flex;
      align-items:center;
      gap:10px;
      min-width:120px;
      pointer-events:none;
    ">
      <span style="font-size:22px;margin-right:8px;">
        ${first.type === "folder" ? "📁" : "📄"}
      </span>
      <span>
        ${isMulti ? `Kéo ${draggedItems.length} mục` : first.name}
      </span>
    </div>
  `;
}

function formatSize(size) {
  if (!size || isNaN(size)) return "-";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + " MB";
  return (size / 1024 / 1024 / 1024).toFixed(1) + " GB";
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
}) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 w-full">
        <img
          src="/images/empty.png"
          alt="empty"
          style={{ width: 120, height: 120, marginBottom: 16 }}
        />
        <div className="text-gray-500 text-lg font-medium mt-2">
          Không có dữ liệu
        </div>
      </div>
    );
  }
  const isFolder = data.type === "folder";
  const icon = getFileIcon({ type: data.type, name: data.name });
  const checked = !!selectedItems.find((i) => i.id === data.id);
  const [editing, setEditing] = React.useState(false);
  const [newName, setNewName] = React.useState(data.name);
  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      ));
  const [copied, setCopied] = React.useState(false);

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
      className={`relative w-full max-w-[180px] flex-1 basis-1/2 sm:basis-auto overflow-hidden m-2 bg-white rounded-2xl p-4 h-[140px] transition-all duration-300 shadow hover:shadow-xl hover:-translate-y-1 flex flex-col justify-center items-center cursor-pointer border border-gray-100 ${
        isFolder ? "hover:bg-blue-50" : "hover:bg-gray-50"
      }${data.locked ? " cursor-not-allowed opacity-60" : ""}`}
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
      {/* Icon chia sẻ desktop - chỉ hiện với file */}
      {!isMobile && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 20 }}>
          <button
            className="text-blue-500 hover:text-blue-700 bg-white/80 rounded-full p-1"
            title="Chia sẻ file/thư mục"
            onClick={(e) => {
              e.stopPropagation();
              const shareUrl = `${window.location.origin}/share/${data.id}`;
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <FiShare2 size={16} />
          </button>
          {copied && (
            <span className="absolute right-10 top-1 text-green-600 text-xs bg-white px-2 py-1 rounded shadow animate-fade-in">
              Đã copy link!
            </span>
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
      <img
        src={icon}
        alt="icon"
        className="w-14 h-14 mb-2 object-contain drop-shadow"
      />
      <div className="flex items-center w-full justify-center gap-1">
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
                <button onClick={confirmEdit} className="ml-1 text-green-600">
                  {/* {loading ? (
                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                  ) : ( */}
                  <FiCheck size={16} />
                  {/* )} */}
                </button>
                <button onClick={cancelEdit} className="ml-1 text-gray-400">
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
                <button onClick={confirmEdit} className="ml-1 text-green-600">
                  <FiCheck size={16} />
                </button>
                <button onClick={cancelEdit} className="ml-1 text-gray-400">
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
            {isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(e);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-primary bg-white/80 rounded-full p-1"
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
