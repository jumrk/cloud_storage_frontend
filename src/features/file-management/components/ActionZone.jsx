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
import Button_icon from "@/shared/ui/ButtonIcon";

function CircleActionButton({ icon, bg, onClick, ariaLabel, children }) {
  return (
    <button
      className={`flex items-center justify-center w-12 h-12 rounded-full ${bg} text-white text-2xl shadow hover:scale-110 active:scale-95 transition-all relative`}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

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
  const [copiedShareMobile, setCopiedShareMobile] = React.useState(false);

  // Mobile: action zone bên phải
  if (isMobile && selectedItems.length > 0) {
    const allFolders = selectedItems.every((item) => item.type === "folder");
    const isTrashPage = showRestore || showPermanentDelete;

    return (
      <div
        className={`fixed top-1/2 right-2 z-50 flex flex-col gap-4 items-center -translate-y-1/2 transition-all duration-500 ${
          selectedItems.length > 0
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10 pointer-events-none"
        }`}
        style={{ pointerEvents: "auto" }}
      >
        {/* Cấp quyền - chỉ hiện khi không phải trash page */}
        {!isTrashPage && canGrantPermission && allFolders && (
          <CircleActionButton
            icon={<FiUserPlus size={26} />}
            bg="bg-[#1cadd9]"
            onClick={() =>
              onGrantPermission && onGrantPermission(selectedItems)
            }
            ariaLabel="Cấp quyền"
          />
        )}
        {/* Chia sẻ - chỉ hiện khi không phải trash page */}
        {!isTrashPage && selectedItems.length === 1 && (
          <CircleActionButton
            icon={<FiShare2 size={26} />}
            bg="bg-blue-500"
            onClick={() => {
              if (onShare && selectedItems[0]) {
                onShare(selectedItems[0]);
              }
            }}
            ariaLabel="Chia sẻ"
          >
            {copiedShareMobile && (
              <span
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 text-green-600 text-xs bg-white px-2 py-1 rounded shadow"
                style={{ whiteSpace: "nowrap", zIndex: 100 }}
              >
                Đã copy link!
              </span>
            )}
          </CircleActionButton>
        )}
        {/* Di chuyển - chỉ hiện khi không phải trash page */}
        {!isTrashPage && (
          <CircleActionButton
            icon={<IoMoveOutline size={28} />}
            bg="bg-primary"
            onClick={() => onMove && onMove(selectedItems)}
            ariaLabel="Di chuyển"
          />
        )}
        {/* Tải xuống - chỉ hiện khi không phải trash page và có ít nhất 1 file được chọn */}
        {!isTrashPage && selectedItems.some((item) => item.type === "file") && (
          <CircleActionButton
            icon={<FiDownload size={26} />}
            bg="bg-[#828DAD]"
            onClick={() => {
              // Lọc chỉ lấy file (không lấy folder)
              const filesOnly = selectedItems.filter(
                (item) => item.type === "file"
              );
              if (filesOnly.length > 0 && onDownload) {
                onDownload(filesOnly);
              }
            }}
            ariaLabel={
              selectedItems.length === 1
                ? "Tải xuống"
                : `Tải xuống ${
                    selectedItems.filter((item) => item.type === "file").length
                  } file`
            }
          />
        )}
        {/* Khôi phục */}
        {showRestore && (
          <CircleActionButton
            icon={<FiRotateCw size={26} />}
            bg="bg-green-500"
            onClick={() => onRestore && onRestore()}
            ariaLabel="Khôi phục"
          />
        )}
        {/* Xóa vĩnh viễn */}
        {showPermanentDelete && (
          <CircleActionButton
            icon={<FiTrash2 size={26} />}
            bg="bg-red-600"
            onClick={() => onPermanentDelete && onPermanentDelete()}
            ariaLabel="Xóa vĩnh viễn"
          />
        )}
        {/* Xóa - chỉ hiện khi không phải trash page */}
        {!showPermanentDelete && (
          <CircleActionButton
            icon={<RiDeleteBin6Line size={26} />}
            bg="bg-[#DC2626]"
            onClick={() => onDelete && onDelete(selectedItems)}
            ariaLabel="Xóa"
          />
        )}
      </div>
    );
  }

  // Desktop: action zone khi kéo thả
  if (!isMobile && draggedItems.length > 0) {
    const allFolders = draggedItems.every((item) => item.type === "folder");
    const isTrashPage = showRestore || showPermanentDelete;

    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-2 sm:gap-4 md:gap-6 lg:gap-8 bg-white/80 rounded-xl shadow-2xl p-2 sm:p-4 md:p-6 border border-gray-200 pointer-events-none max-w-[95vw] overflow-x-auto animate-slide-up">
        {/* Cấp quyền - chỉ hiện khi không phải trash page */}
        {!isTrashPage && canGrantPermission && allFolders && (
          <Button_icon
            text="Cấp quyền"
            icon={<FiUserPlus size={28} />}
            bg="bg-[#1cadd9]"
            draggedItems={draggedItems}
            onDropAction={onGrantPermission}
          />
        )}
        {/* Chia sẻ - chỉ hiện khi không phải trash page và chọn 1 item */}
        {!isTrashPage && draggedItems.length === 1 && (
          <Button_icon
            text="Chia sẻ"
            icon={<FiShare2 size={26} />}
            bg="bg-blue-500"
            draggedItems={draggedItems}
            onDropAction={(items) => onShare && onShare(items[0])}
          />
        )}
        {/* Di chuyển - chỉ hiện khi không phải trash page */}
        {!isTrashPage && (
          <Button_icon
            text="Di chuyển"
            icon={<IoMoveOutline size={28} />}
            bg="bg-primary"
            draggedItems={draggedItems}
            onDropAction={onMove}
          />
        )}
        {/* Tải xuống - chỉ hiện khi không phải trash page và có ít nhất 1 file được kéo */}
        {!isTrashPage && draggedItems.some((item) => item.type === "file") && (
          <Button_icon
            text={
              draggedItems.length === 1
                ? "Tải xuống"
                : `Tải xuống ${
                    draggedItems.filter((item) => item.type === "file").length
                  } file`
            }
            icon={<FiDownload size={26} />}
            bg="bg-[#828DAD]"
            draggedItems={draggedItems}
            onDropAction={(items) => {
              // Lọc chỉ lấy file (không lấy folder)
              const filesOnly = items.filter((item) => item.type === "file");
              if (filesOnly.length > 0 && onDownload) {
                onDownload(filesOnly);
              }
            }}
          />
        )}
        {/* Khôi phục */}
        {showRestore && (
          <Button_icon
            text="Khôi phục"
            icon={<FiRotateCw size={26} />}
            bg="bg-green-500"
            draggedItems={draggedItems}
            onDropAction={onRestore}
          />
        )}
        {/* Xóa vĩnh viễn */}
        {showPermanentDelete && (
          <Button_icon
            text="Xóa vĩnh viễn"
            icon={<FiTrash2 size={26} />}
            bg="bg-red-600"
            draggedItems={draggedItems}
            onDropAction={onPermanentDelete}
          />
        )}
        {/* Xóa - chỉ hiện khi không phải trash page */}
        {!showPermanentDelete && (
          <Button_icon
            text="Xóa"
            icon={<RiDeleteBin6Line size={26} />}
            bg="bg-[#DC2626]"
            draggedItems={draggedItems}
            onDropAction={onDelete}
          />
        )}
      </div>
    );
  }

  // Desktop: action zone khi chọn items (cho trash page)
  if (
    !isMobile &&
    selectedItems.length > 0 &&
    (showRestore || showPermanentDelete)
  ) {
    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-8 bg-white/80 rounded-xl shadow-2xl p-6 border border-gray-200 animate-slide-up">
        {showRestore && (
          <button
            onClick={() => onRestore && onRestore()}
            className="flex gap-1 sm:gap-2 items-center justify-center bg-green-500 text-white rounded-[12px] shadow-xl/20 transition-all duration-200 min-w-[80px] sm:min-w-[100px] md:min-w-[120px] min-h-[40px] sm:min-h-[44px] md:min-h-[48px] px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-semibold hover:scale-105 active:scale-95 pointer-events-auto"
          >
            <p className="hidden sm:inline">Khôi phục</p>
            <FiRotateCw size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}
        {showPermanentDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onPermanentDelete) {
                onPermanentDelete();
              }
            }}
            className="flex gap-1 sm:gap-2 items-center justify-center bg-red-600 text-white rounded-[12px] shadow-xl/20 transition-all duration-200 min-w-[80px] sm:min-w-[100px] md:min-w-[120px] min-h-[40px] sm:min-h-[44px] md:min-h-[48px] px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-semibold hover:scale-105 active:scale-95 pointer-events-auto"
          >
            <p className="hidden sm:inline">Xóa vĩnh viễn</p>
            <FiTrash2 size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}
      </div>
    );
  }

  return null;
}
