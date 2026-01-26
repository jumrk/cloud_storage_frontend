import React from "react";
import { FiFile, FiFolder, FiSearch, FiClock } from "react-icons/fi";
import { useTranslations } from "next-intl";

const SearchSuggestions = ({ suggestions, loading, onSelect, visible }) => {
  const t = useTranslations();

  if (!visible || (!loading && (!suggestions || suggestions.length === 0))) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gợi ý tìm kiếm</span>
        {loading && <div className="w-3 h-3 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />}
      </div>
      
      <div className="max-h-[400px] overflow-y-auto main-content-scrollbar py-2">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-brand/5 transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 ${
              item.type === 'folder' ? 'bg-blue-50 text-blue-500' : 'bg-brand/10 text-brand'
            }`}>
              {item.type === 'folder' ? <FiFolder size={18} /> : <FiFile size={18} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate group-hover:text-brand transition-colors">
                {item.name || item.originalName}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  {item.type}
                </span>
                {item.folderName && (
                  <span className="text-[10px] text-gray-300 flex items-center gap-1">
                    <FiFolder size={10} /> {item.folderName}
                  </span>
                )}
              </div>
            </div>
            
            <FiSearch className="text-gray-200 group-hover:text-brand transition-colors" size={14} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchSuggestions;
