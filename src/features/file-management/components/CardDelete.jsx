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
      className={`group relative w-full max-w-[180px] flex-1 basis-1/2 sm:basis-auto overflow-hidden m-2 bg-white rounded-2xl p-4 h-[160px] transition-all duration-300 shadow hover:shadow-xl hover:-translate-y-1 flex flex-col justify-center items-center cursor-pointer border border-gray-100 ${
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
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-30 opacity-0 translate-x-3 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto">
          <button
            className="text-green-500 hover:text-green-700 bg-white/90 rounded-full p-1.5 shadow-sm transition-colors"
            title="Khôi phục"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onRestore) {
                onRestore(data);
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            type="button"
          >
            <FiRotateCw size={16} />
          </button>
          <button
            className="text-red-500 hover:text-red-700 bg-white/90 rounded-full p-1.5 shadow-sm transition-colors"
            title="Xóa vĩnh viễn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onPermanentDelete) {
                onPermanentDelete(data);
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
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
        className="w-14 h-14 mb-2 object-contain drop-shadow"
        width={56}
        height={56}
        placeholder="blur"
        blurDataURL="data:image/png;base64,..."
        priority
      />

      <p className="text-center text-sm font-sm truncate w-full mt-1 text-gray-800 select-none">
        {data.name}
      </p>

      <p className="text-center text-xs text-gray-500 mt-1">
        {formatDate(data.deletedAt || data.date)}
      </p>
    </div>
  );
}

export default CardDelete;

