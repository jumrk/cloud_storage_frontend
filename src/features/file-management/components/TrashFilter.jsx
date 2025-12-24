"use client";

import { useTranslations } from "next-intl";
import { FiLayers, FiX, FiFilter } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import { extMap } from "@/shared/utils/extMap";

export default function TrashFilter({
  isMobile,
  open,
  onClose,
  loading,
  filter,
  onChangeFilter,
}) {
  const t = useTranslations();

  const fileTypes = Object.keys(extMap).map((ext) => ({
    key: ext,
    label: ext.toUpperCase(),
  }));

  if (isMobile && !open) return null;

  return (
    <>
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-screen w-[270px] bg-white border-l border-border flex flex-col px-0 py-6 gap-2 z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out transform ${
          isMobile
            ? open
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
            : "lg:translate-x-0 lg:opacity-100 hidden lg:flex"
        }`}
        style={{
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderBottomLeftRadius: isMobile ? 16 : 0,
          boxShadow: isMobile ? "0 0 20px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {isMobile && (
          <button
            className="absolute top-4 right-4 text-text-muted hover:text-brand text-2xl z-10 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={onClose}
            aria-label="Đóng bộ lọc"
          >
            <FiX />
          </button>
        )}

        {/* Lọc theo loại */}
        <div className="px-4 mb-2 mt-2">
          <div className="flex items-center gap-2 text-text-strong font-bold text-[14px] mb-1">
            <FiLayers className="text-brand text-lg" />
            Loại
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={60} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg font-medium text-text-strong group text-[13px] ${
                    !filter.type || filter.type === "all"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "all" })}
                >
                  Tất cả
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.type === "file"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "file" })}
                >
                  File
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.type === "folder"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "folder" })}
                >
                  Thư mục
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Lọc theo định dạng file */}
        {filter.type === "file" || !filter.type || filter.type === "all" ? (
          <div className="px-4 mb-2">
            <div className="flex items-center gap-2 text-text-strong font-bold text-[14px] mb-1">
              <FiFilter className="text-brand text-lg" />
              Định dạng
            </div>
            <ul className="flex flex-col gap-1 ml-2 mt-1 max-h-60 overflow-y-auto">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                  >
                    <Skeleton width={60} height={16} />
                  </li>
                ))
              ) : (
                <>
                  <li
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg font-medium group text-[13px] ${
                      !filter.fileType || filter.fileType === "all"
                        ? "bg-brand-50 border border-brand-400 font-bold"
                        : ""
                    }`}
                    onClick={() =>
                      onChangeFilter({ ...filter, fileType: "all" })
                    }
                  >
                    <span className="font-medium text-text-strong">Tất cả</span>
                    <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                  </li>
                  {fileTypes.map((type) => (
                    <li
                      key={type.key}
                      className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg group text-[13px] ${
                        filter.fileType === type.key
                          ? "bg-brand-50 border border-brand-400 font-bold"
                          : ""
                      }`}
                      onClick={() =>
                        onChangeFilter({ ...filter, fileType: type.key })
                      }
                    >
                      <span className="text-text-strong">{type.label}</span>
                      <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        ) : null}
      </aside>
    </>
  );
}

