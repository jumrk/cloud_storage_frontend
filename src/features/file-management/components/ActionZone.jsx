import React from "react";
import { IoMoveOutline } from "react-icons/io5";
import {
  FiDownload,
  FiShare2,
  FiUserPlus,
  FiRotateCw,
  FiTrash2,
} from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ================= ACTION BUTTON COMPONENT =================
const ActionBtn = ({
  icon,
  label,
  colorClass = "text-gray-700 hover:bg-gray-100", // Tailwind formatting
  onClick,
  draggedItems,
  onDropAction,
  disabled = false,
  danger = false,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  // Handle Drag Events if onDropAction is present
  const handleDragOver = (e) => {
    if (draggedItems && draggedItems.length > 0 && onDropAction) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (draggedItems && draggedItems.length > 0 && onDropAction) {
      onDropAction(draggedItems);
    }
  };

  return (
    <div className="relative group flex flex-col items-center">
      <motion.button
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        disabled={disabled}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex items-center justify-center p-3 rounded-xl transition-colors duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${
            danger
              ? "text-red-500 hover:bg-red-50"
              : isDragOver
              ? "bg-brand/20 text-brand ring-2 ring-brand scale-110"
              : colorClass
          }
        `}
        title={label}
      >
        {icon}
        {/* Drag Overlay Glow */}
        {isDragOver && (
          <motion.div
            layoutId="drag-glow"
            className="absolute inset-0 rounded-xl bg-brand/10 z-[-1]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </motion.button>
      {/* Tooltip-ish Label on Hover */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <div className="bg-gray-800 text-white text-[10px] py-1 px-2 rounded-md shadow-lg font-medium">
          {label}
        </div>
      </div>
    </div>
  );
};

// ================= MAIN ACTION ZONE =================
export default function ActionZone({
  isMobile,
  selectedItems = [],
  draggedItems = [],
  onMove,
  onDownload,
  onDelete,
  onShare,
  onGrantPermission,
  canGrantPermission = true,
  onRestore,
  onPermanentDelete,
  showRestore = false,
  showPermanentDelete = false,
}) {
  // Determine if we are showing the bar
  const isActive =
    (isMobile && selectedItems.length > 0) ||
    (!isMobile && draggedItems.length > 0) ||
    (!isMobile && selectedItems.length > 0 && (showRestore || showPermanentDelete));

  // Count items
  const itemCount = isMobile || (selectedItems.length > 0 && !draggedItems.length)
    ? selectedItems.length
    : draggedItems.length;

  const items = isMobile || (selectedItems.length > 0 && !draggedItems.length)
    ? selectedItems
    : draggedItems;

  const allFolders = items.length > 0 && items.every((i) => i.type === "folder");
  const hasFile = items.some((i) => i.type === "file");
  const isTrashPage = showRestore || showPermanentDelete;

  // Animation Variants
  const islandVariants = {
    hidden: { y: 100, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 25,
        mass: 0.8
      }
    },
    exit: { 
      y: 100, 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2, ease: "easeInOut" }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          layout
          variants={islandVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center p-2 rounded-2xl bg-white/90 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-gray-900/5 select-none overflow-hidden"
        >
          {/* INFO BADGE */}
          <motion.div layout className="flex items-center gap-2 px-3 pl-4 py-1.5 mr-1 text-sm font-semibold text-gray-700 bg-gray-100/50 rounded-xl border border-gray-200/50">
            <motion.span 
              key={itemCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center w-5 h-5 bg-brand text-white rounded-full text-[10px]"
            >
              {itemCount}
            </motion.span>
            <span className="hidden sm:inline">Đã chọn</span>
          </motion.div>

          <motion.div layout className="w-[1px] h-8 bg-gray-200 mx-2" />

          {/* ACTIONS GROUP */}
          <div className="flex items-center gap-1">
            
            {/* 1. Restore (Trash Only) */}
            {showRestore && (
              <ActionBtn
                icon={<FiRotateCw size={22} />}
                label="Khôi phục"
                colorClass="text-green-600 hover:bg-green-50"
                onClick={() => onRestore && onRestore()}
                // Also support drag drop for desktop drag mode if needed (rare for restore)
                draggedItems={draggedItems}
                onDropAction={onRestore}
              />
            )}

            {/* 2. Grant Permission (Normal) */}
            {!isTrashPage && canGrantPermission && allFolders && (
              <ActionBtn
                icon={<FiUserPlus size={22} />}
                label="Cấp quyền"
                colorClass="text-[#1cadd9] hover:bg-[#1cadd9]/10"
                onClick={() => onGrantPermission && onGrantPermission(items)}
                draggedItems={draggedItems}
                onDropAction={onGrantPermission}
              />
            )}

            {/* 3. Share (Normal, Single Item) */}
            {!isTrashPage && itemCount === 1 && (
              <ActionBtn
                icon={<FiShare2 size={22} />}
                label="Chia sẻ"
                colorClass="text-blue-600 hover:bg-blue-50"
                onClick={() => onShare && onShare(items[0])}
                draggedItems={draggedItems}
                onDropAction={(dropped) => onShare && onShare(dropped[0])}
              />
            )}

            {/* 4. Move (Normal) */}
            {!isTrashPage && (
              <ActionBtn
                icon={<IoMoveOutline size={22} />}
                label="Di chuyển"
                colorClass="text-indigo-600 hover:bg-indigo-50"
                onClick={() => onMove && onMove(items)}
                draggedItems={draggedItems}
                onDropAction={onMove}
              />
            )}

            {/* 5. Download (Normal, Files) */}
            {!isTrashPage && hasFile && (
              <ActionBtn
                icon={<FiDownload size={22} />}
                label="Tải xuống"
                colorClass="text-gray-600 hover:bg-gray-100"
                onClick={() => {
                   const filesOnly = items.filter(i => i.type === "file");
                   // Smart filter for ready files
                   const readyFiles = filesOnly.filter((f) => {
                     const hasTemp = f.tempDownloadUrl && f.tempFileStatus === "completed";
                     const hasDrive = f.driveFileId || f.driveUrl || f.url;
                     return hasTemp || hasDrive;
                   });

                   if (readyFiles.length > 0 && onDownload) {
                     onDownload(readyFiles);
                   } else if (filesOnly.length > 0) {
                     toast.error("File đang xử lý, vui lòng chờ...");
                   }
                }}
                draggedItems={draggedItems}
                onDropAction={(dropped) => {
                   // Same logic for drop
                   const filesOnly = dropped.filter(i => i.type === "file");
                   const readyFiles = filesOnly.filter((f) => (f.tempDownloadUrl && f.tempFileStatus === "completed") || f.driveFileId || f.driveUrl || f.url);
                   if (readyFiles.length > 0 && onDownload) onDownload(readyFiles);
                }}
              />
            )}
            
          </div>

          {/* DESTRUCTIVE GROUP */}
          {(showPermanentDelete || (!isTrashPage && !showPermanentDelete)) && (
            <motion.div layout className="flex items-center">
              <motion.div layout className="w-[1px] h-8 bg-gray-200 mx-2" />
              <div className="flex items-center">
                 {/* Permanent Delete */}
                 {showPermanentDelete && (
                    <ActionBtn
                      icon={<FiTrash2 size={22} />}
                      label="Xóa vĩnh viễn"
                      danger
                      onClick={() => onPermanentDelete && onPermanentDelete()}
                      draggedItems={draggedItems}
                      onDropAction={onPermanentDelete}
                    />
                 )}
                 {/* Regular Delete */}
                 {!showPermanentDelete && !showRestore && (
                    <ActionBtn
                      icon={<RiDeleteBin6Line size={22} />}
                      label="Xóa"
                      danger
                      onClick={() => onDelete && onDelete(items)}
                      draggedItems={draggedItems}
                      onDropAction={onDelete}
                    />
                 )}
              </div>
            </motion.div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
