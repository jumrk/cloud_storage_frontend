import React from "react";
import { IoMoveOutline } from "react-icons/io5";
import { FiDownload, FiShare2, FiUserPlus } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import toast from "react-hot-toast";
import Button_icon from "@/components/ui/Button_icon";

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
  showMoveModal,
  setShowMoveModal,
  canGrantPermission = true, // thêm prop này, default true
}) {
  const [copiedShareMobile, setCopiedShareMobile] = React.useState(false);

  // Mobile: action zone bên phải
  if (isMobile && selectedItems.length > 0) {
    return (
      <div
        className={`fixed top-1/2 right-2 z-50 flex flex-col gap-4 items-center -translate-y-1/2 transition-all duration-500 ${
          selectedItems.length > 0
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10 pointer-events-none"
        }`}
        style={{ pointerEvents: "auto" }}
      >
        {/* Cấp quyền */}
        {canGrantPermission && (
          <CircleActionButton
            icon={<FiUserPlus size={26} />}
            bg="bg-[#1cadd9]"
            onClick={() =>
              onGrantPermission && onGrantPermission(selectedItems)
            }
            ariaLabel="Cấp quyền"
          />
        )}
        {/* Chia sẻ */}
        {selectedItems.length === 1 && (
          <CircleActionButton
            icon={<FiShare2 size={26} />}
            bg="bg-blue-500"
            onClick={() => {
              if (onShare) onShare(selectedItems[0]);
              setCopiedShareMobile(true);
              const shareUrl = `${window.location.origin}/share/${selectedItems[0].id}`;
              navigator.clipboard.writeText(shareUrl);
              toast.success("Đã copy link!");
              setTimeout(() => setCopiedShareMobile(false), 1500);
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
        {/* Di chuyển */}
        <CircleActionButton
          icon={<IoMoveOutline size={28} />}
          bg="bg-primary"
          onClick={() => onMove && onMove(selectedItems)}
          ariaLabel="Di chuyển"
        />
        {/* Tải xuống */}
        {selectedItems.length === 1 && selectedItems[0].type === "file" && (
          <CircleActionButton
            icon={<FiDownload size={26} />}
            bg="bg-[#828DAD]"
            onClick={() => onDownload && onDownload(selectedItems)}
            ariaLabel="Tải xuống"
          />
        )}
        {/* Xóa */}
        <CircleActionButton
          icon={<RiDeleteBin6Line size={26} />}
          bg="bg-[#DC2626]"
          onClick={() => onDelete && onDelete(selectedItems)}
          ariaLabel="Xóa"
        />
      </div>
    );
  }

  // Desktop: action zone khi kéo thả
  if (!isMobile && draggedItems.length > 0) {
    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-8 bg-white/80 rounded-xl shadow-2xl p-6 border border-gray-200">
        {canGrantPermission && (
          <Button_icon
            text="Cấp quyền"
            icon={<FiUserPlus size={28} />}
            bg="bg-[#1cadd9]"
            draggedItems={draggedItems}
            onDropAction={onGrantPermission}
          />
        )}
        <Button_icon
          text="Di chuyển"
          icon={<IoMoveOutline size={28} />}
          bg="bg-primary"
          draggedItems={draggedItems}
          onDropAction={onMove}
        />
        {draggedItems.length === 1 && draggedItems[0].type === "file" && (
          <Button_icon
            text="Tải xuống"
            icon={<FiDownload size={26} />}
            bg="bg-[#828DAD]"
            draggedItems={draggedItems}
            onDropAction={onDownload}
          />
        )}
        <Button_icon
          text="Xóa"
          icon={<RiDeleteBin6Line size={26} />}
          bg="bg-[#DC2626]"
          draggedItems={draggedItems}
          onDropAction={onDelete}
        />
      </div>
    );
  }

  return null;
}
