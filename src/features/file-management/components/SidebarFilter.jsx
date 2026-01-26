import { getFileIcon } from "@/shared/utils/getFileIcon";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  FiLayers,
  FiLink,
  FiUser,
  FiX,
  FiArrowUp,
  FiStar,
  FiFilter,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import { extMap } from "@/shared/utils/extMap";
import StorageUsage from "./StorageUsage";
import TagFilter from "./TagFilter";

export default function SidebarFilter({
  isMobile,
  open,
  onClose,
  loading,
  filter,
  onChangeFilter,
  members,
  tags = [],
  hideMemberFilter = false,
  onManageTags,
}) {
  const t = useTranslations();
  
  const fileTypes = Object.keys(extMap).map((ext) => ({
    key: ext,
    label: ext.toUpperCase(),
  }));

  if (isMobile && !open) return null;

  return (
    <>
      {/* Overlay - Show on both mobile and desktop when open */}
      {open && onClose && (
        <div
          className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-screen w-[280px] bg-white border-l border-gray-200 flex flex-col px-0 py-6 gap-2 z-50 overflow-y-auto overflow-x-hidden sidebar-scrollbar transition-all duration-300 ease-in-out transform ${
          isMobile
            ? open
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0 pointer-events-none"
            : open
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
        style={{
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderBottomLeftRadius: isMobile ? 16 : 0,
          boxShadow: isMobile || open ? "0 0 20px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {/* Header */}
        <div className="px-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-[16px]">
            <FiFilter className="text-brand" />
            {t("file.sidebar.filter_title") || "Bộ lọc"}
          </div>
          {onClose && (
            <button
              className="text-gray-400 hover:text-brand p-1 rounded-lg transition-all"
              onClick={onClose}
              aria-label={t("file.sidebar.close_filter")}
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Tag Filter */}
        <TagFilter 
          tags={tags} 
          selectedTagId={filter.tagId} 
          onChange={(tagId) => onChangeFilter({ ...filter, tagId })}
          onManageTags={onManageTags}
          loading={loading}
        />

        <div className="border-t border-gray-100 my-2"></div>

        {/* Type Filter */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px] mb-1">
            <FiLayers className="text-brand text-lg" />
            {t("file.sidebar.type")}
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
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-900 group text-[13px] ${
                    filter.type === "all"
                      ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "all" })}
                >
                  {t("file.sidebar.all")}
                  <span className={`w-2 h-2 rounded-full ml-auto transition ${filter.type === "all" ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-900 group text-[13px] ${
                    filter.type === "file"
                      ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "file" })}
                >
                  {t("file.sidebar.file")}
                  <span className={`w-2 h-2 rounded-full ml-auto transition ${filter.type === "file" ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-900 group text-[13px] ${
                    filter.type === "folder"
                      ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "folder" })}
                >
                  {t("file.sidebar.folder")}
                  <span className={`w-2 h-2 rounded-full ml-auto transition ${filter.type === "folder" ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Account Filter */}
        {!hideMemberFilter && (
          <div className="px-4 mb-2">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px] mb-1">
              <FiUser className="text-brand text-lg" />
              {t("file.sidebar.account")}
            </div>
            <ul className="flex flex-col gap-1 ml-2 mt-1 max-h-[150px] overflow-y-auto main-content-scrollbar">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
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
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-900 group text-[13px] ${
                      !filter.memberId
                        ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                        : ""
                    }`}
                    onClick={() =>
                      onChangeFilter({ ...filter, memberId: null })
                    }
                  >
                    {t("file.sidebar.all")}
                    <span className={`w-2 h-2 rounded-full ml-auto transition ${!filter.memberId ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                  </li>
                  {members &&
                    members.map((m) => (
                      <li
                        key={m._id || m.id}
                        className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-900 group text-[13px] ${
                          filter.memberId === (m._id || m.id)
                            ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                            : ""
                        }`}
                        onClick={() =>
                          onChangeFilter({ ...filter, memberId: m._id || m.id })
                        }
                      >
                        <span className="truncate">{m.fullName || m.name || m.email || m.username}</span>
                        <span className={`w-2 h-2 rounded-full ml-auto transition flex-shrink-0 ${filter.memberId === (m._id || m.id) ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                      </li>
                    ))}
                </>
              )}
            </ul>
          </div>
        )}

        {/* Sort */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px] mb-1">
            <FiArrowUp className="text-brand text-lg" /> {t("file.sidebar.sort") || "Sắp xếp"}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={80} height={16} />
                </li>
              ))
            ) : (
              <>
                {[
                  { key: "none", label: "Mặc định" },
                  { key: "name", label: "Theo tên" },
                  { key: "size", label: "Theo kích thước" },
                  { key: "date", label: "Theo ngày" },
                ].map((sort) => (
                  <li
                    key={sort.key}
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-900 group text-[13px] ${
                      (filter.sortBy === sort.key || (!filter.sortBy && sort.key === "none"))
                        ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                        : ""
                    }`}
                    onClick={() => onChangeFilter({ ...filter, sortBy: sort.key })}
                  >
                    {sort.label}
                    <span className={`w-2 h-2 rounded-full ml-auto transition ${(filter.sortBy === sort.key || (!filter.sortBy && sort.key === "none")) ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>

        {/* Favorites */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px] mb-1">
            <FiStar className="text-brand text-lg" /> {t("file.sidebar.favorites") || "Yêu thích"}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
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
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-900 group text-[13px] ${
                    !filter.showFavorites
                      ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                      : ""
                  }`}
                  onClick={() =>
                    onChangeFilter({ ...filter, showFavorites: false })
                  }
                >
                  {t("file.sidebar.all")}
                  <span className={`w-2 h-2 rounded-full ml-auto transition ${!filter.showFavorites ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-900 group text-[13px] ${
                    filter.showFavorites
                      ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                      : ""
                  }`}
                  onClick={() =>
                    onChangeFilter({ ...filter, showFavorites: true })
                  }
                >
                  Chỉ yêu thích
                  <span className={`w-2 h-2 rounded-full ml-auto transition ${filter.showFavorites ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                </li>
              </>
            )}
          </ul>
        </div>

        {/* File Types */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px] mb-1">
            <FiLink className="text-brand text-lg" />
            {t("file.sidebar.file_types")}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={100} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium group text-[13px] ${
                    !filter.fileType || filter.fileType === "all"
                      ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, fileType: "all" })}
                >
                  <span className="font-medium text-gray-900">
                    {t("file.sidebar.all")}
                  </span>
                  <span className={`w-2 h-2 rounded-full ml-auto transition ${(!filter.fileType || filter.fileType === "all") ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                </li>
                {fileTypes.map((type) => (
                  <li
                    key={type.key}
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg group text-[13px] ${
                      filter.fileType === type.key
                        ? "bg-brand-50 border border-brand-400 font-bold text-brand"
                        : ""
                    }`}
                    onClick={() =>
                      onChangeFilter({ ...filter, fileType: type.key })
                    }
                  >
                    <Image
                      src={getFileIcon({
                        type: type.key === "folder" ? "folder" : "file",
                        name: `file.${type.key}`,
                      })}
                      alt={type.label}
                      className="w-5 h-5 object-contain shrink-0"
                      width={20}
                      height={20}
                      priority
                    />
                    <span className="font-medium text-gray-900 truncate">
                      {type.label}
                    </span>
                    <span className={`w-2 h-2 rounded-full ml-auto transition shrink-0 ${filter.fileType === type.key ? "bg-brand" : "bg-gray-200 group-hover:bg-brand"}`} />
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}
