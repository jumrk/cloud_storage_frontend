"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { getFileIcon } from "@/shared/utils/getFileIcon";
import {
  FiShare2,
  FiLock,
  FiDownload,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import EmptyState from "@/shared/ui/EmptyState";
import Image from "next/image";
import axiosClient from "@/shared/lib/axiosClient";
function renderDragPreviewHTML(draggedItems) {
  if (!draggedItems || draggedItems.length === 0) return "";
  const isMulti = draggedItems.length > 1;
  const first = draggedItems[0];
  return ` <div style=" padding:10px 18px; background:#2563eb; color:white; border-radius:12px; font-weight:600; font-size:16px; box-shadow:0 4px 16px rgba(0,0,0,0.18); display:flex; align-items:center; gap:10px; min-width:120px; pointer-events:none;"> <span style="font-size:22px;margin-right:8px;"> ${first.type === "folder" ? "📁" : "📄"} </span> <span> ${isMulti ? `Kéo ${draggedItems.length} mục` : first.name} </span> </div> `;
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
  hasFetched = false,
  onDragEnd,
  onPreviewFile,
  loadingMore = false,
  onClearSelection, // Thêm prop này
  onShare,
  onDownload,
  isFavoriteItem,
  onToggleFavorite,
  favoriteLoadingId,
  onSort, // Callback khi sort, nhận (column, direction)
}) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [newName, setNewName] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const scrollContainerRef = useRef(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" | "desc"
  // State để lưu độ rộng các cột (resizable)
  const [columnWidths, setColumnWidths] = useState({
    name: 300, // Tên tệp
    size: 120, // Kích thước
    fileCount: 120, // Tổng số file
    date: 120, // Ngày
    actions: 150, // Thao tác
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  
  // Track Drive progress for each file
  const [driveProgressMap, setDriveProgressMap] = useState({});
  const statusPollersRef = useRef({});
  
  // Extract uploadId from tempDownloadUrl
  const extractUploadId = (fileData) => {
    if (fileData.tempDownloadUrl) {
      const match = fileData.tempDownloadUrl.match(/\/temp\/([^/?]+)/);
      if (match) return match[1];
    }
    if (fileData.uploadId) return fileData.uploadId;
    return null;
  };
  
  // Poll status for uploading files
  useEffect(() => {
    const uploadingFiles = sortedData.filter((item) => 
      item.type === "file" && (
        item.driveUploadStatus === "uploading" || 
        item.driveUploadStatus === "pending" ||
        (!item.driveFileId && (item.tempDownloadUrl || item.tempFilePath))
      )
    );
    
    uploadingFiles.forEach((file) => {
      const fileId = file.id || file._id;
      const uploadId = extractUploadId(file);
      
      if (!uploadId || statusPollersRef.current[fileId]) return;
      
      const pollStatus = async () => {
        try {
          const res = await axiosClient.get("/api/upload/status", {
            params: { uploadId },
          });
          const statusData = res.data;
          if (statusData?.success && statusData.drivePct != null) {
            setDriveProgressMap((prev) => ({
              ...prev,
              [fileId]: statusData.drivePct,
            }));
            // Stop polling if completed
            if (statusData.state === "COMPLETED" || statusData.drivePct >= 100) {
              if (statusPollersRef.current[fileId]) {
                clearInterval(statusPollersRef.current[fileId]);
                delete statusPollersRef.current[fileId];
              }
            }
          }
        } catch (e) {
          // Ignore errors
        }
      };
      
      // Poll immediately, then every 3 seconds
      pollStatus();
      statusPollersRef.current[fileId] = setInterval(pollStatus, 3000);
    });
    
    // Cleanup: stop polling for files that are no longer uploading
    Object.keys(statusPollersRef.current).forEach((fileId) => {
      const stillUploading = uploadingFiles.find((f) => (f.id || f._id) === fileId);
      if (!stillUploading) {
        clearInterval(statusPollersRef.current[fileId]);
        delete statusPollersRef.current[fileId];
        setDriveProgressMap((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    });
    
    return () => {
      // Cleanup on unmount
      Object.values(statusPollersRef.current).forEach((interval) => {
        clearInterval(interval);
      });
      statusPollersRef.current = {};
    };
  }, [sortedData]);

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
      // Check if file has any URL available (temp or Drive)
      const hasTemp = item.tempDownloadUrl && item.tempFileStatus === "completed";
      const hasDrive = item.driveFileId || item.driveUrl || item.url;
      
      if ((hasTemp || hasDrive) && onPreviewFile) {
        onPreviewFile(item);
      }
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

  // Detect overflow để chỉ hiển thị scrollbar khi cần
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkOverflow = () => {
      // Tính tổng width của các cột (48px cho checkbox + gap + tổng column widths)
      const checkboxWidth = 48;
      const gap = 8; // gap-2 = 8px
      const totalColumnWidth = Object.values(columnWidths).reduce(
        (sum, width) => sum + width,
        0,
      );
      const totalTableWidth = checkboxWidth + gap + totalColumnWidth;

      // So sánh với container width với threshold để tránh false positive
      const containerWidth = container.clientWidth;
      const hasOverflowX = totalTableWidth > containerWidth + 10;
      setHasOverflow(hasOverflowX);
    };

    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(container);

    // Check khi data thay đổi
    const timeoutId = setTimeout(checkOverflow, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [data, columnWidths]);

  // Sort data dựa trên sortColumn và sortDirection
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    const sorted = [...data];
    const direction = sortDirection === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortColumn) {
        case "name":
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return (
            nameA.localeCompare(nameB, undefined, { sensitivity: "base" }) *
            direction
          );
        case "size":
          const sizeA = a.size || 0;
          const sizeB = b.size || 0;
          return (sizeA - sizeB) * direction;
        case "date":
          const dateA = new Date(a.date || a.createdAt || 0).getTime();
          const dateB = new Date(b.date || b.createdAt || 0).getTime();
          return (dateA - dateB) * direction;
        case "fileCount":
          const countA = a.fileCount || 0;
          const countB = b.fileCount || 0;
          return (countA - countB) * direction;
        default:
          return 0;
      }
    });
    return sorted;
  }, [data, sortColumn, sortDirection]);

  return (
    <div className="w-full">
      {hasFetched && sortedData.length === 0 ? (
        <EmptyState message="Không có dữ liệu" height={180} />
      ) : sortedData.length > 0 ? (
        <div
          ref={scrollContainerRef}
          className={`w-full ${
            hasOverflow ? "overflow-x-auto" : "overflow-x-hidden"
          } overflow-y-auto main-content-scrollbar ${
            hasOverflow ? "has-overflow" : ""
          }`}
          style={{
            width: "100%",
            maxWidth: "100%",
            scrollbarWidth: hasOverflow ? "thin" : "none",
            scrollbarColor: hasOverflow
              ? "rgba(0, 0, 0, 0.2) transparent"
              : "transparent transparent",
            overflowX: hasOverflow ? "auto" : "hidden",
            overflowY: "auto",
          }}
        >
          <div
            className="flex gap-2 items-start"
            style={{
              width: hasOverflow ? "max-content" : "100%",
              minWidth: "100%",
            }}
          >
            <table className="border-separate border-spacing-y-2 flex-shrink-0">
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
                {sortedData.map((item, index) => (
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
            <div className="flex-1 min-w-0">
              <table
                className="border-separate border-spacing-y-2"
                style={{ tableLayout: "auto", minWidth: "100%" }}
              >
                <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
                      } else if (
                        value === "Tổng số file" ||
                        value === "File Count" ||
                        value === "Total Files"
                      ) {
                        columnKey = "fileCount";
                        width = columnWidths.fileCount;
                      } else if (value === "Ngày" || value === "Date") {
                        columnKey = "date";
                        width = columnWidths.date;
                      } else if (
                        value === "Lượt tải" ||
                        value === "Chia sẻ" ||
                        value === "Thao tác" ||
                        value === "Actions" ||
                        value === "Share"
                      ) {
                        columnKey = "actions";
                        width = columnWidths.actions;
                      }

                      // Xác định column có thể sort không (không sort cột Actions)
                      const isSortable = columnKey && columnKey !== "actions";

                      const handleSortClick = () => {
                        if (!isSortable) return;
                        let newDirection = "asc";
                        if (sortColumn === columnKey) {
                          newDirection =
                            sortDirection === "asc" ? "desc" : "asc";
                        }
                        setSortColumn(columnKey);
                        setSortDirection(newDirection);
                        // Gọi callback nếu có
                        if (onSort) {
                          onSort(columnKey, newDirection);
                        }
                      };

                      const getSortIcon = () => {
                        if (!isSortable) return null;
                        if (sortColumn !== columnKey) {
                          return (
                            <div className="flex flex-col -space-y-1 ml-2">
                              <FiChevronUp
                                className="text-gray-300"
                                size={10}
                              />
                              <FiChevronDown
                                className="text-gray-300"
                                size={10}
                              />
                            </div>
                          );
                        }
                        return sortDirection === "asc" ? (
                          <FiChevronUp className="text-brand ml-2" size={14} />
                        ) : (
                          <FiChevronDown
                            className="text-brand ml-2"
                            size={14}
                          />
                        );
                      };

                      return (
                        <th
                          key={value}
                          className={`font-semibold text-gray-900 text-sm px-4 py-3 text-left relative bg-white ${
                            isSortable
                              ? "cursor-pointer hover:bg-gray-50 transition-colors"
                              : ""
                          }`}
                          style={{
                            width: width,
                            position: "relative",
                            minWidth: width,
                          }}
                          onClick={isSortable ? handleSortClick : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-gray-900">
                                {value === "Lượt tải" ||
                                value === "Chia sẻ" ||
                                value === "Share"
                                  ? "Thao tác"
                                  : value}
                              </span>
                              {getSortIcon()}
                            </div>
                          </div>
                          {columnKey && (
                            <div
                              className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-brand/20 transition-colors group"
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
                  {sortedData.map((value, index) => {
                    // Check if file is uploading
                    const isUploading = value.type === "file" && (
                      value.driveUploadStatus === "uploading" || 
                      value.driveUploadStatus === "pending" ||
                      (!value.driveFileId && (value.tempDownloadUrl || value.tempFilePath))
                    );
                    
                    return (
                    <tr
                      key={value.id}
                      className={`text-sm transition-all duration-200 ${
                        selectedItems.find((i) => i.id === value.id)
                          ? "bg-brand/10 border-l-4 border-brand"
                          : "bg-white hover:bg-white border-l-4 border-transparent"
                      } rounded-lg h-[56px]${
                        value.locked
                          ? " cursor-not-allowed opacity-60"
                          : " cursor-pointer"
                      }${isUploading ? " opacity-75" : ""}`}
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
                        className="px-4 py-3 rounded-l-lg flex items-center gap-3"
                        style={{
                          width: columnWidths.name,
                          overflow: "hidden",
                          minWidth: columnWidths.name,
                        }}
                      >
                        <div className="relative flex-shrink-0">
                        <Image
                          src={getFileIcon({
                            type: value.type,
                            name: value.name,
                          })}
                          alt="icon"
                            className="w-6 h-6 object-contain mr-2"
                          style={{ minWidth: 24 }}
                          width={24}
                          height={24}
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,..."
                          priority
                        />
                          {isUploading && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse border-2 border-white"></div>
                          )}
                        </div>
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
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditName(
                                value.id,
                                value.type,
                                value.type === "file"
                                  ? splitFileName(value.name).base
                                  : value.name,
                              );
                            }}
                            title={value.name}
                            className={`overflow-hidden text-ellipsis whitespace-nowrap inline-block align-middle cursor-pointer min-w-0 flex-1 ${
                              selectedItems.find((i) => i.id === value.id)
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                            style={{ maxWidth: "100%" }}
                          >
                            {value.type === "file"
                              ? splitFileName(value.name).base
                              : value.name}
                            {value.type === "file" && (
                              <span
                                className={`text-xs ${
                                  selectedItems.find((i) => i.id === value.id)
                                    ? "text-white/70"
                                    : "text-gray-600"
                                }`}
                              >
                                {splitFileName(value.name).ext}
                              </span>
                            )}
                            {value.locked && (
                              <FiLock
                                className={`inline ml-1 ${
                                  selectedItems.find((i) => i.id === value.id)
                                    ? "text-white/70"
                                    : "text-gray-600"
                                }`}
                                title="Bị khóa"
                              />
                            )}
                          </span>
                            {isUploading && (
                              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                Đang upload
                                {driveProgressMap[value.id || value._id] != null && (
                                  <span className="ml-1 text-gray-600">
                                    ({driveProgressMap[value.id || value._id]}%)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600"
                        style={{
                          width: columnWidths.size,
                          minWidth: columnWidths.size,
                        }}
                      >
                        {formatSize(value.size)}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600 text-center"
                        style={{
                          width: columnWidths.fileCount,
                          minWidth: columnWidths.fileCount,
                        }}
                      >
                        {value.type === "folder"
                          ? value.fileCount !== undefined &&
                            value.fileCount !== null
                            ? value.fileCount
                            : 0
                          : "-"}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600"
                        style={{
                          width: columnWidths.date,
                          minWidth: columnWidths.date,
                        }}
                      >
                        {formatDate(value.date)}
                      </td>
                      <td
                        className="px-4 py-3 rounded-r-lg"
                        style={{
                          position: "relative",
                          width: columnWidths.actions,
                          minWidth: columnWidths.actions,
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
                                // Check if file has any URL available (temp or Drive)
                                const hasTemp = value.tempDownloadUrl && value.tempFileStatus === "completed";
                                const hasDrive = value.driveFileId || value.driveUrl || value.url;
                                
                                if (hasTemp || hasDrive) {
                                onDownload(value);
                                } else {
                                  // File not ready - could show toast here if needed
                                }
                              }}
                              title={
                                isUploading 
                                  ? "File đang upload lên Google Drive (có thể tải từ file tạm)" 
                                  : "Tải xuống"
                              }
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default Table;
