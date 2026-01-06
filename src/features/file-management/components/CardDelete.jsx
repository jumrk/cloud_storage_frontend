import React from "react";
import { getFileIcon } from "@/shared/utils/getFileIcon";
import { FiRotateCw, FiTrash2 } from "react-icons/fi";
import Image from "next/image";

function CardDelete({
  data,
  selectedItems = [],
  onSelectItem,
  onRestore,
  onPermanentDelete,
}) {
  const isFolder = data.type === "folder";
  const icon = getFileIcon({ type: data.type, name: data.name });
  const checked = !!selectedItems.find((i) => i.id === data.id);
  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      ));

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleString("vi-VN");
  };

  const getDaysUntilPermanentDelete = (deletedAt) => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = now - deleted;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  const daysLeft = getDaysUntilPermanentDelete(data.deletedAt || data.date);

  return (
    <div
      className={`group relative w-full flex-1 overflow-hidden bg-white rounded-xl p-3 h-[140px] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-center items-center cursor-pointer border border-gray-100 ${
        isFolder ? "hover:bg-blue-50" : "hover:bg-gray-50"
      }`}
      title={data.name}
    >
      {/* Checkbox chọn file/folder */}
      <input
        type="checkbox"
        id={`card_delete_check_${data.id}`}
        className="peer hidden"
        checked={checked}
        onChange={() => onSelectItem && onSelectItem(data)}
        onClick={(e) => e.stopPropagation()}
      />
      <label
        htmlFor={`card_delete_check_${data.id}`}
        className="card-checkbox absolute top-2 left-2 w-5 h-5 rounded-sm bg-[#C7C7C7] cursor-pointer flex items-center justify-center peer-checked:bg-primary peer-checked:after:content-['✔'] peer-checked:after:text-white peer-checked:after:text-[13px] peer-checked:after:absolute peer-checked:after:top-[2px] peer-checked:after:left-[5px]"
        style={{ zIndex: 10 }}
        onClick={(e) => e.stopPropagation()}
      ></label>

      {/* Icon khôi phục / xóa vĩnh viễn desktop */}
      {!isMobile && (
        <div
          className="absolute top-3 right-3 flex flex-col gap-2 z-50 opacity-0 translate-x-3 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto"
          onClick={(e) => {
            // Stop propagation to prevent parent onClick from firing
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onMouseDown={(e) => {
            // Also stop on mousedown to prevent any event bubbling
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          <button
            className="text-green-500 hover:text-green-700 bg-white rounded-full p-1.5 shadow-sm transition-colors"
            title="Khôi phục"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              e.nativeEvent.stopImmediatePropagation();
              if (onRestore) {
                onRestore(data);
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            type="button"
          >
            <FiRotateCw size={16} />
          </button>
          <button
            className="text-red-500 hover:text-red-700 bg-white rounded-full p-1.5 shadow-sm transition-colors relative z-50"
            title="Xóa vĩnh viễn"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              e.nativeEvent.stopImmediatePropagation();
              if (onPermanentDelete) {
                // Ensure data has required fields
                if (data && (data.id || data._id) && data.type) {
                  // Normalize data to ensure it has 'id' field
                  const normalizedData = {
                    ...data,
                    id: data.id || data._id,
                  };
                  onPermanentDelete(normalizedData);
                }
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            type="button"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )}

      <Image
        src={icon}
        alt="icon"
        className="w-12 h-12 mb-1.5 object-contain drop-shadow"
        width={48}
        height={48}
        placeholder="blur"
        blurDataURL="data:image/png;base64,..."
        priority
      />
      <p className="text-center text-xs font-medium truncate w-full mt-1 text-gray-800 select-none leading-tight">
        {data.name}
      </p>
      <p className="text-center text-[10px] text-gray-500 mt-0.5">
        {formatDate(data.deletedAt || data.date)}
      </p>
    </div>
  );
}

export default CardDelete;
