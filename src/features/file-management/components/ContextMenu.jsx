import React, { useEffect, useRef, useState } from "react";
import { 
  FiEye, FiDownload, FiShare2, FiEdit2, FiMove, 
  FiTag, FiLock, FiUnlock, FiTrash2, FiClock, FiActivity, FiX, FiCheck, FiChevronRight
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useTranslations } from "next-intl";

const ContextMenu = ({ 
  x, y, onClose, item, 
  onPreview, onDownload, onShare, onRename, onMove,
  onTag, onLock, onUnlock, onDelete, onVersions, onActivity,
  isFavorite, onToggleFavorite, favoriteLoading,
  tags = [],
  triggerRect // New prop
}) => {
  const t = useTranslations();
  const menuRef = useRef(null);
  const [showTagsSubmenu, setShowTagSubmenu] = useState(false);
  const [position, setPosition] = useState({ left: x, top: y });
  const [maxHeight, setMaxHeight] = useState("auto");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  React.useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let newLeft = x;
      let newTop = y;
      let newMaxHeight = screenHeight - 20;

      if (triggerRect) {
        // Center horizontally relative to trigger
        const triggerCenter = triggerRect.left + triggerRect.width / 2;
        newLeft = triggerCenter - rect.width / 2;
        
        // Position strictly below trigger
        newTop = triggerRect.bottom + 5; // 5px gap
        
        // Calculate max height to fit screen bottom
        const availableHeight = screenHeight - newTop - 10; // 10px bottom margin
        
        // If available height is too small (less than 150px) and there is more space above
        // We might want to flip, BUT user requested to prioritize "Below" and "Scroll"
        // typically context menus flip. But "always below" was requested.
        // We will respect "Always Below" unless it's strictly unusable (< 100px)
        // If < 100px, we might force flip? Or just let it be small?
        // User said "dưới quá thì có thể cho scorll" -> implies keeping it below.
        newMaxHeight = availableHeight;
      } else {
        // Desktop / Default behavior: Flip if needed
        if (x + rect.width > screenWidth) newLeft = x - rect.width;
        if (y + rect.height > screenHeight) newTop = y - rect.height;
      }

      // Horizontal safety bounds
      if (newLeft < 10) newLeft = 10;
      if (newLeft + rect.width > screenWidth) newLeft = screenWidth - rect.width - 10;
      
      // Vertical safety bounds check (for default mode mainly)
      if (newTop < 10) newTop = 10;
      
      setPosition({ left: newLeft, top: newTop });
      setMaxHeight(newMaxHeight);
    }
  }, [x, y, triggerRect]);

  const pos = position;

  const MenuItem = ({ icon, label, onClick, danger = false, disabled = false, sub = false, isOpen = false }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick();
          if (!sub) onClose();
        }
      }}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
        danger 
          ? "text-red-600 hover:bg-red-50" 
          : "text-gray-700 hover:bg-gray-100"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${sub ? "justify-between" : ""}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {sub && (
        <div className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
             <FiChevronRight size={16} className="text-gray-400" />
        </div>
      )}
    </button>
  );

  return (
    <div
      ref={menuRef}
      className={`fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[220px] animate-in fade-in zoom-in duration-100 overflow-y-auto main-content-scrollbar`}
      style={{ 
        left: pos.left, 
        top: pos.top, 
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
      }}
    >
      <div className="px-4 py-2 border-b border-gray-50 mb-1">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[180px]">
          {item.name || item.originalName}
        </p>
      </div>

      <MenuItem 
        icon={<FiEye />} 
        label={t("file.context.preview") || "Xem trước"} 
        onClick={onPreview}
        disabled={item.type === "folder"}
      />
      
      <MenuItem 
        icon={<FiDownload />} 
        label={t("file.context.download") || "Tải xuống"} 
        onClick={onDownload}
        disabled={item.type === "folder"}
      />

      <MenuItem 
        icon={<FiShare2 />} 
        label={t("file.context.share") || "Chia sẻ nâng cao"} 
        onClick={onShare}
      />

      {item.type === "file" && (
        <MenuItem 
          icon={favoriteLoading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          ) : isFavorite ? <FaStar className="text-amber-500" /> : <FaRegStar />} 
          label={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"} 
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
        />
      )}

      <div className="h-px bg-gray-100 my-1" />

      <MenuItem 
        icon={<FiEdit2 />} 
        label={t("file.context.rename") || "Đổi tên"} 
        onClick={onRename}
      />

      <MenuItem 
        icon={<FiMove />} 
        label={t("file.context.move") || "Di chuyển"} 
        onClick={onMove}
      />

      {/* Tags Accordion */}
      <div>
        <MenuItem 
          icon={<FiTag />} 
          label={t("file.context.tags") || "Nhãn"} 
          onClick={() => setShowTagSubmenu(!showTagsSubmenu)}
          sub
          isOpen={showTagsSubmenu}
        />
        {showTagsSubmenu && (
          <div className="bg-gray-50 border-y border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
            {tags.length === 0 ? (
              <div className="px-10 py-2 text-xs text-gray-400 italic">Chưa có nhãn nào</div>
            ) : (
              tags.map(tag => (
                <button
                  key={tag._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTag(tag._id);
                    // Don't close menu to allow multi-select
                  }}
                  className="w-full flex items-center gap-2 px-10 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/5" style={{ backgroundColor: tag.color }} />
                  <span className="flex-1 text-left truncate text-xs">{tag.name}</span>
                  {item.tags?.includes(tag._id) && <FiCheck className="text-brand" size={12} />}
                </button>
              ))
            )}
          </div>
        )}
      </div>


      {item.lockedBy ? (
        <MenuItem 
          icon={<FiUnlock />} 
          label={t("file.context.unlock") || "Mở khóa"} 
          onClick={onUnlock}
        />
      ) : (
        <MenuItem 
          icon={<FiLock />} 
          label={t("file.context.lock") || "Khóa tệp"} 
          onClick={onLock}
          disabled={item.type === "folder"}
        />
      )}

      <MenuItem 
        icon={<FiClock />} 
        label={t("file.context.versions") || "Phiên bản cũ"} 
        onClick={onVersions}
        disabled={item.type === "folder"}
      />

      <MenuItem 
        icon={<FiActivity />} 
        label={t("file.context.activity") || "Lịch sử hoạt động"} 
        onClick={onActivity}
      />

      <div className="h-px bg-gray-100 my-1" />

      <MenuItem 
        icon={<FiTrash2 />} 
        label={t("file.context.delete") || "Xóa tệp"} 
        onClick={onDelete}
        danger
      />
    </div>
  );
};

export default ContextMenu;
