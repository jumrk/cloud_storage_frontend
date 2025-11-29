"use client";

import React, { useEffect, useState } from "react";
import { getFileIcon } from "@/shared/utils/getFileIcon";
import { FiShare2, FiLock, FiDownload } from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import EmptyState from "@/shared/ui/EmptyState";
import Image from "next/image";

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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

const Table = ({
  header = [],
  data = [],
  handleChecked,
  onRename,
  onRowClick,
  onMoveItem,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  draggedItems = [],
  onDragStart,
  onDragEnd,
  onPreviewFile,
  loadingMore = false,
  onClearSelection, // Thêm prop này
  onShare,
  onDownload,
  isFavoriteItem,
  onToggleFavorite,
  favoriteLoadingId,
}) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [newName, setNewName] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // State để lưu độ rộng các cột (resizable)
  const [columnWidths, setColumnWidths] = useState({
    name: 300, // Tên tệp
    size: 120, // Kích thước
    date: 120, // Ngày
    actions: 150, // Thao tác
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Xóa state draggedItem local
  // const [draggedItem, setDraggedItem] = useState(null);

  // Xử lý chọn item
  const handleCheckItem = (item) => {
    if (onSelectItem) onSelectItem(item);
  };
  // Xử lý chọn tất cả
  const handleCheckAll = () => {
    if (onSelectAll) onSelectAll();
  };

  const handleRenameConfirm = (id) => {
    if (newFolderName.trim() && onRename) {
      onRename(id, "folder", newFolderName.trim());
    }
    setEditingFolderId(null);
    setNewFolderName("");
  };

  // Bắt đầu sửa tên
  const startEditName = (id, type, name) => {
    setEditingId(id);
    setEditingType(type);
    setNewName(name);
  };
  // Xác nhận đổi tên
  // Tách tên và đuôi file
  function splitFileName(name) {
    const lastDot = name.lastIndexOf(".");
    if (lastDot === -1) return { base: name, ext: "" };
    return { base: name.slice(0, lastDot), ext: name.slice(lastDot) };
  }
  // Sửa lại confirmEditName để ghép lại tên file
  const confirmEditName = () => {
    if (editingType === "file") {
      const old = data.find((i) => i.id === editingId);
      const ext = old ? splitFileName(old.name).ext : "";
      if (newName.trim() && onRename && editingId) {
        onRename(editingId, "file", newName.trim() + ext);
      }
    } else {
      if (newName.trim() && onRename && editingId) {
        onRename(editingId, "folder", newName.trim());
      }
    }
    setEditingId(null);
    setEditingType(null);
    setNewName("");
  };
  // Huỷ đổi tên
  const cancelEditName = () => {
    setEditingId(null);
    setEditingType(null);
    setNewName("");
  };

  const allChecked = data.length > 0 && data.every((_, i) => checkedItems[i]);

  useEffect(() => {
    const isAnyChecked = Object.values(checkedItems).some((v) => v);
    handleChecked(isAnyChecked);
  }, [checkedItems]);

  // Xử lý drag start
  const handleRowDragStart = (e, item) => {
    // Không cho phép drag khi đang resize
    if (resizingColumn) {
      e.preventDefault();
      return;
    }
    if (onDragStart) onDragStart(item);
    // Lấy danh sách items sẽ drag
    const items = selectedItems.find((i) => i.id === item.id)
      ? selectedItems
      : [item];
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

  // Xử lý drag end
  const handleRowDragEnd = () => {
    if (onDragEnd) onDragEnd();
    // Xóa drag preview
    if (window && window._customDragEl) {
      window._customDragEl.remove();
      window._customDragEl = null;
    }
  };

  // Xử lý drag over (cho phép drop)
  const handleDragOver = (e, item) => {
    // Chỉ cho phép drop vào folder
    if (item.type === "folder") {
      e.preventDefault();
    }
  };

  // Xử lý drop vào folder
  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    if (
      draggedItems &&
      targetItem.type === "folder" &&
      !draggedItems.find((item) => item.id === targetItem.id) &&
      onMoveItem
    ) {
      onMoveItem(draggedItems, targetItem.id);
      if (onClearSelection) onClearSelection(); // Reset selectedItems sau khi move
    }
  };

  const handleRowDoubleClick = (item) => {
    if (item.type === "folder") {
      onRowClick(item);
    } else {
      onPreviewFile && onPreviewFile(item);
    }
  };

  const isFavoriteLoading = (item) => {
    if (!favoriteLoadingId) return false;
    const resourceId = item?._id || item?.id;
    if (!resourceId) return false;
    return favoriteLoadingId === String(resourceId);
  };

  // Xử lý bắt đầu resize
  const handleResizeStart = (e, columnKey) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);

    // Thêm event listeners
    const handleMove = (moveEvent) => {
      moveEvent.preventDefault();
      const diff = moveEvent.clientX - e.clientX;
      const newWidth = Math.max(100, columnWidths[columnKey] + diff); // Min width 100px
      setColumnWidths((prev) => ({
        ...prev,
        [columnKey]: newWidth,
      }));
    };

    const handleEnd = () => {
      setResizingColumn(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <EmptyState message="Không có dữ liệu" height={180} />
      ) : (
        <>
          <div className="flex gap-2 items-start">
            <table className="border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th
                    className="px-4 py-3 text-center align-middle"
                    style={{ width: 48 }}
                  >
                    <div style={{ height: 22 }}>&nbsp;</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="h-[48px]">
                    <td
                      className="px-4 py-3 text-center align-middle"
                      style={{ width: 48 }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{ width: 24, height: 16, margin: "0 auto" }}
                      >
                        <input
                          type="checkbox"
                          id={`check_${index}`}
                          className="peer hidden"
                          checked={
                            !!selectedItems.find((i) => i.id === item.id)
                          }
                          onChange={() => handleCheckItem(item)}
                        />
                        <label
                          htmlFor={`check_${index}`}
                          className="w-4 h-4 inline-block rounded-sm bg-[#C7C7C7] cursor-pointer peer-checked:bg-primary peer-checked:after:content-['✔'] peer-checked:after:text-white peer-checked:after:text-[10px] peer-checked:after:absolute peer-checked:after:top-[2px] peer-checked:after:left-[3px]"
                        ></label>
                      </div>
                    </td>
                  </tr>
                ))}
                {loadingMore && (
                  <tr>
                    <td
                      colSpan={header.length + 1}
                      className="text-center py-4 text-gray-500"
                    >
                      Đang tải thêm...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <table
              className="min-w-[90%] border-separate border-spacing-y-2"
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <thead className="bg-[#E5E7EB]">
                <tr>
                  {header.map((value, idx) => {
                    let columnKey = "";
                    let width = 200;
                    if (value === "Tên tệp" || value === "Tên") {
                      columnKey = "name";
                      width = columnWidths.name;
                    } else if (value === "Kích thước" || value === "Size") {
                      columnKey = "size";
                      width = columnWidths.size;
                    } else if (value === "Ngày" || value === "Date") {
                      columnKey = "date";
                      width = columnWidths.date;
                    } else if (
                      value === "Lượt tải" ||
                      value === "Thao tác" ||
                      value === "Actions"
                    ) {
                      columnKey = "actions";
                      width = columnWidths.actions;
                    }

                    return (
                      <th
                        key={value}
                        className="font-bold text-primary text-xm px-4 py-3 text-left relative"
                        style={{ width: width, position: "relative" }}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {value === "Lượt tải" ? "Thao tác" : value}
                          </span>
                        </div>
                        {columnKey && (
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-400 transition-colors group"
                            style={{
                              width: "6px",
                              cursor: "col-resize",
                              zIndex: 10,
                              marginRight: "-3px",
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleResizeStart(e, columnKey);
                            }}
                            title="Kéo để điều chỉnh độ rộng cột"
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.map((value, index) => (
                  <tr
                    key={value.id}
                    className={` text-sm ${
                      selectedItems.find((i) => i.id === value.id)
                        ? "bg-primary text-white"
                        : "bg-[#F6F9FF]"
                    } hover:bg-primary hover:text-white rounded-lg transition-all duration-500 h-[48px]${
                      value.locked
                        ? " cursor-not-allowed opacity-60"
                        : " cursor-pointer"
                    }`}
                    onDoubleClick={() => handleRowDoubleClick(value)}
                    draggable={!value.locked}
                    onDragStart={
                      value.locked
                        ? undefined
                        : (e) => handleRowDragStart(e, value)
                    }
                    onDragEnd={value.locked ? undefined : handleRowDragEnd}
                    onDragOver={(e) => handleDragOver(e, value)}
                    onDrop={(e) => handleDrop(e, value)}
                  >
                    <td
                      className="px-4 py-3 rounded-l-lg flex items-center gap-2"
                      style={{ width: columnWidths.name, overflow: "hidden" }}
                    >
                      <Image
                        src={getFileIcon({
                          type: value.type,
                          name: value.name,
                        })}
                        alt="icon"
                        className="w-6 h-6 object-contain mr-2 flex-shrink-0"
                        style={{ minWidth: 24 }}
                        width={24}
                        height={24}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,..."
                        priority
                      />
                      {editingId === value.id ? (
                        value.type === "file" ? (
                          (() => {
                            const { base, ext } = splitFileName(value.name);
                            return (
                              <div className="flex items-center gap-1 w-full min-w-0">
                                <input
                                  type="text"
                                  value={newName}
                                  autoFocus
                                  onChange={(e) => setNewName(e.target.value)}
                                  onBlur={cancelEditName}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmEditName();
                                    if (e.key === "Escape") cancelEditName();
                                  }}
                                  className="bg-white px-2 py-1 text-black rounded border border-gray-300 flex-1 min-w-0"
                                />
                                <span className="text-xs text-gray-500 select-none flex-shrink-0">
                                  {ext}
                                </span>
                                <button
                                  onClick={confirmEditName}
                                  className="ml-1 text-green-600 flex-shrink-0"
                                >
                                  {/* loading is handled by parent */}
                                  <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })()
                        ) : (
                          <input
                            type="text"
                            value={newName}
                            autoFocus
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={cancelEditName}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEditName();
                              if (e.key === "Escape") cancelEditName();
                            }}
                            className="bg-white px-2 py-1 text-black rounded border border-gray-300 w-full"
                          />
                        )
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditName(
                              value.id,
                              value.type,
                              value.type === "file"
                                ? splitFileName(value.name).base
                                : value.name
                            );
                          }}
                          title={value.name}
                          className="overflow-hidden text-ellipsis whitespace-nowrap inline-block align-middle cursor-pointer min-w-0 flex-1"
                          style={{ maxWidth: "100%" }}
                        >
                          {value.type === "file"
                            ? splitFileName(value.name).base
                            : value.name}
                          {value.type === "file" && (
                            <span className="text-xs text-gray-400">
                              {splitFileName(value.name).ext}
                            </span>
                          )}
                          {value.locked && (
                            <FiLock
                              className="inline ml-1 text-gray-400"
                              title="Bị khóa"
                            />
                          )}
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ width: columnWidths.size }}
                    >
                      {formatSize(value.size)}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ width: columnWidths.date }}
                    >
                      {formatDate(value.date)}
                    </td>
                    <td
                      className="px-4 py-3 rounded-r-lg"
                      style={{
                        position: "relative",
                        width: columnWidths.actions,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {value.type === "file" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleFavorite) {
                                onToggleFavorite(value);
                              }
                            }}
                            title={
                              isFavoriteItem && isFavoriteItem(value)
                                ? "Bỏ khỏi yêu thích"
                                : "Thêm vào yêu thích"
                            }
                            className={`transition-colors ${
                              isFavoriteItem && isFavoriteItem(value)
                                ? "text-amber-500"
                                : "text-gray-400 hover:text-amber-500"
                            } ${
                              isFavoriteLoading(value)
                                ? "opacity-60 cursor-wait"
                                : ""
                            }`}
                            disabled={isFavoriteLoading(value)}
                          >
                            {isFavoriteLoading(value) ? (
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            ) : isFavoriteItem && isFavoriteItem(value) ? (
                              <FaStar size={16} />
                            ) : (
                              <FaRegStar size={16} />
                            )}
                          </button>
                        )}
                        {onDownload && value.type === "file" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(value);
                            }}
                            title="Tải xuống"
                            className="text-green-500 hover:text-green-700 transition-colors"
                          >
                            <FiDownload size={18} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onShare) {
                              onShare(value);
                            }
                          }}
                          title="Chia sẻ file/thư mục"
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <FiShare2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Table;
