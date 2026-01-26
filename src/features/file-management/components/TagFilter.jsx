import React from "react";
import { FiTag, FiPlus, FiSettings } from "react-icons/fi";
import { useTranslations } from "next-intl";

const TagFilter = ({ tags, selectedTagId, onChange, onManageTags, loading }) => {
  const t = useTranslations();

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px]">
          <FiTag className="text-brand text-lg" />
          {t("file.sidebar.tags") || "Nhãn"}
        </div>
        <button
          onClick={onManageTags}
          className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
          title={t("file.sidebar.manage_tags") || "Quản lý nhãn"}
        >
          <FiSettings size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-16 bg-gray-100 rounded-full animate-pulse"></div>
          ))
        ) : (
          <>
            <button
              onClick={() => onChange(null)}
              className={`px-3 py-1 text-[12px] rounded-full border transition-all ${
                !selectedTagId
                  ? "bg-brand border-brand text-white font-bold shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-brand/50 hover:text-brand"
              }`}
            >
              {t("file.sidebar.all_tags") || "Tất cả"}
            </button>
            {tags.map((tag) => (
              <button
                key={tag._id}
                onClick={() => onChange(tag._id)}
                className={`px-3 py-1 text-[12px] rounded-full border flex items-center gap-1.5 transition-all ${
                  selectedTagId === tag._id
                    ? "border-transparent text-white font-bold shadow-md"
                    : "bg-white border-gray-200 text-gray-600 hover:scale-105"
                }`}
                style={{
                  backgroundColor: selectedTagId === tag._id ? tag.color : "transparent",
                  borderColor: selectedTagId === tag._id ? "transparent" : tag.color + "40",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: selectedTagId === tag._id ? "white" : tag.color,
                  }}
                ></span>
                {tag.name}
                {tag.filesCount > 0 && (
                  <span className={`text-[10px] ${selectedTagId === tag._id ? "text-white/80" : "text-gray-400"}`}>
                    ({tag.filesCount})
                  </span>
                )}
              </button>
            ))}
            {tags.length === 0 && !loading && (
              <div className="text-[12px] text-gray-400 italic py-2 w-full text-center">
                {t("file.sidebar.no_tags") || "Chưa có nhãn nào"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TagFilter;
